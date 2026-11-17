/**
 * Control untuk pemesanan (robustness RB07, RB08; sequence SQ07, SQ08).
 * Memproses Pemesanan → Memeriksa Duplikat Booking → Membuat Booking; Membatalkan Pesanan.
 */
import { db } from "@/server/db";
import { GalatBisnis } from "@/server/errors";
import { buatKodeBooking } from "@/lib/kode-booking";
import { validasi } from "@/server/validation/common";
import { pemesananSkema } from "@/server/validation/booking";
import type { Prisma } from "@/generated/prisma/client";
import type { StatusBooking } from "@/generated/prisma/enums";

type Tx = Prisma.TransactionClient;

export interface Pelaku {
  id: string;
}

// ---------- aturan status (murni, diuji terpisah) ----------

/** Alur status booking: booked → waiting for the payment → confirmed. DIBATALKAN dapat dicapai dari status mana pun yang aktif. */
const TRANSISI: Record<string, { dari: StatusBooking; ke: StatusBooking }> = {
  mulaiPembayaran: { dari: "BOOKED", ke: "WAITING_FOR_PAYMENT" },
  bayar: { dari: "WAITING_FOR_PAYMENT", ke: "CONFIRMED" },
};

export function transisiStatus(aksi: keyof typeof TRANSISI, status: StatusBooking): StatusBooking {
  const aturan = TRANSISI[aksi];
  if (status !== aturan.dari) {
    throw new GalatBisnis(
      aksi === "mulaiPembayaran"
        ? "Pembayaran hanya dapat dimulai untuk pesanan berstatus booked."
        : "Pembayaran hanya dapat diselesaikan untuk pesanan berstatus waiting for the payment.",
      "STATUS_TIDAK_VALID",
    );
  }
  return aturan.ke;
}

export function periksaDapatDibatalkan(status: StatusBooking, penerbangan: Array<{ berangkat: Date }>, sekarang = new Date()): void {
  if (status === "DIBATALKAN") throw new GalatBisnis("Pesanan ini sudah dibatalkan.", "SUDAH_DIBATALKAN");
  if (penerbangan.some((p) => p.berangkat <= sekarang)) {
    throw new GalatBisnis("Pesanan tidak dapat dibatalkan karena penerbangan sudah berangkat.", "SUDAH_BERANGKAT");
  }
}

// ---------- kueri ----------

const INCLUDE_PESANAN = {
  tiket: { include: { penerbangan: { include: { maskapai: true, asal: true, tujuan: true } } }, orderBy: { createdAt: "asc" } },
} satisfies Prisma.BookingInclude;

export type Pesanan = Prisma.BookingGetPayload<{ include: typeof INCLUDE_PESANAN }>;

/** "Mengambil Data Pesanan": booking milik pengguna, terbaru dulu. */
export async function ambilDataPesanan(pemilikId: string): Promise<Pesanan[]> {
  return db.booking.findMany({ where: { pemilikId }, include: INCLUDE_PESANAN, orderBy: { createdAt: "desc" } });
}

/** Satu pesanan milik pengguna; pesanan orang lain diperlakukan sama seperti tidak ada. */
export async function ambilPesananMilik(pemilikId: string, bookingId: string): Promise<Pesanan> {
  const pesanan = await db.booking.findFirst({ where: { id: bookingId, pemilikId }, include: INCLUDE_PESANAN });
  if (!pesanan) throw new GalatBisnis("Pesanan tidak ditemukan.", "TIDAK_DITEMUKAN");
  return pesanan;
}

// ---------- membuat booking ----------

export interface BuatBookingInput {
  /** Akun pemilik booking (yang melihat & membatalkannya). */
  pemilikId: string;
  /** Pengguna yang membuat (pemilik sendiri, atau Manager Travel). */
  dibuatOlehId: string;
  pengunjungId?: string;
  penerbanganId: string;
  namaPenumpang: string;
}

async function kodeBookingBaru(tx: Tx): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const kode = buatKodeBooking();
    if (!(await tx.booking.findUnique({ where: { kodeBookingReference: kode }, select: { id: true } }))) return kode;
  }
  throw new GalatBisnis("Gagal membuat kode booking. Silakan coba lagi.", "KODE_GAGAL");
}

/**
 * Inti pemesanan di dalam transaksi `tx`:
 * penerbangan ada & belum berangkat → tidak duplikat → kursi dikurangi (atomik) → booking (booked) + tiket terbit.
 * Mengembalikan id booking. Dipakai bersama oleh pemesanan mandiri dan pemesanan oleh Manager Travel.
 */
export async function buatBookingDiTransaksi(tx: Tx, input: BuatBookingInput): Promise<string> {
  // Serialkan permintaan yang sama (pemilik + penerbangan) agar pemeriksaan duplikat tidak dilewati oleh balapan.
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`booking:${input.pemilikId}:${input.penerbanganId}`}))`;

  const penerbangan = await tx.penerbangan.findUnique({ where: { id: input.penerbanganId } });
  if (!penerbangan) throw new GalatBisnis("Penerbangan tidak ditemukan.", "TIDAK_DITEMUKAN");
  if (penerbangan.berangkat <= new Date()) throw new GalatBisnis("Penerbangan ini sudah berangkat.", "SUDAH_BERANGKAT");

  const duplikat = await tx.booking.findFirst({
    where: { pemilikId: input.pemilikId, status: { not: "DIBATALKAN" }, tiket: { some: { penerbanganId: input.penerbanganId, status: { not: "DIBATALKAN" } } } },
    select: { kodeBookingReference: true },
  });
  if (duplikat) {
    throw new GalatBisnis(`Pesanan untuk penerbangan ini sudah ada (kode booking ${duplikat.kodeBookingReference}).`, "DUPLIKAT");
  }

  // Pengurangan atomik: hanya berhasil bila masih ada kursi, sehingga tidak mungkin terjual lebih dari kapasitas.
  const dikurangi = await tx.penerbangan.updateMany({
    where: { id: input.penerbanganId, kursiTersedia: { gt: 0 } },
    data: { kursiTersedia: { decrement: 1 } },
  });
  if (dikurangi.count === 0) throw new GalatBisnis("Kursi pada penerbangan ini sudah penuh.", "PENUH");

  const kode = await kodeBookingBaru(tx);
  const booking = await tx.booking.create({
    data: {
      kodeBookingReference: kode,
      pemilikId: input.pemilikId,
      dibuatOlehId: input.dibuatOlehId,
      pengunjungId: input.pengunjungId,
      status: "BOOKED",
      tiket: { create: { penerbanganId: input.penerbanganId, nomorTiket: `TKT-${kode}-1`, namaPenumpang: input.namaPenumpang } },
    },
    select: { id: true },
  });
  return booking.id;
}

/** Pemesanan atomik dalam satu transaksi tersendiri. */
export async function buatBooking(input: BuatBookingInput): Promise<Pesanan> {
  const id = await db.$transaction((tx) => buatBookingDiTransaksi(tx, input));
  return db.booking.findUniqueOrThrow({ where: { id }, include: INCLUDE_PESANAN });
}

/** "Memproses Pemesanan" untuk Pengguna/Member: validasi masukan lalu buat booking atas nama sendiri. */
export async function prosesPemesanan(pengguna: Pelaku, masukan: unknown): Promise<Pesanan> {
  const cek = validasi(pemesananSkema, masukan);
  if (!cek.ok) throw new GalatBisnis(Object.values(cek.galat)[0], "VALIDASI");
  return buatBooking({ pemilikId: pengguna.id, dibuatOlehId: pengguna.id, ...cek.data });
}

// ---------- pembayaran (simulasi) & pembatalan ----------

async function ubahStatusMilik(pemilikId: string, bookingId: string, aksi: "mulaiPembayaran" | "bayar"): Promise<Pesanan> {
  const pesanan = await ambilPesananMilik(pemilikId, bookingId);
  const ke = transisiStatus(aksi, pesanan.status);
  // updateMany dengan status asal sebagai syarat → aman bila dua permintaan datang bersamaan
  const hasil = await db.booking.updateMany({ where: { id: bookingId, pemilikId, status: pesanan.status }, data: { status: ke } });
  if (hasil.count === 0) throw new GalatBisnis("Status pesanan baru saja berubah. Muat ulang halaman.", "KONFLIK");
  return ambilPesananMilik(pemilikId, bookingId);
}

export const mulaiPembayaran = (pemilikId: string, bookingId: string) => ubahStatusMilik(pemilikId, bookingId, "mulaiPembayaran");
export const bayarPesanan = (pemilikId: string, bookingId: string) => ubahStatusMilik(pemilikId, bookingId, "bayar");

/** "Membatalkan Pesanan": status → dibatalkan, tiket dibatalkan, kursi dikembalikan. */
export async function batalkanPesanan(pemilikId: string, bookingId: string): Promise<Pesanan> {
  await db.$transaction(async (tx) => {
    const pesanan = await tx.booking.findFirst({
      where: { id: bookingId, pemilikId },
      include: { tiket: { include: { penerbangan: { select: { berangkat: true } } } } },
    });
    if (!pesanan) throw new GalatBisnis("Pesanan tidak ditemukan.", "TIDAK_DITEMUKAN");
    periksaDapatDibatalkan(pesanan.status, pesanan.tiket.map((t) => t.penerbangan));

    // Syarat status pada UPDATE mencegah kursi dikembalikan dua kali bila pembatalan datang bersamaan.
    const diubah = await tx.booking.updateMany({ where: { id: bookingId, status: { not: "DIBATALKAN" } }, data: { status: "DIBATALKAN" } });
    if (diubah.count === 0) throw new GalatBisnis("Pesanan ini sudah dibatalkan.", "SUDAH_DIBATALKAN");

    for (const tiket of pesanan.tiket) {
      if (tiket.status === "DIBATALKAN") continue;
      await tx.tiketPesawat.update({ where: { id: tiket.id }, data: { status: "DIBATALKAN" } });
      await tx.penerbangan.update({ where: { id: tiket.penerbanganId }, data: { kursiTersedia: { increment: 1 } } });
    }
  });
  return ambilPesananMilik(pemilikId, bookingId);
}
