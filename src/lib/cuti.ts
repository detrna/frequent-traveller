/** Hitungan cuti yang murni (tanpa database). Tanggal cuti disimpan sebagai tanggal UTC 00:00 (kolom DATE). */

const MS_HARI = 86_400_000;

export interface RentangTanggal {
  awal: Date;
  /** Hari terakhir (inklusif). */
  akhir: Date;
}

export const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
] as const;

/** Rentang periode: satu hari bila tanggal diisi, selain itu satu bulan penuh. */
export function rentangPeriode(p: { tahun: number; bulan: number; tanggal?: number }): RentangTanggal {
  if (p.tanggal !== undefined) {
    const hari = new Date(Date.UTC(p.tahun, p.bulan - 1, p.tanggal));
    return { awal: hari, akhir: hari };
  }
  return { awal: new Date(Date.UTC(p.tahun, p.bulan - 1, 1)), akhir: new Date(Date.UTC(p.tahun, p.bulan, 0)) };
}

/** Jumlah hari (inklusif) cuti [mulai, selesai] yang jatuh di dalam rentang; 0 bila tidak beririsan. */
export function hariIrisan(mulai: Date, selesai: Date, rentang: RentangTanggal): number {
  const dari = Math.max(mulai.getTime(), rentang.awal.getTime());
  const sampai = Math.min(selesai.getTime(), rentang.akhir.getTime());
  return sampai < dari ? 0 : Math.round((sampai - dari) / MS_HARI) + 1;
}

/** Sisa cuti = jatah tahunan − cuti yang sudah diambil pada tahun berjalan (bisa negatif bila melebihi jatah). */
export function hitungSisaCuti(jatahTahunan: number, riwayat: Array<{ tahun: number; lamaHari: number }>, tahunBerjalan: number) {
  const terpakai = riwayat.filter((r) => r.tahun === tahunBerjalan).reduce((n, r) => n + r.lamaHari, 0);
  return { jatah: jatahTahunan, terpakai, sisa: jatahTahunan - terpakai };
}

export function namaPeriode(p: { tahun: number; bulan: number; tanggal?: number }): string {
  const bulan = NAMA_BULAN[p.bulan - 1];
  return p.tanggal !== undefined ? `${p.tanggal} ${bulan} ${p.tahun}` : `${bulan} ${p.tahun}`;
}

const FORMAT_TGL = new Intl.DateTimeFormat("id-ID", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" });
/** Format tanggal DATE (UTC) tanpa bergeser zona waktu. */
export const formatTanggalCuti = (d: Date) => FORMAT_TGL.format(d);
