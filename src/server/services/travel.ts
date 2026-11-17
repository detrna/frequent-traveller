/** Control untuk Manager Travel: status booking (US7), otorisasi kode (US9), pesan untuk pengunjung (US8). */
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { db } from "@/server/db";
import { GalatBisnis, GalatValidasi } from "@/server/errors";
import { validasi } from "@/server/validation/common";
import { dataPengunjungSkema, filterStatusSkema, halamanSkema, kodeBookingSkema } from "@/server/validation/travel";
import { buatBookingDiTransaksi } from "./booking";
import { kirimEtiket, type HasilKirimEtiket } from "./etiket";
import type { Prisma } from "@/generated/prisma/client";
import type { StatusBooking } from "@/generated/prisma/enums";
import type { EmailDriver } from "@/server/email";

/** Pesan wajib dari US9-b — jangan diubah. */
export const PESAN_KODE_TIDAK_SESUAI = "kode booking reference tidak sesuai";

const UKURAN_HALAMAN = 20;

const INCLUDE_BOOKING = {
  pemilik: { select: { nama: true, email: true } },
  pengunjung: true,
  tiket: { include: { penerbangan: { include: { maskapai: true, asal: true, tujuan: true } } }, orderBy: { createdAt: "asc" } },
} satisfies Prisma.BookingInclude;

export type BookingTravel = Prisma.BookingGetPayload<{ include: typeof INCLUDE_BOOKING }>;

// ---------- US7 ----------

export interface HasilStatusBooking {
  booking: BookingTravel[];
  filter: StatusBooking | undefined;
  halaman: number;
  totalHalaman: number;
  total: number;
  /** Jumlah per status (tidak terpengaruh filter), untuk ringkasan di atas tabel. */
  jumlahPerStatus: Record<StatusBooking, number>;
}

/** "Mengambil Status Booking" (semua) dan "Memfilter Status Booking" (confirmed / booked / waiting for the payment). */
export async function ambilStatusBooking(masukan: { status?: unknown; halaman?: unknown }): Promise<HasilStatusBooking> {
  const filter = validasi(filterStatusSkema, masukan.status);
  if (!filter.ok) throw new GalatBisnis(Object.values(filter.galat)[0] ?? "Status tidak dikenal.", "VALIDASI");
  const status = filter.data;
  const halamanMinta = validasi(halamanSkema, masukan.halaman);
  const halaman = halamanMinta.ok ? halamanMinta.data : 1;

  const where: Prisma.BookingWhereInput = status ? { status } : {};
  const [total, kelompok] = await Promise.all([db.booking.count({ where }), db.booking.groupBy({ by: ["status"], _count: { _all: true } })]);
  const totalHalaman = Math.max(1, Math.ceil(total / UKURAN_HALAMAN));
  const halamanAman = Math.min(halaman, totalHalaman);

  const booking = await db.booking.findMany({
    where,
    include: INCLUDE_BOOKING,
    orderBy: { createdAt: "desc" },
    skip: (halamanAman - 1) * UKURAN_HALAMAN,
    take: UKURAN_HALAMAN,
  });

  const jumlahPerStatus: Record<StatusBooking, number> = { BOOKED: 0, WAITING_FOR_PAYMENT: 0, CONFIRMED: 0, DIBATALKAN: 0 };
  for (const k of kelompok) jumlahPerStatus[k.status] = k._count._all;
  return { booking, filter: status, halaman: halamanAman, totalHalaman, total, jumlahPerStatus };
}

export async function ambilBookingTravel(id: string): Promise<BookingTravel> {
  const booking = await db.booking.findUnique({ where: { id }, include: INCLUDE_BOOKING });
  if (!booking) throw new GalatBisnis("Pesanan tidak ditemukan.", "TIDAK_DITEMUKAN");
  return booking;
}

// ---------- US9 ----------

/** "Validasi Kode Booking Reference" → "Mengambil Status Booking". Kode yang tidak cocok → pesan wajib. */
export async function otorisasiKodeBooking(masukan: unknown): Promise<BookingTravel> {
  const kode = validasi(kodeBookingSkema, typeof masukan === "string" ? masukan : "");
  const dicari = kode.ok ? kode.data : "";
  const booking = dicari ? await db.booking.findUnique({ where: { kodeBookingReference: dicari }, include: INCLUDE_BOOKING }) : null;
  if (!booking) throw new GalatBisnis(PESAN_KODE_TIDAK_SESUAI, "KODE_TIDAK_SESUAI");
  return booking;
}

// ---------- US8-b ----------

export interface HasilPesanUntukPengunjung {
  booking: BookingTravel;
  pengunjung: { id: string; nama: string; email: string };
  /** Kata sandi sementara; hanya ada bila akun pengunjung baru dibuat pada pemesanan ini, dan tidak disimpan dalam bentuk asli. */
  kataSandiSementara?: string;
  akunBaru: boolean;
  etiket: HasilKirimEtiket | { galat: string };
}

/**
 * "Validasi Data Pengunjung" → "Membuat Booking Pengunjung" → e-tiket.
 * Pengunjung dicari berdasarkan email; bila belum ada, dibuat bersama akun loginnya. Semuanya dalam satu transaksi
 * dengan pembuatan booking, sehingga pemesanan yang gagal (mis. kursi penuh) tidak meninggalkan data setengah jadi.
 */
export async function pesanUntukPengunjung(
  manager: { id: string },
  masukan: { penerbanganId: unknown; pengunjung: unknown },
  opsi: { driverEmail?: EmailDriver } = {},
): Promise<HasilPesanUntukPengunjung> {
  const penerbanganId = typeof masukan.penerbanganId === "string" ? masukan.penerbanganId.trim() : "";
  if (!penerbanganId) throw new GalatBisnis("Pilih penerbangan terlebih dahulu.", "VALIDASI");

  const cek = validasi(dataPengunjungSkema, masukan.pengunjung);
  if (!cek.ok) throw new GalatValidasi(cek.galat);
  const data = cek.data;

  let kataSandiSementara: string | undefined;
  const sandiAsli = randomBytes(9).toString("base64url");

  const { bookingId, pengunjung, akunBaru } = await db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { email: data.email }, include: { pengunjung: true } });
    if (user && (user.role !== "PENGUNJUNG" || !user.pengunjung)) {
      throw new GalatBisnis("Email ini sudah terdaftar sebagai akun lain (bukan pengunjung).", "EMAIL_DIPAKAI");
    }

    let rekam = user?.pengunjung;
    let baru = false;
    if (!rekam) {
      const passwordHash = await bcrypt.hash(sandiAsli, 10);
      const akun = await tx.user.create({ data: { nama: data.nama, email: data.email, passwordHash, role: "PENGUNJUNG" } });
      rekam = await tx.pengunjung.create({ data: { userId: akun.id, nama: data.nama, email: data.email, telepon: data.telepon, nik: data.nik } });
      baru = true;
      kataSandiSementara = sandiAsli;
    } else if (!rekam.telepon || !rekam.nik) {
      // pengunjung lama dengan data kurang: lengkapi dari isian manajer, data yang sudah ada tidak ditimpa
      rekam = await tx.pengunjung.update({ where: { id: rekam.id }, data: { telepon: rekam.telepon || data.telepon, nik: rekam.nik || data.nik } });
    }

    const bookingId = await buatBookingDiTransaksi(tx, {
      pemilikId: rekam.userId,
      dibuatOlehId: manager.id,
      pengunjungId: rekam.id,
      penerbanganId,
      namaPenumpang: rekam.nama,
    });
    return { bookingId, pengunjung: rekam, akunBaru: baru };
  });

  // E-tiket dikirim setelah booking tersimpan; kegagalan tidak membatalkan pesanan (dicatat untuk dikirim ulang).
  let etiket: HasilPesanUntukPengunjung["etiket"];
  try {
    etiket = await kirimEtiket(bookingId, opsi.driverEmail);
  } catch (error) {
    etiket = { galat: error instanceof Error ? error.message : String(error) };
  }

  return {
    booking: await ambilBookingTravel(bookingId),
    pengunjung: { id: pengunjung.id, nama: pengunjung.nama, email: pengunjung.email },
    kataSandiSementara,
    akunBaru,
    etiket,
  };
}

/** Kirim ulang e-tiket yang sebelumnya gagal (US8-d, alternatif RB18). */
export async function kirimUlangEtiket(bookingId: string, driver?: EmailDriver): Promise<HasilKirimEtiket> {
  return kirimEtiket(bookingId, driver);
}
