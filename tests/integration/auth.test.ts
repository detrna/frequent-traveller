import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { tutupDb } from "@/server/db";
import { verifikasiKredensial } from "@/server/services/auth";
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
