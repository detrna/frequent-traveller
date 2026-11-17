import { describe, expect, it } from "vitest";
import { validasi } from "@/server/validation/common";
import { daftarSkema } from "@/server/validation/auth";

const valid = { nama: "Dewi", email: "dewi@tes.test", password: "RahasiaKu#1", konfirmasi: "RahasiaKu#1" };

describe("daftarSkema", () => {
  it("menerima masukan valid dan merapikan nama serta email", () => {
    const hasil = validasi(daftarSkema, { ...valid, nama: "  Dewi  ", email: " DEWI@Tes.test " });
    expect(hasil).toMatchObject({ ok: true, data: { nama: "Dewi", email: "dewi@tes.test" } });
  });
  it("menolak kata sandi kurang dari 8 karakter", () => {
    expect(validasi(daftarSkema, { ...valid, password: "pendek", konfirmasi: "pendek" })).toMatchObject({
      ok: false,
      galat: { password: "Kata sandi minimal 8 karakter." },
    });
  });
  it("menolak konfirmasi yang tidak cocok", () => {
    expect(validasi(daftarSkema, { ...valid, konfirmasi: "lain-lagi" })).toMatchObject({
      ok: false,
      galat: { konfirmasi: "Konfirmasi kata sandi tidak cocok." },
    });
  });
  it("menolak email dan nama tidak valid", () => {
    const hasil = validasi(daftarSkema, { ...valid, email: "bukan-email", nama: "A" });
    expect(hasil).toMatchObject({ ok: false, galat: { email: "Format email tidak valid.", nama: "Nama minimal 2 karakter." } });
  });
  it("menolak kolom yang hilang", () => {
    expect(validasi(daftarSkema, {})).toMatchObject({ ok: false });
  });
});
