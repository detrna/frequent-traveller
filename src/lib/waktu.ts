/** Semua waktu disimpan sebagai UTC dan ditampilkan/diinterpretasikan dalam WIB (Asia/Jakarta, UTC+7). */

export const ZONA = "Asia/Jakarta";
const OFFSET_WIB_MS = 7 * 3_600_000;
const MS_HARI = 86_400_000;

const FORMAT_TANGGAL = new Intl.DateTimeFormat("id-ID", { timeZone: ZONA, weekday: "short", day: "numeric", month: "short", year: "numeric" });
const FORMAT_JAM = new Intl.DateTimeFormat("id-ID", { timeZone: ZONA, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
const FORMAT_RUPIAH = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

export const POLA_TANGGAL = /^\d{4}-\d{2}-\d{2}$/;

/** "YYYY-MM-DD" yang benar-benar ada di kalender (menolak 2026-02-30). */
export function tanggalValid(nilai: string): boolean {
  if (!POLA_TANGGAL.test(nilai)) return false;
  const [y, m, d] = nilai.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** Tanggal (YYYY-MM-DD) menurut WIB untuk sebuah instan waktu. */
export function tanggalWIB(date: Date = new Date()): string {
  return new Date(date.getTime() + OFFSET_WIB_MS).toISOString().slice(0, 10);
}

/** Awal hari WIB (00:00 WIB) sebagai instan UTC. */
export function awalHariWIB(tanggal: string): Date {
  return new Date(`${tanggal}T00:00:00+07:00`);
}

/** Akhir hari WIB (eksklusif) = awal hari berikutnya. */
export function akhirHariWIB(tanggal: string): Date {
  return new Date(awalHariWIB(tanggal).getTime() + MS_HARI);
}

/** Jam (0–23) menurut WIB. */
export function jamWIB(date: Date): number {
  return new Date(date.getTime() + OFFSET_WIB_MS).getUTCHours();
}

export function formatTanggal(date: Date): string {
  return FORMAT_TANGGAL.format(date);
}

export function formatJam(date: Date): string {
  return FORMAT_JAM.format(date).replace(".", ":");
}

export function formatRupiah(nilai: number): string {
  return FORMAT_RUPIAH.format(nilai).replace(/ /g, " ");
}

export function formatDurasi(dari: Date, sampai: Date): string {
  const menit = Math.round((sampai.getTime() - dari.getTime()) / 60_000);
  const jam = Math.floor(menit / 60);
  const sisa = menit % 60;
  return jam > 0 ? `${jam}j ${sisa}m` : `${sisa}m`;
}
