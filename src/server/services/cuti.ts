/** Control untuk jadwal, pengajuan, dan riwayat cuti pegawai (RB01–RB03, SQ01–SQ03). */
import { db } from "@/server/db";
import { GalatBisnis, GalatValidasi } from "@/server/errors";
import { hariIrisan, hitungSisaCuti, rentangPeriode, type RentangTanggal } from "@/lib/cuti";
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
  return db.pegawai.findMany({ orderBy: { nama: "asc" }, select: { id: true, nama: true, jabatan: true, nip: true } });
}

/** Permohonan cuti yang beririsan dengan rentang, urut tanggal mulai lalu nama. */
async function cariPermohonan(rentang: RentangTanggal) {
  return db.permohonanCuti.findMany({
    where: { tglMulai: { lte: rentang.akhir }, tglSelesai: { gte: rentang.awal } },
    include: { pegawai: { select: { id: true, nama: true, jabatan: true } } },
    orderBy: [{ tglMulai: "asc" }, { pegawai: { nama: "asc" } }],
  });
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

  const pegawai = await db.pegawai.findUnique({ where: { id: id.data } });
  if (!pegawai) throw new GalatBisnis("Pegawai tidak ditemukan.", "TIDAK_DITEMUKAN");

  const riwayat = await db.riwayatCuti.findMany({ where: { pegawaiId: pegawai.id }, orderBy: { tglMulai: "desc" } });
  return { pegawai, riwayat, tahunBerjalan: tahun, ...hitungSisaCuti(pegawai.jatahCutiTahunan, riwayat, tahun) };
}
