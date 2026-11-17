/** Control untuk tiket pesawat: validasi tiket oleh member (RB10) dan daftar tiket milik pengguna. */
import { db } from "@/server/db";
import { GalatBisnis } from "@/server/errors";
import type { Prisma } from "@/generated/prisma/client";
import { ambilProfil, kolomBelumLengkap } from "./profil";

/** Pesan wajib dari US5-c — jangan diubah. */
export const PESAN_PROFIL_TIDAK_LENGKAP = "data profil tidak lengkap";

const INCLUDE_TIKET = {
  booking: { select: { id: true, kodeBookingReference: true, status: true } },
  penerbangan: { include: { maskapai: true, asal: true, tujuan: true } },
} satisfies Prisma.TiketPesawatInclude;

export type TiketDenganPenerbangan = Prisma.TiketPesawatGetPayload<{ include: typeof INCLUDE_TIKET }>;

/** Tiket milik pengguna (di booking yang ia miliki), yang belum dibatalkan lebih dulu, terbaru dulu. */
export async function ambilTiketMilik(pemilikId: string): Promise<TiketDenganPenerbangan[]> {
  const tiket = await db.tiketPesawat.findMany({
    where: { booking: { pemilikId } },
    include: INCLUDE_TIKET,
    orderBy: { createdAt: "desc" },
  });
  return [...tiket].sort((a, b) => Number(a.status === "DIBATALKAN") - Number(b.status === "DIBATALKAN"));
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
  const tiket = await db.tiketPesawat.findFirst({ where: { id: tiketId, booking: { pemilikId: memberId } }, include: INCLUDE_TIKET });
  if (!tiket) throw new GalatBisnis("Tiket tidak ditemukan.", "TIDAK_DITEMUKAN");

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
  const diubah = await db.tiketPesawat.updateMany({ where: { id: tiketId, status: "TERBIT" }, data: { status: "TERVALIDASI", validatedAt: new Date() } });
  if (diubah.count === 0) throw new GalatBisnis("Status tiket baru saja berubah. Muat ulang halaman.", "KONFLIK");

  const terbaru = await db.tiketPesawat.findUniqueOrThrow({ where: { id: tiketId }, include: INCLUDE_TIKET });
  // kolom wajib sudah dipastikan terisi oleh pemeriksaan di atas
  return { tiket: terbaru, profil: { namaLengkap: profil!.namaLengkap!, nik: profil!.nik!, noPaspor: profil!.noPaspor! } };
}
