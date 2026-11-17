/** Control untuk jadwal, pengajuan, dan riwayat cuti pegawai (RB01–RB03, SQ01–SQ03). */
import { db } from "@/server/db";
import { GalatBisnis, GalatValidasi } from "@/server/errors";
import { hariIrisan, hitungSisaCuti, rentangPeriode, type RentangTanggal } from "@/lib/cuti";
import { wajib } from "@/lib/wajib";
import { tanggalWIB } from "@/lib/waktu";
import { validasi } from "@/server/validation/common";
import { idPegawaiSkema, periodeSkema, type PeriodeInput } from "@/server/validation/cuti";

/** "Validasi Periode Cuti": melempar GalatValidasi (pesan per kolom) bila periode tidak valid. */
export function validasiPeriode(masukan: unknown): { periode: PeriodeInput; rentang: RentangTanggal } {
  const cek = validasi(periodeSkema, masukan);
  if (!cek.ok) throw new GalatValidasi(cek.galat);
  return { periode: cek.data, rentang: rentangPeriode(cek.data) };
}

export function tahunBerjalan(): number {
  return Number(tanggalWIB().slice(0, 4));
}

export async function daftarPegawai() {
  return db.orm.public.Pegawai.select("id", "nama", "jabatan", "nip")
    .orderBy((p) => p.nama.asc())
    .all();
}

/** Kolom DATE dibaca Prisma 8 sebagai string "YYYY-MM-DD"; di sini diubah ke Date (UTC 00:00) untuk hitungan hari. */
const keTanggal = (nilai: string) => new Date(`${nilai}T00:00:00Z`);
const keString = (d: Date) => d.toISOString().slice(0, 10);

/** Permohonan cuti yang beririsan dengan rentang, urut tanggal mulai lalu nama. */
async function cariPermohonan(rentang: RentangTanggal) {
  const awal = keString(rentang.awal);
  const akhir = keString(rentang.akhir);
  const baris = await db.orm.public.PermohonanCuti.where((p) => p.tglMulai.lte(akhir))
    .where((p) => p.tglSelesai.gte(awal))
    .include("pegawai", (g) => g.select("id", "nama", "jabatan"))
    .orderBy([(p) => p.tglMulai.asc(), (p) => p.pegawai.nama.asc()])
    .all();
  return baris.map((p) => ({
    ...p,
    pegawai: wajib(p.pegawai, "pegawai pada permohonan cuti"),
    tglMulai: keTanggal(p.tglMulai),
    tglSelesai: keTanggal(p.tglSelesai),
  }));
}

export interface PegawaiCuti {
  pegawai: { id: string; nama: string; jabatan: string };
  permohonan: Array<{ id: string; tglMulai: Date; tglSelesai: Date; lamaHari: number; hariDalamPeriode: number }>;
  /** Total hari cuti pegawai ini yang jatuh di dalam periode. */
  totalHariDalamPeriode: number;
}

/** US1-a — "Mengambil Jadwal Cuti": pegawai yang cuti pada periode, dengan lama cutinya. Satu baris per pegawai. */
export async function ambilJadwalCuti(masukan: unknown) {
  const { periode, rentang } = validasiPeriode(masukan);
  const permohonan = await cariPermohonan(rentang);

  const perPegawai = new Map<string, PegawaiCuti>();
  for (const p of permohonan) {
    const hari = hariIrisan(p.tglMulai, p.tglSelesai, rentang);
    const baris = perPegawai.get(p.pegawaiId) ?? { pegawai: p.pegawai, permohonan: [], totalHariDalamPeriode: 0 };
    baris.permohonan.push({ id: p.id, tglMulai: p.tglMulai, tglSelesai: p.tglSelesai, lamaHari: p.lamaHari, hariDalamPeriode: hari });
    baris.totalHariDalamPeriode += hari;
    perPegawai.set(p.pegawaiId, baris);
  }
  const pegawai = [...perPegawai.values()].sort((a, b) => a.permohonan[0].tglMulai.getTime() - b.permohonan[0].tglMulai.getTime() || a.pegawai.nama.localeCompare(b.pegawai.nama, "id"));
  return { periode, rentang, pegawai };
}

/** US1-b — "Mengambil Pengajuan Cuti": nama pegawai, periode cuti yang diajukan, dan lama cuti. */
export async function ambilPengajuanCuti(masukan: unknown) {
  const { periode, rentang } = validasiPeriode(masukan);
  const pengajuan = await cariPermohonan(rentang);
  return { periode, rentang, pengajuan };
}

/** US1-c — "Mengambil Riwayat Cuti" + "Menghitung Sisa Cuti" untuk tahun berjalan. */
export async function ambilRiwayatCuti(idPegawai: unknown, tahun: number = tahunBerjalan()) {
  const id = validasi(idPegawaiSkema, idPegawai);
  if (!id.ok) throw new GalatBisnis(id.galat._ ?? "Pilih pegawai terlebih dahulu.", "VALIDASI");

  const pegawai = await db.orm.public.Pegawai.where({ id: id.data }).first();
  if (!pegawai) throw new GalatBisnis("Pegawai tidak ditemukan.", "TIDAK_DITEMUKAN");

  const baris = await db.orm.public.RiwayatCuti.where({ pegawaiId: pegawai.id })
    .orderBy((r) => r.tglMulai.desc())
    .all();
  const riwayat = baris.map((r) => ({ ...r, tglMulai: keTanggal(r.tglMulai), tglSelesai: keTanggal(r.tglSelesai) }));
  return { pegawai, riwayat, tahunBerjalan: tahun, ...hitungSisaCuti(pegawai.jatahCutiTahunan, riwayat, tahun) };
}
