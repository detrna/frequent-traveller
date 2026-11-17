import { describe, expect, it } from "vitest";
import { validasi } from "@/server/validation/common";
import {
  multiDestinasiSkema,
  multiTujuanSkema,
  pencarianSkema,
  pencarianWajibTanggalSkema,
  preferensiSkema,
} from "@/server/validation/penerbangan";
import { tanggalWIB } from "@/lib/waktu";

const besok = tanggalWIB(new Date(Date.now() + 86_400_000));
const kemarin = tanggalWIB(new Date(Date.now() - 2 * 86_400_000));

describe("pencarianSkema (US2-a/US8-a)", () => {
  it("menormalkan kode bandara dan menganggap asal/tanggal kosong sebagai tidak diisi", () => {
    const h = validasi(pencarianSkema, { asal: "", tujuan: " dps ", tanggal: "" });
    expect(h).toEqual({ ok: true, data: { asal: undefined, tujuan: "DPS", tanggal: undefined } });
  });
  it("tujuan wajib", () => {
    const h = validasi(pencarianSkema, { tujuan: "" });
    expect(h.ok).toBe(false);
    if (!h.ok) expect(h.galat.tujuan).toBe("Pilih bandara tujuan.");
  });
  it("menolak tanggal lampau dan tanggal yang tidak ada", () => {
    const lampau = validasi(pencarianSkema, { tujuan: "DPS", tanggal: kemarin });
    expect(!lampau.ok && lampau.galat.tanggal).toBe("Tanggal tidak boleh di masa lalu.");
    const palsu = validasi(pencarianSkema, { tujuan: "DPS", tanggal: "2027-02-30" });
    expect(!palsu.ok && palsu.galat.tanggal).toBe("Tanggal tidak valid.");
  });
});

describe("pencarianWajibTanggalSkema (RB04)", () => {
  it("tanggal wajib", () => {
    const h = validasi(pencarianWajibTanggalSkema, { tujuan: "DPS", tanggal: "" });
    expect(h.ok).toBe(false);
  });
});

describe("multiTujuanSkema (US3)", () => {
  it("membuang tujuan ganda", () => {
    const h = validasi(multiTujuanSkema, { tujuan: ["dps", "DPS", "SUB"], tanggal: besok });
    expect(h.ok && h.data.tujuan).toEqual(["DPS", "SUB"]);
  });
  it("menolak daftar tujuan kosong", () => {
    const h = validasi(multiTujuanSkema, { tujuan: [], tanggal: besok });
    expect(!h.ok && h.galat.tujuan).toBe("Pilih minimal satu tujuan.");
  });
});

describe("preferensiSkema (US6)", () => {
  it("menerima jam sebagai string dari form", () => {
    const h = validasi(preferensiSkema, { tujuan: "DPS", tanggal: besok, jamMulai: "6", jamSelesai: "12" });
    expect(h.ok && [h.data.jamMulai, h.data.jamSelesai]).toEqual([6, 12]);
  });
  it("jam kosong berarti tanpa batas", () => {
    const h = validasi(preferensiSkema, { tujuan: "DPS", tanggal: besok, jamMulai: "", jamSelesai: "" });
    expect(h.ok && [h.data.jamMulai, h.data.jamSelesai]).toEqual([undefined, undefined]);
  });
  it("menolak jam di luar 0–23 dan rentang terbalik", () => {
    expect(validasi(preferensiSkema, { tujuan: "DPS", tanggal: besok, jamMulai: "25" }).ok).toBe(false);
    const terbalik = validasi(preferensiSkema, { tujuan: "DPS", tanggal: besok, jamMulai: "14", jamSelesai: "8" });
    expect(!terbalik.ok && terbalik.galat.jamSelesai).toBe("Jam mulai tidak boleh setelah jam selesai.");
  });
});

describe("multiDestinasiSkema (US4)", () => {
  const ruas = (asal: string, tujuan: string) => ({ asal, tujuan, tanggal: besok });
  it("menerima dua ruas atau lebih", () => {
    expect(validasi(multiDestinasiSkema, { ruas: [ruas("CGK", "DPS"), ruas("DPS", "SUB")] }).ok).toBe(true);
  });
  it("menolak kurang dari dua ruas", () => {
    const h = validasi(multiDestinasiSkema, { ruas: [ruas("CGK", "DPS")] });
    expect(!h.ok && h.galat.ruas).toMatch(/minimal dua ruas/);
  });
  it("menolak ruas dengan asal = tujuan dan melaporkan indeksnya", () => {
    const h = validasi(multiDestinasiSkema, { ruas: [ruas("CGK", "DPS"), ruas("DPS", "DPS")] });
    expect(!h.ok && h.galat["ruas.1.tujuan"]).toBe("Keberangkatan dan tujuan tidak boleh sama.");
  });
});
