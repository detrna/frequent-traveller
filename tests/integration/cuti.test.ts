import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db, tutupDb } from "@/server/db";
import { GalatBisnis, GalatValidasi } from "@/server/errors";
import { ambilJadwalCuti, ambilPengajuanCuti, ambilRiwayatCuti, daftarPegawai } from "@/server/services/cuti";
import { resetDb } from "./helpers";

const d = (s: string) => new Date(`${s}T00:00:00Z`);
let sari: string;
let budi: string;
let tanpaCuti: string;

async function buatPegawai(nama: string, nip: string, jatah = 12) {
  return (await db.orm.public.Pegawai.create({ nama, nip, jabatan: "Staf", jatahCutiTahunan: jatah })).id;
}
const permohonan = (pegawaiId: string, mulai: string, selesai: string) =>
  db.orm.public.PermohonanCuti.create({
    pegawaiId,
    tglMulai: mulai, // kolom DATE ditulis sebagai string "YYYY-MM-DD"
    tglSelesai: selesai,
    lamaHari: Math.round((d(selesai).getTime() - d(mulai).getTime()) / 86_400_000) + 1,
    alasan: null,
  });

async function galat<T extends Error = GalatBisnis>(janji: Promise<unknown>): Promise<T> {
  try {
    await janji;
  } catch (e) {
    expect(e).toBeInstanceOf(GalatBisnis);
    return e as T;
  }
  throw new Error("Seharusnya melempar galat");
}

beforeAll(async () => {
  await resetDb();
  sari = await buatPegawai("Sari Wulandari", "NIP001");
  budi = await buatPegawai("Budi Santoso", "NIP002", 10);
  tanpaCuti = await buatPegawai("Cahya Tanpa Cuti", "NIP003");

  await permohonan(sari, "2026-11-10", "2026-11-12"); // di dalam November
  await permohonan(sari, "2026-11-25", "2026-12-03"); // menyeberang ke Desember
  await permohonan(budi, "2026-10-28", "2026-11-02"); // menyeberang dari Oktober
  await permohonan(budi, "2026-12-20", "2026-12-24"); // Desember saja

  await db.orm.public.RiwayatCuti.createAndCount([
    { pegawaiId: sari, tahun: 2025, tglMulai: "2025-08-04", tglSelesai: "2025-08-08", lamaHari: 5 },
    { pegawaiId: sari, tahun: 2026, tglMulai: "2026-02-02", tglSelesai: "2026-02-04", lamaHari: 3 },
    { pegawaiId: sari, tahun: 2026, tglMulai: "2026-06-15", tglSelesai: "2026-06-16", lamaHari: 2 },
  ]);
});
afterAll(async () => {
  await tutupDb();
});

describe("ambilJadwalCuti (US1-a)", () => {
  it("menampilkan pegawai yang cuti pada bulan itu dengan hari cuti di dalam periode (cuti lintas bulan terpotong)", async () => {
    const hasil = await ambilJadwalCuti({ tahun: "2026", bulan: "11", tanggal: "" });
    expect(hasil.pegawai.map((p) => p.pegawai.nama)).toEqual(["Budi Santoso", "Sari Wulandari"]); // urut tanggal mulai
    const b = hasil.pegawai[0];
    expect(b.totalHariDalamPeriode).toBe(2); // 1–2 Nov
    expect(b.permohonan[0].lamaHari).toBe(6); // lama pengajuan utuh tetap ditampilkan
    const s = hasil.pegawai[1];
    expect(s.permohonan).toHaveLength(2);
    expect(s.totalHariDalamPeriode).toBe(3 + 6); // 10–12 Nov + 25–30 Nov
  });
  it("satu pegawai hanya muncul sekali walau punya beberapa pengajuan", async () => {
    const hasil = await ambilJadwalCuti({ tahun: 2026, bulan: 11 });
    expect(hasil.pegawai.filter((p) => p.pegawai.id === sari)).toHaveLength(1);
  });
  it("memfilter sampai tanggal tertentu", async () => {
    const hari = await ambilJadwalCuti({ tahun: 2026, bulan: 11, tanggal: 11 });
    expect(hari.pegawai.map((p) => p.pegawai.nama)).toEqual(["Sari Wulandari"]);
    expect(hari.pegawai[0].totalHariDalamPeriode).toBe(1);
    expect((await ambilJadwalCuti({ tahun: 2026, bulan: 11, tanggal: 2 })).pegawai.map((p) => p.pegawai.nama)).toEqual(["Budi Santoso"]);
    expect((await ambilJadwalCuti({ tahun: 2026, bulan: 11, tanggal: 20 })).pegawai).toEqual([]);
  });
  it("pegawai tanpa cuti tidak ditampilkan; bulan tanpa cuti → kosong", async () => {
    const nov = await ambilJadwalCuti({ tahun: 2026, bulan: 11 });
    expect(nov.pegawai.some((p) => p.pegawai.id === tanpaCuti)).toBe(false);
    expect((await ambilJadwalCuti({ tahun: 2026, bulan: 3 })).pegawai).toEqual([]);
  });
  it("periode tidak valid → GalatValidasi dengan pesan per kolom", async () => {
    const e = await galat<GalatValidasi>(ambilJadwalCuti({ tahun: "", bulan: "" }));
    expect(e).toBeInstanceOf(GalatValidasi);
    expect(e.galat).toMatchObject({ tahun: "Tahun wajib dipilih.", bulan: "Bulan wajib dipilih." });
    await galat(ambilJadwalCuti({ tahun: 2026, bulan: 2, tanggal: 30 }));
  });
});

describe("ambilPengajuanCuti (US1-b)", () => {
  it("menampilkan nama pegawai, periode, dan lama cuti yang diajukan secara utuh", async () => {
    const { pengajuan } = await ambilPengajuanCuti({ tahun: 2026, bulan: 12 });
    expect(pengajuan.map((p) => [p.pegawai.nama, p.tglMulai.toISOString().slice(0, 10), p.tglSelesai.toISOString().slice(0, 10), p.lamaHari])).toEqual([
      ["Sari Wulandari", "2026-11-25", "2026-12-03", 9],
      ["Budi Santoso", "2026-12-20", "2026-12-24", 5],
    ]);
  });
  it("memfilter sampai tanggal dan menolak periode tidak valid", async () => {
    expect((await ambilPengajuanCuti({ tahun: 2026, bulan: 12, tanggal: 21 })).pengajuan.map((p) => p.pegawai.nama)).toEqual(["Budi Santoso"]);
    await galat(ambilPengajuanCuti({ tahun: 2026, bulan: 0 }));
  });
});

describe("ambilRiwayatCuti (US1-c)", () => {
  it("menampilkan riwayat (terbaru dulu) dan sisa cuti tahun berjalan saja", async () => {
    const hasil = await ambilRiwayatCuti(sari, 2026);
    expect(hasil.riwayat.map((r) => r.lamaHari)).toEqual([2, 3, 5]);
    expect(hasil).toMatchObject({ jatah: 12, terpakai: 5, sisa: 7, tahunBerjalan: 2026 });
    expect(hasil.pegawai.nama).toBe("Sari Wulandari");
  });
  it("tahun lain memakai riwayat tahun itu; pegawai tanpa riwayat → sisa = jatah", async () => {
    expect(await ambilRiwayatCuti(sari, 2025)).toMatchObject({ terpakai: 5, sisa: 7 });
    expect(await ambilRiwayatCuti(budi, 2026)).toMatchObject({ riwayat: [], terpakai: 0, sisa: 10 });
  });
  it("pegawai tidak ditemukan / belum dipilih → galat", async () => {
    expect((await galat(ambilRiwayatCuti("tidak-ada"))).message).toBe("Pegawai tidak ditemukan.");
    expect((await galat(ambilRiwayatCuti(""))).message).toBe("Pilih pegawai terlebih dahulu.");
    await galat(ambilRiwayatCuti(undefined));
  });
});

describe("daftarPegawai", () => {
  it("urut menurut nama", async () => {
    expect((await daftarPegawai()).map((p) => p.nama)).toEqual(["Budi Santoso", "Cahya Tanpa Cuti", "Sari Wulandari"]);
  });
});
