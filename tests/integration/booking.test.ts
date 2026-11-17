import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { GalatBisnis } from "@/server/errors";
import {
  ambilDataPesanan,
  ambilPesananMilik,
  batalkanPesanan,
  bayarPesanan,
  mulaiPembayaran,
  periksaDapatDibatalkan,
  prosesPemesanan,
  transisiStatus,
} from "@/server/services/booking";
import { besokWIB, buatPenerbanganTes, buatUserTes, resetDb, siapkanReferensi } from "./helpers";

let pengguna: { id: string; nama: string };
let lain: { id: string };
let penerbanganId: string;

async function kursi(id = penerbanganId) {
  return (await db.penerbangan.findUniqueOrThrow({ where: { id } })).kursiTersedia;
}

async function galat(janji: Promise<unknown>): Promise<GalatBisnis> {
  try {
    await janji;
  } catch (e) {
    expect(e).toBeInstanceOf(GalatBisnis);
    return e as GalatBisnis;
  }
  throw new Error("Seharusnya melempar GalatBisnis");
}

beforeAll(async () => {
  await resetDb();
  await siapkanReferensi();
  pengguna = await buatUserTes("PENGGUNA", "pengguna@tes.test", "Budi Santoso");
  lain = await buatUserTes("MEMBER", "member@tes.test", "Citra");
});
afterAll(async () => {
  await db.$disconnect();
});

beforeEach(async () => {
  await db.tiketPesawat.deleteMany();
  await db.booking.deleteMany();
  await db.penerbangan.deleteMany();
  const p = await buatPenerbanganTes({ asal: "CGK", tujuan: "DPS", tanggal: besokWIB(1), jam: 8, harga: 900_000, kursi: 3, maskapai: "JT", kode: "JT100" });
  penerbanganId = p.id;
});

describe("prosesPemesanan (US2-b, US6-c)", () => {
  it("membuat booking berstatus booked dengan kode 6 karakter, menerbitkan tiket, dan mengurangi kursi", async () => {
    const pesanan = await prosesPemesanan(pengguna, { penerbanganId, namaPenumpang: "  Budi Santoso " });

    expect(pesanan.status).toBe("BOOKED");
    expect(pesanan.kodeBookingReference).toMatch(/^[A-HJKMNP-Z2-9]{6}$/);
    expect(pesanan.pemilikId).toBe(pengguna.id);
    expect(pesanan.dibuatOlehId).toBe(pengguna.id);
    expect(pesanan.tiket).toHaveLength(1);
    expect(pesanan.tiket[0]).toMatchObject({ status: "TERBIT", namaPenumpang: "Budi Santoso", nomorTiket: `TKT-${pesanan.kodeBookingReference}-1` });
    expect(pesanan.tiket[0].penerbangan.maskapai.nama).toBe("Lion Air");
    expect(await kursi()).toBe(2);
  });

  it("menolak duplikat: penerbangan yang sama oleh pemilik yang sama", async () => {
    await prosesPemesanan(pengguna, { penerbanganId, namaPenumpang: "Budi Santoso" });
    const e = await galat(prosesPemesanan(pengguna, { penerbanganId, namaPenumpang: "Budi Santoso" }));
    expect(e.kode).toBe("DUPLIKAT");
    expect(e.message).toMatch(/sudah ada/);
    expect(await kursi()).toBe(2); // tidak berkurang lagi
  });

  it("mengizinkan pemesanan ulang setelah pesanan sebelumnya dibatalkan", async () => {
    const p1 = await prosesPemesanan(pengguna, { penerbanganId, namaPenumpang: "Budi Santoso" });
    await batalkanPesanan(pengguna.id, p1.id);
    const p2 = await prosesPemesanan(pengguna, { penerbanganId, namaPenumpang: "Budi Santoso" });
    expect(p2.id).not.toBe(p1.id);
    expect(await kursi()).toBe(2);
  });

  it("pengguna berbeda boleh memesan penerbangan yang sama", async () => {
    await prosesPemesanan(pengguna, { penerbanganId, namaPenumpang: "Budi" });
    await prosesPemesanan(lain, { penerbanganId, namaPenumpang: "Citra" });
    expect(await kursi()).toBe(1);
  });

  it("menolak masukan tidak valid dengan pesan yang jelas", async () => {
    expect((await galat(prosesPemesanan(pengguna, { penerbanganId, namaPenumpang: "ab" }))).message).toBe("Nama penumpang minimal 3 karakter.");
    expect((await galat(prosesPemesanan(pengguna, { penerbanganId: "", namaPenumpang: "Budi" }))).kode).toBe("VALIDASI");
    expect((await galat(prosesPemesanan(pengguna, {}))).kode).toBe("VALIDASI");
  });

  it("menolak penerbangan yang tidak ada", async () => {
    const e = await galat(prosesPemesanan(pengguna, { penerbanganId: "tidak-ada", namaPenumpang: "Budi" }));
    expect(e.message).toBe("Penerbangan tidak ditemukan.");
  });

  it("menolak penerbangan yang sudah berangkat", async () => {
    const lampau = await buatPenerbanganTes({ asal: "CGK", tujuan: "SUB", tanggal: besokWIB(-1), jam: 8, harga: 500_000 });
    const e = await galat(prosesPemesanan(pengguna, { penerbanganId: lampau.id, namaPenumpang: "Budi" }));
    expect(e.kode).toBe("SUDAH_BERANGKAT");
  });

  it("menolak bila kursi penuh", async () => {
    const penuh = await buatPenerbanganTes({ asal: "CGK", tujuan: "SUB", tanggal: besokWIB(1), jam: 9, harga: 500_000, kursi: 0 });
    const e = await galat(prosesPemesanan(pengguna, { penerbanganId: penuh.id, namaPenumpang: "Budi" }));
    expect(e.message).toBe("Kursi pada penerbangan ini sudah penuh.");
    expect(await db.booking.count()).toBe(0);
  });

  it("tidak pernah menjual melebihi kapasitas saat banyak pengguna memesan bersamaan", async () => {
    const banyak = await Promise.all(Array.from({ length: 8 }, (_, i) => buatUserTes("PENGGUNA", `rebut${i}@tes.test`, `Rebut ${i}`)));
    const hasil = await Promise.allSettled(banyak.map((u) => prosesPemesanan(u, { penerbanganId, namaPenumpang: `Penumpang ${u.id}` })));

    expect(hasil.filter((h) => h.status === "fulfilled")).toHaveLength(3); // kapasitas 3
    const ditolak = hasil.filter((h): h is PromiseRejectedResult => h.status === "rejected");
    expect(ditolak).toHaveLength(5);
    expect(ditolak.every((h) => h.reason instanceof GalatBisnis && h.reason.kode === "PENUH")).toBe(true);
    expect(await kursi()).toBe(0);
    expect(await db.booking.count()).toBe(3);
  });

  it("permintaan identik yang bersamaan hanya menghasilkan satu booking", async () => {
    const hasil = await Promise.allSettled(Array.from({ length: 4 }, () => prosesPemesanan(pengguna, { penerbanganId, namaPenumpang: "Budi Santoso" })));
    expect(hasil.filter((h) => h.status === "fulfilled")).toHaveLength(1);
    expect(await db.booking.count({ where: { pemilikId: pengguna.id } })).toBe(1);
    expect(await kursi()).toBe(2);
  });
});

describe("ambilDataPesanan / ambilPesananMilik", () => {
  it("hanya menampilkan pesanan milik sendiri, terbaru lebih dulu", async () => {
    const kedua = await buatPenerbanganTes({ asal: "CGK", tujuan: "SUB", tanggal: besokWIB(2), jam: 7, harga: 600_000 });
    const a = await prosesPemesanan(pengguna, { penerbanganId, namaPenumpang: "Budi" });
    const b = await prosesPemesanan(pengguna, { penerbanganId: kedua.id, namaPenumpang: "Budi" });
    await prosesPemesanan(lain, { penerbanganId, namaPenumpang: "Citra" });

    const daftar = await ambilDataPesanan(pengguna.id);
    expect(daftar.map((d) => d.id)).toEqual([b.id, a.id]);
  });

  it("pesanan orang lain diperlakukan sebagai tidak ditemukan", async () => {
    const milikLain = await prosesPemesanan(lain, { penerbanganId, namaPenumpang: "Citra" });
    const e = await galat(ambilPesananMilik(pengguna.id, milikLain.id));
    expect(e.kode).toBe("TIDAK_DITEMUKAN");
  });
});

describe("pembayaran (simulasi)", () => {
  it("booked → waiting for the payment → confirmed", async () => {
    const p = await prosesPemesanan(pengguna, { penerbanganId, namaPenumpang: "Budi" });
    expect((await mulaiPembayaran(pengguna.id, p.id)).status).toBe("WAITING_FOR_PAYMENT");
    expect((await bayarPesanan(pengguna.id, p.id)).status).toBe("CONFIRMED");
  });

  it("menolak loncat tahap atau mengulang tahap", async () => {
    const p = await prosesPemesanan(pengguna, { penerbanganId, namaPenumpang: "Budi" });
    expect((await galat(bayarPesanan(pengguna.id, p.id))).kode).toBe("STATUS_TIDAK_VALID");
    await mulaiPembayaran(pengguna.id, p.id);
    expect((await galat(mulaiPembayaran(pengguna.id, p.id))).kode).toBe("STATUS_TIDAK_VALID");
  });

  it("tidak dapat membayar pesanan orang lain", async () => {
    const p = await prosesPemesanan(lain, { penerbanganId, namaPenumpang: "Citra" });
    expect((await galat(mulaiPembayaran(pengguna.id, p.id))).kode).toBe("TIDAK_DITEMUKAN");
  });
});

describe("batalkanPesanan (US2-c)", () => {
  it("mengubah status booking dan tiket menjadi dibatalkan serta mengembalikan kursi", async () => {
    const p = await prosesPemesanan(pengguna, { penerbanganId, namaPenumpang: "Budi" });
    expect(await kursi()).toBe(2);

    const hasil = await batalkanPesanan(pengguna.id, p.id);
    expect(hasil.status).toBe("DIBATALKAN");
    expect(hasil.tiket.every((t) => t.status === "DIBATALKAN")).toBe(true);
    expect(await kursi()).toBe(3);
  });

  it("dapat membatalkan pesanan yang sudah confirmed", async () => {
    const p = await prosesPemesanan(pengguna, { penerbanganId, namaPenumpang: "Budi" });
    await mulaiPembayaran(pengguna.id, p.id);
    await bayarPesanan(pengguna.id, p.id);
    expect((await batalkanPesanan(pengguna.id, p.id)).status).toBe("DIBATALKAN");
  });

  it("menolak pembatalan kedua dan tidak mengembalikan kursi dua kali", async () => {
    const p = await prosesPemesanan(pengguna, { penerbanganId, namaPenumpang: "Budi" });
    await batalkanPesanan(pengguna.id, p.id);
    expect((await galat(batalkanPesanan(pengguna.id, p.id))).kode).toBe("SUDAH_DIBATALKAN");
    expect(await kursi()).toBe(3);
  });

  it("pembatalan bersamaan hanya mengembalikan kursi satu kali", async () => {
    const p = await prosesPemesanan(pengguna, { penerbanganId, namaPenumpang: "Budi" });
    const hasil = await Promise.allSettled([batalkanPesanan(pengguna.id, p.id), batalkanPesanan(pengguna.id, p.id), batalkanPesanan(pengguna.id, p.id)]);
    expect(hasil.filter((h) => h.status === "fulfilled")).toHaveLength(1);
    expect(await kursi()).toBe(3);
  });

  it("tidak dapat membatalkan pesanan orang lain", async () => {
    const p = await prosesPemesanan(lain, { penerbanganId, namaPenumpang: "Citra" });
    expect((await galat(batalkanPesanan(pengguna.id, p.id))).kode).toBe("TIDAK_DITEMUKAN");
    expect((await ambilPesananMilik(lain.id, p.id)).status).toBe("BOOKED");
  });
});

describe("aturan status (murni)", () => {
  it("transisiStatus", () => {
    expect(transisiStatus("mulaiPembayaran", "BOOKED")).toBe("WAITING_FOR_PAYMENT");
    expect(transisiStatus("bayar", "WAITING_FOR_PAYMENT")).toBe("CONFIRMED");
    expect(() => transisiStatus("bayar", "CONFIRMED")).toThrow(GalatBisnis);
    expect(() => transisiStatus("mulaiPembayaran", "DIBATALKAN")).toThrow(GalatBisnis);
  });
  it("periksaDapatDibatalkan", () => {
    const depan = [{ berangkat: new Date(Date.now() + 3_600_000) }];
    const lewat = [{ berangkat: new Date(Date.now() - 3_600_000) }];
    expect(() => periksaDapatDibatalkan("BOOKED", depan)).not.toThrow();
    expect(() => periksaDapatDibatalkan("CONFIRMED", depan)).not.toThrow();
    expect(() => periksaDapatDibatalkan("DIBATALKAN", depan)).toThrow(/sudah dibatalkan/);
    expect(() => periksaDapatDibatalkan("BOOKED", lewat)).toThrow(/sudah berangkat/);
  });
});
