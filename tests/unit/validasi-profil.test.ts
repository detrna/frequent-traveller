import { describe, expect, it } from "vitest";
import { validasi } from "@/server/validation/common";
import { profilSkema } from "@/server/validation/profil";
import { kolomBelumLengkap, profilLengkap, samarkan } from "@/server/services/profil";

const lengkap = {
  namaLengkap: "Citra Lestari Wijaya",
  tglLahir: "1992-05-17",
  nik: "3174015705920001",
  noPaspor: "c1234567",
  telepon: "0812-3456-7890",
  kewarganegaraan: "Indonesia",
  alamat: "Jl. Melati No. 10, Jakarta",
};

describe("profilSkema", () => {
  it("menormalkan isian yang valid", () => {
    const h = validasi(profilSkema, lengkap);
    expect(h.ok).toBe(true);
    if (h.ok) {
      expect(h.data.noPaspor).toBe("C1234567");
      expect(h.data.telepon).toBe("081234567890");
      expect(h.data.tglLahir).toBe("1992-05-17"); // kolom DATE tetap string "YYYY-MM-DD"
    }
  });
  it("kolom kosong menjadi null (boleh disimpan sebagian)", () => {
    const h = validasi(profilSkema, { namaLengkap: "", tglLahir: "", nik: "  ", noPaspor: "", telepon: "", kewarganegaraan: "", alamat: "" });
    expect(h).toEqual({ ok: true, data: { namaLengkap: null, tglLahir: null, nik: null, noPaspor: null, telepon: null, kewarganegaraan: null, alamat: null } });
  });
  it("menolak format yang salah per kolom", () => {
    const h = validasi(profilSkema, { ...lengkap, nik: "123", telepon: "12345", noPaspor: "!!", tglLahir: "2999-01-01", namaLengkap: "ab", alamat: "x" });
    expect(h.ok).toBe(false);
    if (!h.ok) {
      expect(h.galat).toMatchObject({
        nik: "NIK harus 16 digit angka.",
        telepon: "Nomor telepon tidak valid. Contoh: 081234567890.",
        noPaspor: "Nomor paspor harus 6–9 huruf/angka.",
        tglLahir: "Tanggal lahir tidak boleh di masa depan.",
        namaLengkap: "Nama lengkap minimal 3 karakter.",
        alamat: "Alamat minimal 5 karakter.",
      });
    }
  });
  it("menerima telepon dengan awalan +62 dan menolak tanggal yang tidak ada", () => {
    expect(validasi(profilSkema, { ...lengkap, telepon: "+62 812 3456 7890" }).ok).toBe(true);
    const h = validasi(profilSkema, { ...lengkap, tglLahir: "1990-02-30" });
    expect(!h.ok && h.galat.tglLahir).toBe("Tanggal lahir tidak valid.");
  });
});

describe("kelengkapan profil", () => {
  const penuh = { namaLengkap: "A B", tglLahir: new Date("1990-01-01"), nik: "1", noPaspor: "1", telepon: "1", kewarganegaraan: "ID", alamat: "x" };
  it("lengkap bila semua kolom wajib terisi", () => {
    expect(profilLengkap(penuh)).toBe(true);
    expect(kolomBelumLengkap(penuh)).toEqual([]);
  });
  it("tidak lengkap bila ada yang null, kosong, spasi, atau profil belum ada", () => {
    expect(kolomBelumLengkap({ ...penuh, nik: null, alamat: "   " })).toEqual(["nik", "alamat"]);
    expect(kolomBelumLengkap({ ...penuh, tglLahir: null })).toEqual(["tglLahir"]);
    expect(profilLengkap(null)).toBe(false);
    expect(kolomBelumLengkap(undefined)).toHaveLength(7);
  });
});

describe("samarkan", () => {
  it("menutup digit kecuali 4 terakhir", () => {
    expect(samarkan("3174015705920001")).toBe("••••••••••••0001");
    expect(samarkan("AB")).toBe("AB");
    expect(samarkan(null)).toBe("-");
  });
});
