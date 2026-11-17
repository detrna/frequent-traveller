/**
 * Matematika kalender murni untuk pemilih tanggal (tanpa zona waktu): semua tanggal berupa string "YYYY-MM-DD".
 * Pekan dimulai hari Senin (kebiasaan di Indonesia).
 */

export interface BulanKalender {
  tahun: number;
  /** 0–11 */
  bulan: number;
}

export const NAMA_HARI_SINGKAT = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"] as const;
const NAMA_BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

const dua = (n: number) => String(n).padStart(2, "0");

export const judulBulan = ({ tahun, bulan }: BulanKalender) => `${NAMA_BULAN[bulan]} ${tahun}`;

export function bulanDari(tanggal: string): BulanKalender {
  return { tahun: Number(tanggal.slice(0, 4)), bulan: Number(tanggal.slice(5, 7)) - 1 };
}

const indeksBulan = (b: BulanKalender) => b.tahun * 12 + b.bulan;
const dariIndeks = (i: number): BulanKalender => ({ tahun: Math.floor(i / 12), bulan: i % 12 });

/**
 * Bulan yang ditampilkan: mulai dari bulan `hariIni`, minimal `minimal` bulan, diperluas hingga bulan tanggal
 * terpilih terakhir (maksimal `maksimal` bulan) agar pilihan di URL tidak hilang saat dikirim ulang.
 */
export function bulanTampil(hariIni: string, terpilih: readonly string[], minimal = 2, maksimal = 6): BulanKalender[] {
  const awal = indeksBulan(bulanDari(hariIni));
  const akhirTerpilih = terpilih.filter((t) => t >= hariIni).reduce((maks, t) => Math.max(maks, indeksBulan(bulanDari(t))), awal);
  const jumlah = Math.min(maksimal, Math.max(minimal, akhirTerpilih - awal + 1));
  return Array.from({ length: jumlah }, (_, i) => dariIndeks(awal + i));
}

/** Sel kalender sebuah bulan: `null` untuk kotak kosong sebelum tanggal 1, selebihnya "YYYY-MM-DD" (Senin di kolom pertama). */
export function selBulan({ tahun, bulan }: BulanKalender): (string | null)[] {
  const hariPertama = new Date(Date.UTC(tahun, bulan, 1)).getUTCDay(); // 0 = Minggu
  const kosong = (hariPertama + 6) % 7; // Senin = 0
  const jumlahHari = new Date(Date.UTC(tahun, bulan + 1, 0)).getUTCDate();
  return [
    ...Array<null>(kosong).fill(null),
    ...Array.from({ length: jumlahHari }, (_, i) => `${tahun}-${dua(bulan + 1)}-${dua(i + 1)}`),
  ];
}
