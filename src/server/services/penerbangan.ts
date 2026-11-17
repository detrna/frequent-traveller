/**
 * Control untuk pencarian penerbangan (robustness RB04, RB05, RB06, RB11, RB12, RB14).
 * Fungsi di sini menganggap masukan SUDAH divalidasi oleh skema di src/server/validation/penerbangan.ts.
 */
import { and, or } from "@prisma/orm-postgres/orm-client";
import { db } from "@/server/db";
import { akhirHariWIB, awalHariWIB, jamWIB } from "@/lib/waktu";
import type {
  JadwalInput,
  MultiDestinasiInput,
  MultiTujuanInput,
  PencarianInput,
  PreferensiInput,
} from "@/server/validation/penerbangan";

/** Bentuk minimal baris penerbangan beserta maskapai, asal, dan tujuannya (hasil `.include(...)`). */
export interface BarisPenerbangan {
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

export type HasilPenerbangan = BarisPenerbangan;

/** Penerbangan dengan maskapai, asal, dan tujuan ter-include. */
function kueriPenerbangan() {
  return db.orm.public.Penerbangan.include("maskapai").include("asal").include("tujuan");
}

export function keHasil(p: BarisPenerbangan): HasilPenerbangan {
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
  return db.orm.public.Bandara.select("kode", "kota", "nama")
    .orderBy((b) => b.kota.asc())
    .all();
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

  // Kode bandara → id (tabel kecil). Bandara yang tidak ada berarti tidak ada penerbangan.
  const tujuan = await db.orm.public.Bandara.where({ kode: k.tujuan }).select("id").first();
  if (!tujuan) return [];
  let asalId: string | undefined;
  if (k.asal) {
    const asal = await db.orm.public.Bandara.where({ kode: k.asal }).select("id").first();
    if (!asal) return [];
    asalId = asal.id;
  }

  let kueri = kueriPenerbangan()
    .where({ tujuanId: tujuan.id })
    .where((p) => p.berangkat.gt(sekarang));
  if (asalId) kueri = kueri.where({ asalId });
  if (k.tanggal) {
    const awal = awalHariWIB(k.tanggal);
    kueri = kueri.where((p) => p.berangkat.gte(awal)).where((p) => p.berangkat.lt(akhirHariWIB(k.tanggal!)));
  }

  const baris = await kueri
    .orderBy((p) => p.berangkat.asc())
    .limit(batas)
    .all();

  return baris
    .filter((p) => {
      const jam = jamWIB(p.berangkat);
      return (k.jamMulai === undefined || jam >= k.jamMulai) && (k.jamSelesai === undefined || jam <= k.jamSelesai);
    })
    .map(keHasil);
}

export const UKURAN_HALAMAN_JADWAL = 20;

export interface HasilJadwal {
  penerbangan: HasilPenerbangan[];
  total: number;
  halaman: number;
  totalHalaman: number;
}

/**
 * US10-a — jadwal publik: penerbangan yang belum berangkat, urut jam berangkat, per halaman.
 * Semua filter opsional (tanpa filter = semua penerbangan); beberapa tanggal digabung dengan OR.
 */
export async function jelajahiJadwal(input: JadwalInput, halamanMinta = 1): Promise<HasilJadwal> {
  const kosong = { penerbangan: [], total: 0, halaman: 1, totalHalaman: 1 };
  const idBandara = async (kode?: string) => (kode ? ((await db.orm.public.Bandara.where({ kode }).select("id").first())?.id ?? null) : undefined);
  const [asalId, tujuanId] = await Promise.all([idBandara(input.asal), idBandara(input.tujuan)]);
  if (asalId === null || tujuanId === null) return kosong; // bandara yang tidak ada → tidak ada penerbangan

  const sekarang = new Date();
  const rentang = input.tanggal.map((t) => ({ awal: awalHariWIB(t), akhir: akhirHariWIB(t) }));
  let dasar = kueriPenerbangan().where((p) => p.berangkat.gt(sekarang));
  if (asalId) dasar = dasar.where({ asalId });
  if (tujuanId) dasar = dasar.where({ tujuanId });
  if (rentang.length > 0) {
    dasar = dasar.where((p) => or(...rentang.map((r) => and(p.berangkat.gte(r.awal), p.berangkat.lt(r.akhir)))));
  }

  const { total } = await dasar.aggregate((a) => ({ total: a.count() }));
  const totalHalaman = Math.max(1, Math.ceil(total / UKURAN_HALAMAN_JADWAL));
  const halaman = Math.min(Math.max(1, halamanMinta), totalHalaman);
  const baris = await dasar
    .orderBy((p) => p.berangkat.asc())
    .offset((halaman - 1) * UKURAN_HALAMAN_JADWAL)
    .limit(UKURAN_HALAMAN_JADWAL)
    .all();
  return { penerbangan: baris.map(keHasil), total, halaman, totalHalaman };
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
  const p = await kueriPenerbangan().where({ id }).first();
  return p ? keHasil(p) : null;
}
