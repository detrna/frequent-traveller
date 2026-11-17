import { describe, expect, it } from "vitest";
import { bulanDari, bulanTampil, judulBulan, selBulan } from "@/lib/kalender";

describe("selBulan", () => {
  it("November 2026 dimulai hari Minggu → 6 kotak kosong sebelum tanggal 1 (pekan mulai Senin)", () => {
    const sel = selBulan({ tahun: 2026, bulan: 10 });
    expect(sel.slice(0, 6)).toEqual(Array(6).fill(null));
    expect(sel[6]).toBe("2026-11-01");
    expect(sel.at(-1)).toBe("2026-11-30");
    expect(sel).toHaveLength(6 + 30);
  });
  it("Juni 2026 dimulai hari Senin → tanpa kotak kosong", () => {
    expect(selBulan({ tahun: 2026, bulan: 5 })[0]).toBe("2026-06-01");
  });
  it("Februari kabisat punya 29 hari", () => {
    expect(selBulan({ tahun: 2028, bulan: 1 }).filter(Boolean)).toHaveLength(29);
  });
});

describe("bulanTampil", () => {
  it("minimal dua bulan mulai dari bulan hari ini, melewati pergantian tahun", () => {
    expect(bulanTampil("2026-12-15", [])).toEqual([{ tahun: 2026, bulan: 11 }, { tahun: 2027, bulan: 0 }]);
  });
  it("diperluas sampai bulan tanggal terpilih terakhir, dibatasi maksimal", () => {
    expect(bulanTampil("2026-11-17", ["2027-01-05"])).toHaveLength(3);
    expect(bulanTampil("2026-11-17", ["2030-01-05"])).toHaveLength(6);
  });
  it("tanggal terpilih di masa lalu diabaikan", () => {
    expect(bulanTampil("2026-11-17", ["2026-01-05"])).toHaveLength(2);
  });
});

describe("judulBulan / bulanDari", () => {
  it("memberi nama bulan Indonesia", () => {
    expect(judulBulan(bulanDari("2026-08-17"))).toBe("Agustus 2026");
  });
});
