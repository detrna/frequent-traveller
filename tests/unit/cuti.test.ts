import { describe, expect, it } from "vitest";
import { hariIrisan, hitungSisaCuti, namaPeriode, rentangPeriode } from "@/lib/cuti";
import { validasi } from "@/server/validation/common";
import { periodeSkema } from "@/server/validation/cuti";

const d = (s: string) => new Date(`${s}T00:00:00Z`);

describe("rentangPeriode", () => {
  it("satu bulan penuh bila tanggal tidak diisi (termasuk Februari kabisat)", () => {
    expect(rentangPeriode({ tahun: 2026, bulan: 11 })).toEqual({ awal: d("2026-11-01"), akhir: d("2026-11-30") });
    expect(rentangPeriode({ tahun: 2028, bulan: 2 }).akhir).toEqual(d("2028-02-29"));
    expect(rentangPeriode({ tahun: 2027, bulan: 2 }).akhir).toEqual(d("2027-02-28"));
    expect(rentangPeriode({ tahun: 2026, bulan: 12 }).akhir).toEqual(d("2026-12-31"));
  });
  it("satu hari bila tanggal diisi", () => {
    expect(rentangPeriode({ tahun: 2026, bulan: 11, tanggal: 17 })).toEqual({ awal: d("2026-11-17"), akhir: d("2026-11-17") });
  });
});

describe("hariIrisan", () => {
  const nov = rentangPeriode({ tahun: 2026, bulan: 11 });
  it("seluruhnya di dalam periode", () => expect(hariIrisan(d("2026-11-10"), d("2026-11-12"), nov)).toBe(3));
  it("satu hari", () => expect(hariIrisan(d("2026-11-10"), d("2026-11-10"), nov)).toBe(1));
  it("terpotong di awal dan akhir periode", () => {
    expect(hariIrisan(d("2026-10-29"), d("2026-11-02"), nov)).toBe(2);
    expect(hariIrisan(d("2026-11-29"), d("2026-12-03"), nov)).toBe(2);
  });
  it("menutup seluruh periode", () => expect(hariIrisan(d("2026-10-01"), d("2026-12-31"), nov)).toBe(30));
  it("tidak beririsan → 0", () => {
    expect(hariIrisan(d("2026-10-01"), d("2026-10-31"), nov)).toBe(0);
    expect(hariIrisan(d("2026-12-01"), d("2026-12-05"), nov)).toBe(0);
  });
  it("terhadap periode satu hari", () => {
    const hari = rentangPeriode({ tahun: 2026, bulan: 11, tanggal: 11 });
    expect(hariIrisan(d("2026-11-10"), d("2026-11-12"), hari)).toBe(1);
    expect(hariIrisan(d("2026-11-12"), d("2026-11-14"), hari)).toBe(0);
  });
});

describe("hitungSisaCuti", () => {
  const riwayat = [
    { tahun: 2025, lamaHari: 6 },
    { tahun: 2026, lamaHari: 3 },
    { tahun: 2026, lamaHari: 2 },
  ];
  it("hanya menghitung riwayat tahun berjalan", () => {
    expect(hitungSisaCuti(12, riwayat, 2026)).toEqual({ jatah: 12, terpakai: 5, sisa: 7 });
    expect(hitungSisaCuti(12, riwayat, 2025)).toEqual({ jatah: 12, terpakai: 6, sisa: 6 });
  });
  it("tanpa riwayat → sisa = jatah; melebihi jatah → negatif", () => {
    expect(hitungSisaCuti(12, [], 2026).sisa).toBe(12);
    expect(hitungSisaCuti(4, riwayat, 2026).sisa).toBe(-1);
  });
});

describe("namaPeriode", () => {
  it("menulis bulan dalam bahasa Indonesia", () => {
    expect(namaPeriode({ tahun: 2026, bulan: 8 })).toBe("Agustus 2026");
    expect(namaPeriode({ tahun: 2026, bulan: 8, tanggal: 17 })).toBe("17 Agustus 2026");
  });
});

describe("periodeSkema (RB01: periode tidak valid)", () => {
  it("menerima string dari form dan tanggal opsional", () => {
    expect(validasi(periodeSkema, { tahun: "2026", bulan: "11", tanggal: "" })).toEqual({ ok: true, data: { tahun: 2026, bulan: 11, tanggal: undefined } });
    expect(validasi(periodeSkema, { tahun: "2026", bulan: "11", tanggal: "5" })).toEqual({ ok: true, data: { tahun: 2026, bulan: 11, tanggal: 5 } });
  });
  it("bulan atau tahun kosong ditolak", () => {
    const h = validasi(periodeSkema, { tahun: "", bulan: "" });
    expect(h.ok).toBe(false);
    if (!h.ok) expect(h.galat).toMatchObject({ tahun: "Tahun wajib dipilih.", bulan: "Bulan wajib dipilih." });
    expect(validasi(periodeSkema, {}).ok).toBe(false);
  });
  it("menolak nilai di luar rentang atau bukan angka", () => {
    expect(validasi(periodeSkema, { tahun: "1999", bulan: "1" }).ok).toBe(false);
    const bulan = validasi(periodeSkema, { tahun: "2026", bulan: "13" });
    expect(!bulan.ok && bulan.galat.bulan).toBe("Bulan tidak valid.");
    expect(validasi(periodeSkema, { tahun: "abc", bulan: "1" }).ok).toBe(false);
    expect(validasi(periodeSkema, { tahun: "2026.5", bulan: "1" }).ok).toBe(false);
  });
  it("menolak tanggal yang tidak ada pada bulan itu", () => {
    const h = validasi(periodeSkema, { tahun: "2026", bulan: "2", tanggal: "30" });
    expect(!h.ok && h.galat.tanggal).toBe("Tanggal tidak ada pada bulan yang dipilih.");
    expect(validasi(periodeSkema, { tahun: "2028", bulan: "2", tanggal: "29" }).ok).toBe(true);
    expect(validasi(periodeSkema, { tahun: "2027", bulan: "2", tanggal: "29" }).ok).toBe(false);
  });
});
