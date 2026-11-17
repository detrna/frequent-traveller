/**
 * Control untuk pencarian penerbangan (robustness RB04, RB05, RB06, RB11, RB12, RB14).
 * Fungsi di sini menganggap masukan SUDAH divalidasi oleh skema di src/server/validation/penerbangan.ts.
 */
import { db } from "@/server/db";
import type { Prisma } from "@/generated/prisma/client";
import { akhirHariWIB, awalHariWIB, jamWIB } from "@/lib/waktu";
import type {
  MultiDestinasiInput,
  MultiTujuanInput,
  PencarianInput,
  PreferensiInput,
} from "@/server/validation/penerbangan";

const INCLUDE = { maskapai: true, asal: true, tujuan: true } satisfies Prisma.PenerbanganInclude;

type PenerbanganRow = Prisma.PenerbanganGetPayload<{ include: typeof INCLUDE }>;

export interface HasilPenerbangan {
  id: string;
  kodePenerbangan: string;
  maskapai: { kode: string; nama: string };
  asal: { kode: string; kota: string; nama: string };
  tujuan: { kode: string; kota: string; nama: string };
  berangkat: Date;
  tiba: Date;
  harga: number;
  kursiTersedia: number;
}

export function keHasil(p: PenerbanganRow): HasilPenerbangan {
  return {
    id: p.id,
    kodePenerbangan: p.kodePenerbangan,
    maskapai: { kode: p.maskapai.kode, nama: p.maskapai.nama },
    asal: { kode: p.asal.kode, kota: p.asal.kota, nama: p.asal.nama },
    tujuan: { kode: p.tujuan.kode, kota: p.tujuan.kota, nama: p.tujuan.nama },
    berangkat: p.berangkat,
    tiba: p.tiba,
    harga: p.harga,
    kursiTersedia: p.kursiTersedia,
  };
}

export async function daftarBandara() {
  return db.bandara.findMany({ orderBy: { kota: "asc" }, select: { kode: true, kota: true, nama: true } });
}

interface Kriteria {
  asal?: string;
  tujuan: string;
  tanggal?: string;
  jamMulai?: number;
  jamSelesai?: number;
}

/** Penerbangan yang belum berangkat sesuai kriteria, urut jam berangkat. */
async function ambilPenerbangan(k: Kriteria, batas = 200): Promise<HasilPenerbangan[]> {
  const sekarang = new Date();
  const berangkat: Prisma.DateTimeFilter = { gt: sekarang };
  if (k.tanggal) {
    const awal = awalHariWIB(k.tanggal);
    berangkat.gte = awal > sekarang ? awal : sekarang;
    berangkat.lt = akhirHariWIB(k.tanggal);
  }

  const baris = await db.penerbangan.findMany({
    where: {
      tujuan: { kode: k.tujuan },
      ...(k.asal ? { asal: { kode: k.asal } } : {}),
      berangkat,
    },
    include: INCLUDE,
    orderBy: { berangkat: "asc" },
    take: batas,
  });

  return baris
    .filter((p) => {
      const jam = jamWIB(p.berangkat);
      return (k.jamMulai === undefined || jam >= k.jamMulai) && (k.jamSelesai === undefined || jam <= k.jamSelesai);
    })
    .map(keHasil);
}

/** US2-a / US8-a — "Mencari Penerbangan". */
export async function cariPenerbangan(input: PencarianInput): Promise<HasilPenerbangan[]> {
  return ambilPenerbangan(input);
}

export interface HasilPerTujuan {
  tujuan: string;
  penerbangan: HasilPenerbangan[];
}

/** US3 — "Mencari Penerbangan per Tujuan" lalu "Menggabungkan Hasil Pencarian". */
export async function cariBeberapaTujuan(input: MultiTujuanInput): Promise<HasilPerTujuan[]> {
  const hasil = await Promise.all(
    input.tujuan.map(async (tujuan) => ({
      tujuan,
      penerbangan: await ambilPenerbangan({ asal: input.asal, tujuan, tanggal: input.tanggal }),
    })),
  );
  return hasil;
}

/** US6-a — "Mencari Penerbangan Sesuai Preferensi". */
export async function cariSesuaiPreferensi(input: PreferensiInput): Promise<HasilPenerbangan[]> {
  return ambilPenerbangan(input);
}

export interface PerbandinganHarga {
  penerbangan: Array<HasilPenerbangan & { selisihDariTermurah: number; termurah: boolean }>;
  termurah: number;
  termahal: number;
  rataRata: number;
}

/** Murni: urutkan menurut harga lalu hitung selisih (dipisah agar mudah diuji). */
export function susunPerbandingan(daftar: HasilPenerbangan[]): PerbandinganHarga | null {
  if (daftar.length === 0) return null;
  const urut = [...daftar].sort((a, b) => a.harga - b.harga || a.berangkat.getTime() - b.berangkat.getTime());
  const termurah = urut[0].harga;
  const total = urut.reduce((jumlah, p) => jumlah + p.harga, 0);
  return {
    penerbangan: urut.map((p) => ({ ...p, selisihDariTermurah: p.harga - termurah, termurah: p.harga === termurah })),
    termurah,
    termahal: urut[urut.length - 1].harga,
    rataRata: Math.round(total / urut.length),
  };
}

/** US6-b — "Membandingkan Harga Tiket". */
export async function bandingkanHarga(input: PreferensiInput): Promise<PerbandinganHarga | null> {
  return susunPerbandingan(await ambilPenerbangan(input));
}

export interface HasilRuas {
  asal: string;
  tujuan: string;
  tanggal: string;
  penerbangan: HasilPenerbangan[];
  termurah: HasilPenerbangan | null;
}

export interface HasilMultiDestinasi {
  ruas: HasilRuas[];
  /** Jumlah penerbangan yang tersedia di semua ruas (untuk membandingkan jumlah pilihan). */
  jumlahPilihan: number;
  /** Jumlah penerbangan dalam itinerary termurah = jumlah ruas yang punya penerbangan. */
  jumlahPenerbangan: number;
  /** Total harga bila memilih penerbangan termurah di tiap ruas. */
  totalHargaTermurah: number;
  /** false bila ada ruas tanpa penerbangan, sehingga itinerary tidak bisa diselesaikan. */
  lengkap: boolean;
}

/** Murni: ringkas per-ruas menjadi total harga & jumlah penerbangan. */
export function ringkasMultiDestinasi(ruas: HasilRuas[]): HasilMultiDestinasi {
  const dipilih = ruas.map((r) => r.termurah).filter((p): p is HasilPenerbangan => p !== null);
  return {
    ruas,
    jumlahPilihan: ruas.reduce((n, r) => n + r.penerbangan.length, 0),
    jumlahPenerbangan: dipilih.length,
    totalHargaTermurah: dipilih.reduce((n, p) => n + p.harga, 0),
    lengkap: dipilih.length === ruas.length,
  };
}

/** US4 — "Mencari Penerbangan Multi-Destinasi" + "Menghitung Total Harga dan Jumlah Penerbangan". */
export async function cariMultiDestinasi(input: MultiDestinasiInput): Promise<HasilMultiDestinasi> {
  const ruas = await Promise.all(
    input.ruas.map(async (r): Promise<HasilRuas> => {
      const penerbangan = await ambilPenerbangan({ asal: r.asal, tujuan: r.tujuan, tanggal: r.tanggal });
      const termurah = penerbangan.reduce<HasilPenerbangan | null>((min, p) => (!min || p.harga < min.harga ? p : min), null);
      return { asal: r.asal, tujuan: r.tujuan, tanggal: r.tanggal, penerbangan, termurah };
    }),
  );
  return ringkasMultiDestinasi(ruas);
}

/** Satu penerbangan menurut id (untuk halaman pemesanan); null bila tidak ada. */
export async function ambilPenerbanganById(id: string): Promise<HasilPenerbangan | null> {
  const p = await db.penerbangan.findUnique({ where: { id }, include: INCLUDE });
  return p ? keHasil(p) : null;
}
