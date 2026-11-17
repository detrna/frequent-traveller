import { describe, expect, it } from "vitest";
import { akhirHariWIB, awalHariWIB, formatDurasi, formatJam, formatRupiah, jamWIB, tanggalValid, tanggalWIB } from "@/lib/waktu";

describe("tanggalValid", () => {
  it("menerima tanggal kalender yang ada", () => {
    expect(tanggalValid("2026-12-31")).toBe(true);
    expect(tanggalValid("2028-02-29")).toBe(true);
  });
  it("menolak format salah dan tanggal yang tidak ada", () => {
    expect(tanggalValid("2026-02-30")).toBe(false);
    expect(tanggalValid("2027-02-29")).toBe(false);
    expect(tanggalValid("2026-13-01")).toBe(false);
    expect(tanggalValid("31-12-2026")).toBe(false);
    expect(tanggalValid("")).toBe(false);
  });
});

describe("zona WIB", () => {
  it("awal hari WIB = 17:00 UTC hari sebelumnya", () => {
    expect(awalHariWIB("2026-11-18").toISOString()).toBe("2026-11-17T17:00:00.000Z");
    expect(akhirHariWIB("2026-11-18").toISOString()).toBe("2026-11-18T17:00:00.000Z");
  });
  it("tanggalWIB dan jamWIB memakai UTC+7 (melewati tengah malam UTC)", () => {
    const instan = new Date("2026-11-17T18:30:00Z"); // 01:30 WIB tanggal 18
    expect(tanggalWIB(instan)).toBe("2026-11-18");
    expect(jamWIB(instan)).toBe(1);
  });
  it("formatJam menampilkan HH:MM WIB", () => {
    expect(formatJam(new Date("2026-11-17T23:05:00Z"))).toBe("06:05");
  });
});

describe("format", () => {
  it("formatRupiah", () => {
    expect(formatRupiah(1250000)).toBe("Rp 1.250.000");
  });
  it("formatDurasi", () => {
    expect(formatDurasi(new Date("2026-01-01T00:00:00Z"), new Date("2026-01-01T01:45:00Z"))).toBe("1j 45m");
    expect(formatDurasi(new Date("2026-01-01T00:00:00Z"), new Date("2026-01-01T00:40:00Z"))).toBe("40m");
  });
});
