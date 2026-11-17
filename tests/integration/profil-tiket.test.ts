import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { tutupDb } from "@/server/db";
import { GalatBisnis } from "@/server/errors";
import { ambilProfil, perbaruiProfil } from "@/server/services/profil";
import { prosesPemesanan, batalkanPesanan } from "@/server/services/booking";
import { ambilTiketMilik, PESAN_PROFIL_TIDAK_LENGKAP, validasiTiket } from "@/server/services/tiket";
import { ambilTiketTes, bersihkanProfil, bersihkanTransaksi, besokWIB, buatPenerbanganTes, buatUserTes, jumlahProfil, resetDb, siapkanReferensi } from "./helpers";

const PROFIL_LENGKAP = {
  namaLengkap: "Citra Lestari Wijaya",
  tglLahir: "1992-05-17",
  nik: "3174015705920001",
  noPaspor: "C1234567",
  telepon: "081234567890",
  kewarganegaraan: "Indonesia",
  alamat: "Jl. Melati No. 10, Jakarta",
};

let member: { id: string; nama: string };
let lain: { id: string; nama: string };
let penerbanganId: string;

async function galat(janji: Promise<unknown>): Promise<GalatBisnis> {
  try {
    await janji;
  } catch (e) {
    expect(e).toBeInstanceOf(GalatBisnis);
    return e as GalatBisnis;
  }
  throw new Error("Seharusnya melempar GalatBisnis");
}

async function pesan(user: { id: string; nama: string }) {
  const p = await prosesPemesanan(user, { penerbanganId, namaPenumpang: user.nama });
  return { booking: p, tiketId: p.tiket[0].id };
}

beforeAll(async () => {
  await resetDb();
  await siapkanReferensi();
  member = await buatUserTes("MEMBER", "member@tes.test", "Citra Lestari");
  lain = await buatUserTes("MEMBER", "member2@tes.test", "Dimas");
});
afterAll(async () => {
  await tutupDb();
});
beforeEach(async () => {
  await bersihkanTransaksi();
  await bersihkanProfil();
  penerbanganId = (await buatPenerbanganTes({ asal: "CGK", tujuan: "DPS", tanggal: besokWIB(1), jam: 8, harga: 900_000, kursi: 20 })).id;
});

describe("perbaruiProfil (US5-a)", () => {
  it("membuat profil bila belum ada lalu memperbaruinya", async () => {
    expect(await ambilProfil(member.id)).toBeNull();
    const a = await perbaruiProfil(member.id, { ...PROFIL_LENGKAP, alamat: "" });
    expect(a.ok && a.profil.alamat).toBeNull();
    const b = await perbaruiProfil(member.id, PROFIL_LENGKAP);
    expect(b.ok && b.profil).toMatchObject({ namaLengkap: "Citra Lestari Wijaya", nik: "3174015705920001", alamat: "Jl. Melati No. 10, Jakarta" });
    expect(await jumlahProfil()).toBe(1);
  });
  it("tidak menyimpan apa pun bila ada galat format", async () => {
    const hasil = await perbaruiProfil(member.id, { ...PROFIL_LENGKAP, nik: "123" });
    expect(hasil).toEqual({ ok: false, galat: { nik: "NIK harus 16 digit angka." } });
    expect(await ambilProfil(member.id)).toBeNull();
  });
  it("profil satu member tidak memengaruhi member lain", async () => {
    await perbaruiProfil(member.id, PROFIL_LENGKAP);
    expect(await ambilProfil(lain.id)).toBeNull();
  });
});

describe("validasiTiket (US5-b, US5-c)", () => {
  it("menolak dengan pesan wajib 'data profil tidak lengkap' bila belum ada profil, dan tiket tetap terbit", async () => {
    const { tiketId } = await pesan(member);
    const e = await galat(validasiTiket(member.id, tiketId));
    expect(e.message).toBe("data profil tidak lengkap");
    expect(e.message).toBe(PESAN_PROFIL_TIDAK_LENGKAP);
    expect(e.kode).toBe("PROFIL_TIDAK_LENGKAP");
    expect((await ambilTiketTes(tiketId)).status).toBe("TERBIT");
  });

  it("menolak bila profil terisi sebagian, lalu menerima setelah dilengkapi", async () => {
    const { tiketId } = await pesan(member);
    await perbaruiProfil(member.id, { ...PROFIL_LENGKAP, noPaspor: "" });
    expect((await galat(validasiTiket(member.id, tiketId))).message).toBe("data profil tidak lengkap");

    await perbaruiProfil(member.id, PROFIL_LENGKAP);
    const hasil = await validasiTiket(member.id, tiketId);
    expect(hasil.tiket.status).toBe("TERVALIDASI");
    expect(hasil.tiket.validatedAt).toBeInstanceOf(Date);
    expect(hasil.profil).toEqual({ namaLengkap: "Citra Lestari Wijaya", nik: "3174015705920001", noPaspor: "C1234567" });
  });

  it("menolak validasi kedua", async () => {
    const { tiketId } = await pesan(member);
    await perbaruiProfil(member.id, PROFIL_LENGKAP);
    await validasiTiket(member.id, tiketId);
    expect((await galat(validasiTiket(member.id, tiketId))).kode).toBe("SUDAH_TERVALIDASI");
  });

  it("validasi bersamaan hanya berhasil sekali", async () => {
    const { tiketId } = await pesan(member);
    await perbaruiProfil(member.id, PROFIL_LENGKAP);
    const hasil = await Promise.allSettled([validasiTiket(member.id, tiketId), validasiTiket(member.id, tiketId), validasiTiket(member.id, tiketId)]);
    expect(hasil.filter((h) => h.status === "fulfilled")).toHaveLength(1);
  });

  it("tiket yang dibatalkan tidak dapat divalidasi", async () => {
    const { booking, tiketId } = await pesan(member);
    await perbaruiProfil(member.id, PROFIL_LENGKAP);
    await batalkanPesanan(member.id, booking.id);
    expect((await galat(validasiTiket(member.id, tiketId))).kode).toBe("TIKET_DIBATALKAN");
  });

  it("tiket milik member lain dianggap tidak ditemukan, walau profil lengkap", async () => {
    const { tiketId } = await pesan(lain);
    await perbaruiProfil(member.id, PROFIL_LENGKAP);
    expect((await galat(validasiTiket(member.id, tiketId))).kode).toBe("TIDAK_DITEMUKAN");
    expect((await ambilTiketTes(tiketId)).status).toBe("TERBIT");
  });

  it("id tiket yang tidak ada", async () => {
    expect((await galat(validasiTiket(member.id, "tidak-ada"))).kode).toBe("TIDAK_DITEMUKAN");
  });
});

describe("ambilTiketMilik", () => {
  it("hanya tiket milik sendiri, dan tiket yang dibatalkan diurutkan paling akhir", async () => {
    const kedua = (await buatPenerbanganTes({ asal: "CGK", tujuan: "SUB", tanggal: besokWIB(2), jam: 9, harga: 500_000, kursi: 5 })).id;
    const a = await pesan(member);
    const b = await prosesPemesanan(member, { penerbanganId: kedua, namaPenumpang: "Citra" });
    await pesan(lain);
    await batalkanPesanan(member.id, b.id);

    const daftar = await ambilTiketMilik(member.id);
    expect(daftar.map((t) => t.id)).toEqual([a.tiketId, b.tiket[0].id]);
    expect(daftar[1].status).toBe("DIBATALKAN");
    expect(daftar[0].penerbangan.maskapai.nama).toBeTruthy();
  });
});
