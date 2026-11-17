/** Control untuk tiket pesawat: validasi tiket oleh member (RB10) dan daftar tiket milik pengguna. */
import type { ResultType } from "@prisma/orm-postgres/components/runtime";
import { db } from "@/server/db";
import { GalatBisnis } from "@/server/errors";
import { wajib } from "@/lib/wajib";
import { ambilProfil, kolomBelumLengkap } from "./profil";

/** Pesan wajib dari US5-c — jangan diubah. */
export const PESAN_PROFIL_TIDAK_LENGKAP = "data profil tidak lengkap";

/** Tiket beserta ringkasan booking-nya dan penerbangan (maskapai, asal, tujuan). */
function kueriTiket() {
  return db.orm.public.TiketPesawat.include("booking", (b) => b.select("id", "kodeBookingReference", "status", "pemilikId")).include(
    "penerbangan",
    (p) => p.include("maskapai").include("asal").include("tujuan"),
  );
}

type BarisTiket = ResultType<ReturnType<typeof kueriTiket>>;

function normalisasi(t: BarisTiket) {
  return { ...t, booking: wajib(t.booking, "booking pada tiket"), penerbangan: wajib(t.penerbangan, "penerbangan pada tiket") };
}

export type TiketDenganPenerbangan = ReturnType<typeof normalisasi>;

/** Tiket milik pengguna (di booking yang ia miliki), yang belum dibatalkan lebih dulu, terbaru dulu. */
export async function ambilTiketMilik(pemilikId: string): Promise<TiketDenganPenerbangan[]> {
  const booking = await db.orm.public.Booking.where({ pemilikId }).select("id").all();
  if (booking.length === 0) return [];
  const idBooking = booking.map((b) => b.id);

  const baris = await kueriTiket()
    .where((t) => t.bookingId.in(idBooking))
    .orderBy((t) => t.createdAt.desc())
    .all();
  const tiket = baris.map(normalisasi);
  return tiket.sort((a, b) => Number(a.status === "DIBATALKAN") - Number(b.status === "DIBATALKAN"));
}

export interface HasilValidasiTiket {
  tiket: TiketDenganPenerbangan;
  /** Data profil yang dipakai sebagai dasar validasi. */
  profil: { namaLengkap: string; nik: string; noPaspor: string };
}

/**
 * US5-b/c — "Memeriksa Kelengkapan Profil" lalu "Memvalidasi Tiket".
 * Urutan sesuai SQ10: kepemilikan → kelengkapan profil (tolak dengan pesan wajib) → status tiket → tandai tervalidasi.
 */
export async function validasiTiket(memberId: string, tiketId: string): Promise<HasilValidasiTiket> {
  const baris = await kueriTiket().where({ id: tiketId }).first();
  const tiket = baris ? normalisasi(baris) : null;
  if (!tiket || tiket.booking.pemilikId !== memberId) throw new GalatBisnis("Tiket tidak ditemukan.", "TIDAK_DITEMUKAN");

  const profil = await ambilProfil(memberId);
  if (kolomBelumLengkap(profil).length > 0) {
    throw new GalatBisnis(PESAN_PROFIL_TIDAK_LENGKAP, "PROFIL_TIDAK_LENGKAP");
  }

  if (tiket.status === "DIBATALKAN" || tiket.booking.status === "DIBATALKAN") {
    throw new GalatBisnis("Tiket yang sudah dibatalkan tidak dapat divalidasi.", "TIKET_DIBATALKAN");
  }
  if (tiket.status === "TERVALIDASI") {
    throw new GalatBisnis("Tiket ini sudah tervalidasi.", "SUDAH_TERVALIDASI");
  }

  // Syarat status TERBIT pada UPDATE menjaga dari validasi ganda yang bersamaan.
  const diubah = await db.orm.public.TiketPesawat.where({ id: tiketId, status: "TERBIT" }).updateAndCount({
    status: "TERVALIDASI",
    validatedAt: new Date(),
  });
  if (diubah === 0) throw new GalatBisnis("Status tiket baru saja berubah. Muat ulang halaman.", "KONFLIK");

  const terbaru = normalisasi(await kueriTiket().where({ id: tiketId }).firstOrThrow());
  // kolom wajib sudah dipastikan terisi oleh pemeriksaan di atas
  return { tiket: terbaru, profil: { namaLengkap: profil!.namaLengkap!, nik: profil!.nik!, noPaspor: profil!.noPaspor! } };
}
