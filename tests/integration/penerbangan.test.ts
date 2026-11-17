import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { tutupDb } from "@/server/db";
import {
  bandingkanHarga,
  cariBeberapaTujuan,
  cariMultiDestinasi,
  cariPenerbangan,
  cariSesuaiPreferensi,
  ringkasMultiDestinasi,
  susunPerbandingan,
} from "@/server/services/penerbangan";
import { besokWIB, buatPenerbanganTes, resetDb, siapkanReferensi } from "./helpers";

const besok = besokWIB(1);
const lusa = besokWIB(2);

beforeAll(async () => {
  await resetDb();
  await siapkanReferensi();
  // CGK→DPS besok: pagi murah (JT), siang mahal (GA), malam menengah (JT)
  await buatPenerbanganTes({ asal: "CGK", tujuan: "DPS", tanggal: besok, jam: 6, harga: 800_000, maskapai: "JT", kode: "JT101" });
  await buatPenerbanganTes({ asal: "CGK", tujuan: "DPS", tanggal: besok, jam: 12, harga: 1_400_000, maskapai: "GA", kode: "GA201" });
  await buatPenerbanganTes({ asal: "CGK", tujuan: "DPS", tanggal: besok, jam: 19, harga: 1_000_000, maskapai: "JT", kode: "JT102" });
  await buatPenerbanganTes({ asal: "CGK", tujuan: "DPS", tanggal: lusa, jam: 8, harga: 900_000, maskapai: "JT", kode: "JT103" });
  await buatPenerbanganTes({ asal: "SUB", tujuan: "DPS", tanggal: besok, jam: 9, harga: 600_000, maskapai: "JT", kode: "JT301" });
  await buatPenerbanganTes({ asal: "CGK", tujuan: "SUB", tanggal: besok, jam: 7, harga: 700_000, maskapai: "GA", kode: "GA401" });
  await buatPenerbanganTes({ asal: "DPS", tujuan: "SUB", tanggal: lusa, jam: 10, harga: 650_000, maskapai: "JT", kode: "JT501" });
});
afterAll(async () => {
  await tutupDb();
});

const kode = (h: { kodePenerbangan: string }[]) => h.map((p) => p.kodePenerbangan);

describe("cariPenerbangan", () => {
  it("mencari menurut tujuan + tanggal, urut jam berangkat, memuat maskapai dan harga", async () => {
    const hasil = await cariPenerbangan({ asal: undefined, tujuan: "DPS", tanggal: besok });
    expect(kode(hasil)).toEqual(["JT101", "JT301", "GA201", "JT102"]); // jam 06, 09, 12, 19
    expect(hasil[0]).toMatchObject({ maskapai: { nama: "Lion Air" }, harga: 800_000, asal: { kode: "CGK" }, tujuan: { kode: "DPS" } });
  });
  it("menyaring menurut asal", async () => {
    const hasil = await cariPenerbangan({ asal: "SUB", tujuan: "DPS", tanggal: besok });
    expect(kode(hasil)).toEqual(["JT301"]);
  });
  it("tanggal lain tidak ikut", async () => {
    const hasil = await cariPenerbangan({ asal: "CGK", tujuan: "DPS", tanggal: lusa });
    expect(kode(hasil)).toEqual(["JT103"]);
  });
  it("tanpa tanggal: semua penerbangan mendatang ke tujuan itu (US8-a)", async () => {
    const hasil = await cariPenerbangan({ asal: undefined, tujuan: "DPS", tanggal: undefined });
    expect(hasil).toHaveLength(5);
  });
  it("tidak ada penerbangan → daftar kosong", async () => {
    expect(await cariPenerbangan({ asal: undefined, tujuan: "UPG", tanggal: besok })).toEqual([]);
  });
  it("penerbangan yang sudah berangkat tidak ditampilkan", async () => {
    const kemarin = besokWIB(-1);
    await buatPenerbanganTes({ asal: "CGK", tujuan: "UPG", tanggal: kemarin, jam: 6, harga: 500_000, kode: "GA999" });
    expect(await cariPenerbangan({ asal: undefined, tujuan: "UPG", tanggal: undefined })).toEqual([]);
  });
});

describe("cariBeberapaTujuan (US3)", () => {
  it("mengelompokkan hasil per tujuan, tujuan tanpa penerbangan tetap muncul dengan daftar kosong", async () => {
    const hasil = await cariBeberapaTujuan({ asal: "CGK", tujuan: ["DPS", "SUB", "UPG"], tanggal: besok });
    expect(hasil.map((h) => h.tujuan)).toEqual(["DPS", "SUB", "UPG"]);
    expect(kode(hasil[0].penerbangan)).toEqual(["JT101", "GA201", "JT102"]);
    expect(kode(hasil[1].penerbangan)).toEqual(["GA401"]);
    expect(hasil[2].penerbangan).toEqual([]);
  });
});

describe("cariSesuaiPreferensi (US6-a)", () => {
  it("menyaring menurut rentang jam berangkat WIB (inklusif)", async () => {
    const hasil = await cariSesuaiPreferensi({ asal: "CGK", tujuan: "DPS", tanggal: besok, jamMulai: 6, jamSelesai: 12 });
    expect(kode(hasil)).toEqual(["JT101", "GA201"]);
  });
  it("hanya jam mulai / hanya jam selesai", async () => {
    expect(kode(await cariSesuaiPreferensi({ asal: "CGK", tujuan: "DPS", tanggal: besok, jamMulai: 13 }))).toEqual(["JT102"]);
    expect(kode(await cariSesuaiPreferensi({ asal: "CGK", tujuan: "DPS", tanggal: besok, jamSelesai: 11 }))).toEqual(["JT101"]);
  });
});

describe("bandingkanHarga (US6-b)", () => {
  it("mengurutkan menurut harga, menandai termurah, dan menghitung selisih serta statistik", async () => {
    const hasil = await bandingkanHarga({ asal: "CGK", tujuan: "DPS", tanggal: besok });
    expect(hasil).not.toBeNull();
    expect(kode(hasil!.penerbangan)).toEqual(["JT101", "JT102", "GA201"]);
    expect(hasil!.penerbangan.map((p) => p.selisihDariTermurah)).toEqual([0, 200_000, 600_000]);
    expect(hasil!.penerbangan.map((p) => p.termurah)).toEqual([true, false, false]);
    expect(hasil).toMatchObject({ termurah: 800_000, termahal: 1_400_000, rataRata: 1_066_667 });
  });
  it("tanpa hasil → null", async () => {
    expect(await bandingkanHarga({ asal: "CGK", tujuan: "UPG", tanggal: besok })).toBeNull();
  });
});

describe("susunPerbandingan", () => {
  it("menandai semua yang berharga sama sebagai termurah", () => {
    const mk = (harga: number, jam: number) =>
      ({ id: `${harga}-${jam}`, harga, berangkat: new Date(Date.UTC(2030, 0, 1, jam)) }) as Parameters<typeof susunPerbandingan>[0][number];
    const hasil = susunPerbandingan([mk(500, 9), mk(500, 7), mk(700, 8)])!;
    expect(hasil.penerbangan.map((p) => p.termurah)).toEqual([true, true, false]);
    expect(hasil.penerbangan[0].berangkat.getUTCHours()).toBe(7);
  });
});

describe("cariMultiDestinasi (US4)", () => {
  it("menghitung total harga termurah dan jumlah penerbangan dari itinerary", async () => {
    const hasil = await cariMultiDestinasi({
      ruas: [
        { asal: "CGK", tujuan: "DPS", tanggal: besok },
        { asal: "DPS", tujuan: "SUB", tanggal: lusa },
      ],
    });
    expect(hasil.lengkap).toBe(true);
    expect(hasil.jumlahPenerbangan).toBe(2);
    expect(hasil.jumlahPilihan).toBe(3 + 1);
    expect(hasil.totalHargaTermurah).toBe(800_000 + 650_000);
    expect(hasil.ruas[0].termurah?.kodePenerbangan).toBe("JT101");
  });
  it("itinerary tidak lengkap bila ada ruas tanpa penerbangan", async () => {
    const hasil = await cariMultiDestinasi({
      ruas: [
        { asal: "CGK", tujuan: "DPS", tanggal: besok },
        { asal: "DPS", tujuan: "UPG", tanggal: lusa },
      ],
    });
    expect(hasil.lengkap).toBe(false);
    expect(hasil.jumlahPenerbangan).toBe(1);
    expect(hasil.totalHargaTermurah).toBe(800_000);
  });
});

describe("ringkasMultiDestinasi", () => {
  it("ruas kosong semua → total 0 dan tidak lengkap", () => {
    const r = ringkasMultiDestinasi([{ asal: "A", tujuan: "B", tanggal: "2030-01-01", penerbangan: [], termurah: null }]);
    expect(r).toMatchObject({ lengkap: false, totalHargaTermurah: 0, jumlahPenerbangan: 0, jumlahPilihan: 0 });
  });
});
