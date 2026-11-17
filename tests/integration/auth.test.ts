import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { tutupDb } from "@/server/db";
import { GalatValidasi } from "@/server/errors";
import { daftarPengguna, PESAN_EMAIL_TERDAFTAR, verifikasiKredensial } from "@/server/services/auth";
import { buatUserTes, PASSWORD_TES, resetDb } from "./helpers";

describe("verifikasiKredensial", () => {
  beforeAll(async () => {
    await resetDb();
    await buatUserTes("MEMBER", "member@tes.test", "Citra");
  });
  afterAll(async () => {
    await tutupDb();
  });

  it("mengembalikan pengguna beserta perannya bila kredensial benar", async () => {
    const hasil = await verifikasiKredensial({ email: "member@tes.test", password: PASSWORD_TES });
    expect(hasil).toMatchObject({ email: "member@tes.test", name: "Citra", role: "MEMBER" });
  });
  it("tidak membedakan huruf besar/kecil dan spasi pada email", async () => {
    const hasil = await verifikasiKredensial({ email: "  MEMBER@tes.test ", password: PASSWORD_TES });
    expect(hasil?.role).toBe("MEMBER");
  });
  it("menolak kata sandi salah", async () => {
    expect(await verifikasiKredensial({ email: "member@tes.test", password: "salah" })).toBeNull();
  });
  it("menolak email yang tidak terdaftar", async () => {
    expect(await verifikasiKredensial({ email: "tidak-ada@tes.test", password: PASSWORD_TES })).toBeNull();
  });
  it("menolak masukan yang tidak valid", async () => {
    expect(await verifikasiKredensial({ email: "bukan-email", password: "x" })).toBeNull();
    expect(await verifikasiKredensial({})).toBeNull();
    expect(await verifikasiKredensial(null)).toBeNull();
  });
});

describe("daftarPengguna (US10-b)", () => {
  beforeAll(async () => {
    await resetDb();
  });
  afterAll(async () => {
    await tutupDb();
  });

  const valid = { nama: "  Dewi Anggraini ", email: " Dewi@Tes.TEST ", password: "RahasiaKu#1", konfirmasi: "RahasiaKu#1" };

  it("membuat akun berperan PENGGUNA dengan email ternormalisasi dan kata sandi di-hash", async () => {
    const hasil = await daftarPengguna(valid);
    expect(hasil).toMatchObject({ name: "Dewi Anggraini", email: "dewi@tes.test", role: "PENGGUNA" });

    const { db } = await import("@/server/db");
    const user = await db.orm.public.User.where({ email: "dewi@tes.test" }).first();
    expect(user?.passwordHash).toBeTruthy();
    expect(user?.passwordHash).not.toContain("RahasiaKu#1");
  });
  it("akun baru dapat langsung login", async () => {
    expect(await verifikasiKredensial({ email: "dewi@tes.test", password: "RahasiaKu#1" })).toMatchObject({ role: "PENGGUNA" });
  });
  it("menolak email yang sudah terdaftar (tanpa membedakan huruf besar/kecil)", async () => {
    await expect(daftarPengguna({ ...valid, email: "DEWI@tes.test" })).rejects.toMatchObject({
      galat: { email: PESAN_EMAIL_TERDAFTAR },
    });
  });
  it("tidak pernah menerima peran dari masukan", async () => {
    const hasil = await daftarPengguna({ ...valid, email: "licik@tes.test", role: "MANAGER_TRAVEL" });
    expect(hasil.role).toBe("PENGGUNA");
  });
  it("menolak masukan tidak valid dengan pesan per kolom", async () => {
    const galat = await daftarPengguna({ nama: "A", email: "bukan-email", password: "pendek", konfirmasi: "beda" }).catch((e) => e);
    expect(galat).toBeInstanceOf(GalatValidasi);
    expect(Object.keys(galat.galat).sort()).toEqual(["email", "konfirmasi", "nama", "password"]);
  });
  it("menolak konfirmasi kata sandi yang tidak cocok", async () => {
    await expect(daftarPengguna({ ...valid, email: "lain@tes.test", konfirmasi: "beda" })).rejects.toMatchObject({
      galat: { konfirmasi: "Konfirmasi kata sandi tidak cocok." },
    });
  });
});
