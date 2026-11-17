/**
 * Control untuk pemesanan (robustness RB07, RB08; sequence SQ07, SQ08).
 * Memproses Pemesanan → Memeriksa Duplikat Booking → Membuat Booking; Membatalkan Pesanan.
 */
import { and } from "@prisma/orm-postgres/orm-client";
import type { ResultType } from "@prisma/orm-postgres/components/runtime";
import { db } from "@/server/db";
import type { Tx } from "@/server/prisma-client";
import { GalatBisnis } from "@/server/errors";
import { buatKodeBooking } from "@/lib/kode-booking";
import { wajib } from "@/lib/wajib";
import { validasi } from "@/server/validation/common";
import { pemesananSkema } from "@/server/validation/booking";
import type { StatusBooking } from "@/lib/enums";

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

/** Booking beserta tiketnya (urut pembuatan), dan tiap tiket beserta penerbangan, maskapai, asal, dan tujuannya. */
function kueriPesanan() {
  return db.orm.public.Booking.include("tiket", (t) =>
    t.orderBy((x) => x.createdAt.asc()).include("penerbangan", (p) => p.include("maskapai").include("asal").include("tujuan")),
  );
}

type BarisPesanan = ResultType<ReturnType<typeof kueriPesanan>>;

function normalisasi(b: BarisPesanan) {
  return { ...b, tiket: b.tiket.map((t) => ({ ...t, penerbangan: wajib(t.penerbangan, "penerbangan pada tiket") })) };
}

export type Pesanan = ReturnType<typeof normalisasi>;

/** "Mengambil Data Pesanan": booking milik pengguna, terbaru dulu. */
export async function ambilDataPesanan(pemilikId: string): Promise<Pesanan[]> {
  const daftar = await kueriPesanan()
    .where({ pemilikId })
    .orderBy((b) => b.createdAt.desc())
    .all();
  return daftar.map(normalisasi);
}

/** Satu pesanan milik pengguna; pesanan orang lain diperlakukan sama seperti tidak ada. */
export async function ambilPesananMilik(pemilikId: string, bookingId: string): Promise<Pesanan> {
  const pesanan = await kueriPesanan().where({ id: bookingId, pemilikId }).first();
  if (!pesanan) throw new GalatBisnis("Pesanan tidak ditemukan.", "TIDAK_DITEMUKAN");
  return normalisasi(pesanan);
}

/** Pesanan menurut id, tanpa memeriksa pemilik. Hanya untuk dipakai setelah pembuatan/pemeriksaan di dalam service. */
export async function ambilPesananById(id: string): Promise<Pesanan> {
  return normalisasi(await kueriPesanan().where({ id }).firstOrThrow());
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
    if (!(await tx.orm.public.Booking.where({ kodeBookingReference: kode }).select("id").first())) return kode;
  }
  throw new GalatBisnis("Gagal membuat kode booking. Silakan coba lagi.", "KODE_GAGAL");
}

/** Mengubah kursi tersedia secara atomik. `syaratTersisa` menolak pengurangan bila kursi sudah habis. */
async function ubahKursi(tx: Tx, penerbanganId: string, delta: 1 | -1): Promise<number> {
  const rencana =
    delta === -1
      ? tx.raw.sql`UPDATE "public"."Penerbangan" SET "kursiTersedia" = "kursiTersedia" - 1 WHERE "id" = ${penerbanganId} AND "kursiTersedia" > 0`
      : tx.raw.sql`UPDATE "public"."Penerbangan" SET "kursiTersedia" = "kursiTersedia" + 1 WHERE "id" = ${penerbanganId}`;
  const { affectedRows } = await tx.execute(rencana.affectedCount().build());
  return affectedRows;
}

/**
 * Inti pemesanan di dalam transaksi `tx`:
 * penerbangan ada & belum berangkat → tidak duplikat → kursi dikurangi (atomik) → booking (booked) + tiket terbit.
 * Mengembalikan id booking. Dipakai bersama oleh pemesanan mandiri dan pemesanan oleh Manager Travel.
 */
export async function buatBookingDiTransaksi(tx: Tx, input: BuatBookingInput): Promise<string> {
  // Serialkan permintaan yang sama (pemilik + penerbangan) agar pemeriksaan duplikat tidak dilewati oleh balapan.
  const kunci = `booking:${input.pemilikId}:${input.penerbanganId}`;
  await tx.execute(tx.raw.sql`SELECT pg_advisory_xact_lock(hashtext(${kunci}))`.affectedCount().build());

  const penerbangan = await tx.orm.public.Penerbangan.where({ id: input.penerbanganId }).first();
  if (!penerbangan) throw new GalatBisnis("Penerbangan tidak ditemukan.", "TIDAK_DITEMUKAN");
  if (penerbangan.berangkat <= new Date()) throw new GalatBisnis("Penerbangan ini sudah berangkat.", "SUDAH_BERANGKAT");

  const duplikat = await tx.orm.public.Booking.where((b) =>
    and(
      b.pemilikId.eq(input.pemilikId),
      b.status.neq("DIBATALKAN"),
      b.tiket.some((t) => and(t.penerbanganId.eq(input.penerbanganId), t.status.neq("DIBATALKAN"))),
    ),
  )
    .select("kodeBookingReference")
    .first();
  if (duplikat) {
    throw new GalatBisnis(`Pesanan untuk penerbangan ini sudah ada (kode booking ${duplikat.kodeBookingReference}).`, "DUPLIKAT");
  }

  // Pengurangan atomik: hanya berhasil bila masih ada kursi, sehingga tidak mungkin terjual lebih dari kapasitas.
  if ((await ubahKursi(tx, input.penerbanganId, -1)) === 0) {
    throw new GalatBisnis("Kursi pada penerbangan ini sudah penuh.", "PENUH");
  }

  const kode = await kodeBookingBaru(tx);
  const booking = await tx.orm.public.Booking.create({
    kodeBookingReference: kode,
    pemilikId: input.pemilikId,
    dibuatOlehId: input.dibuatOlehId,
    pengunjungId: input.pengunjungId ?? null,
    status: "BOOKED",
  });
  await tx.orm.public.TiketPesawat.create({
    bookingId: booking.id,
    penerbanganId: input.penerbanganId,
    nomorTiket: `TKT-${kode}-1`,
    namaPenumpang: input.namaPenumpang,
    status: "TERBIT",
  });
  return booking.id;
}

/** Pemesanan atomik dalam satu transaksi tersendiri. */
export async function buatBooking(input: BuatBookingInput): Promise<Pesanan> {
  const id = await db.transaction((tx) => buatBookingDiTransaksi(tx, input));
  return ambilPesananById(id);
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
  // UPDATE dengan status asal sebagai syarat → aman bila dua permintaan datang bersamaan
  const diubah = await db.orm.public.Booking.where({ id: bookingId, pemilikId, status: pesanan.status }).updateAndCount({ status: ke });
  if (diubah === 0) throw new GalatBisnis("Status pesanan baru saja berubah. Muat ulang halaman.", "KONFLIK");
  return ambilPesananMilik(pemilikId, bookingId);
}

export const mulaiPembayaran = (pemilikId: string, bookingId: string) => ubahStatusMilik(pemilikId, bookingId, "mulaiPembayaran");
export const bayarPesanan = (pemilikId: string, bookingId: string) => ubahStatusMilik(pemilikId, bookingId, "bayar");

/** "Membatalkan Pesanan": status → dibatalkan, tiket dibatalkan, kursi dikembalikan. */
export async function batalkanPesanan(pemilikId: string, bookingId: string): Promise<Pesanan> {
  await db.transaction(async (tx) => {
    const pesanan = await tx.orm.public.Booking.where({ id: bookingId, pemilikId })
      .include("tiket", (t) => t.include("penerbangan"))
      .first();
    if (!pesanan) throw new GalatBisnis("Pesanan tidak ditemukan.", "TIDAK_DITEMUKAN");
    periksaDapatDibatalkan(
      pesanan.status,
      pesanan.tiket.map((t) => t.penerbangan),
    );

    // Syarat status pada UPDATE mencegah kursi dikembalikan dua kali bila pembatalan datang bersamaan.
    const diubah = await tx.orm.public.Booking.where((b) => and(b.id.eq(bookingId), b.status.neq("DIBATALKAN"))).updateAndCount({
      status: "DIBATALKAN",
    });
    if (diubah === 0) throw new GalatBisnis("Pesanan ini sudah dibatalkan.", "SUDAH_DIBATALKAN");

    for (const tiket of pesanan.tiket) {
      if (tiket.status === "DIBATALKAN") continue;
      await tx.orm.public.TiketPesawat.where({ id: tiket.id }).update({ status: "DIBATALKAN" });
      await ubahKursi(tx, tiket.penerbanganId, 1);
    }
  });
  return ambilPesananMilik(pemilikId, bookingId);
}
