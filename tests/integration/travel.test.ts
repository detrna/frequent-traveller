import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { GalatBisnis, GalatValidasi } from "@/server/errors";
import { verifikasiKredensial } from "@/server/services/auth";
import { buatEtiket, kirimEtiket } from "@/server/services/etiket";
import { ambilTiketMilik } from "@/server/services/tiket";
import { ambilStatusBooking, kirimUlangEtiket, otorisasiKodeBooking, pesanUntukPengunjung, PESAN_KODE_TIDAK_SESUAI } from "@/server/services/travel";
import { besokWIB, buatBookingTes, buatDriverPalsu, buatPenerbanganTes, buatUserTes, resetDb, siapkanReferensi } from "./helpers";

let manager: { id: string };
let pengguna: { id: string };
let penerbanganId: string;

const DATA = { nama: "Fajar Hidayat", email: "Pengunjung1@Aps.Test ", telepon: "0813-0000-0001", nik: "3578010101900001" };

async function galat<T extends Error = GalatBisnis>(janji: Promise<unknown>): Promise<T> {
  try {
    await janji;
  } catch (e) {
    expect(e).toBeInstanceOf(GalatBisnis);
    return e as T;
  }
  throw new Error("Seharusnya melempar galat");
}

beforeAll(async () => {
  await resetDb();
  await siapkanReferensi();
  manager = await buatUserTes("MANAGER_TRAVEL", "travel@tes.test", "Eka");
  pengguna = await buatUserTes("PENGGUNA", "pengguna@tes.test", "Budi");
});
afterAll(async () => {
  await db.$disconnect();
});
beforeEach(async () => {
  await db.notifikasiEmail.deleteMany();
  await db.tiketPesawat.deleteMany();
  await db.booking.deleteMany();
  await db.pengunjung.deleteMany();
  await db.user.deleteMany({ where: { role: "PENGUNJUNG" } });
  await db.penerbangan.deleteMany();
  penerbanganId = (await buatPenerbanganTes({ asal: "CGK", tujuan: "DPS", tanggal: besokWIB(1), jam: 8, harga: 900_000, kursi: 5, maskapai: "GA", kode: "GA100" })).id;
});

describe("ambilStatusBooking (US7)", () => {
  beforeEach(async () => {
    const status = ["CONFIRMED", "CONFIRMED", "BOOKED", "WAITING_FOR_PAYMENT", "DIBATALKAN"] as const;
    for (const [i, s] of status.entries()) await buatBookingTes({ pemilikId: pengguna.id, penerbanganId, status: s, kode: `BK${i}AAA` });
  });

  it("tanpa filter menampilkan semua status beserta ringkasan jumlahnya", async () => {
    const hasil = await ambilStatusBooking({});
    expect(hasil.total).toBe(5);
    expect(hasil.filter).toBeUndefined();
    expect(hasil.jumlahPerStatus).toEqual({ CONFIRMED: 2, BOOKED: 1, WAITING_FOR_PAYMENT: 1, DIBATALKAN: 1 });
    expect(hasil.booking[0].tiket[0].penerbangan.maskapai.nama).toBe("Garuda Indonesia");
  });
  it.each([
    ["confirmed", "CONFIRMED", 2],
    ["booked", "BOOKED", 1],
    ["waiting_for_payment", "WAITING_FOR_PAYMENT", 1],
  ])("filter %s hanya menampilkan status itu", async (param, status, jumlah) => {
    const hasil = await ambilStatusBooking({ status: param });
    expect(hasil.filter).toBe(status);
    expect(hasil.booking).toHaveLength(jumlah);
    expect(hasil.booking.every((b) => b.status === status)).toBe(true);
    expect(hasil.jumlahPerStatus.CONFIRMED).toBe(2); // ringkasan tidak ikut terfilter
  });
  it("filter kosong = semua; filter yang tidak dikenal ditolak (dibatalkan bukan opsi filter)", async () => {
    expect((await ambilStatusBooking({ status: "" })).total).toBe(5);
    expect((await galat(ambilStatusBooking({ status: "dibatalkan" }))).message).toBe("Status tidak dikenal.");
    await galat(ambilStatusBooking({ status: "DROP TABLE" }));
  });
  it("membagi halaman 20 per halaman dan membatasi nomor halaman", async () => {
    for (let i = 0; i < 22; i++) await buatBookingTes({ pemilikId: pengguna.id, penerbanganId, kode: `PG${String(i).padStart(2, "0")}AAA`.slice(0, 6) });
    const h1 = await ambilStatusBooking({ halaman: "1" });
    expect(h1).toMatchObject({ total: 27, totalHalaman: 2, halaman: 1 });
    expect(h1.booking).toHaveLength(20);
    expect((await ambilStatusBooking({ halaman: "2" })).booking).toHaveLength(7);
    expect((await ambilStatusBooking({ halaman: "99" })).halaman).toBe(2);
    expect((await ambilStatusBooking({ halaman: "abc" })).halaman).toBe(1);
  });
});

describe("otorisasiKodeBooking (US9)", () => {
  beforeEach(async () => {
    await buatBookingTes({ pemilikId: pengguna.id, penerbanganId, status: "WAITING_FOR_PAYMENT", kode: "AP5T3K" });
  });

  it("menampilkan status booking untuk kode yang sesuai (tidak peka huruf besar/kecil dan spasi)", async () => {
    for (const masukan of ["AP5T3K", "ap5t3k", "  ap5 t3k  "]) {
      const b = await otorisasiKodeBooking(masukan);
      expect(b.kodeBookingReference).toBe("AP5T3K");
      expect(b.status).toBe("WAITING_FOR_PAYMENT");
    }
  });
  it("kode yang tidak sesuai ditolak dengan pesan wajib 'kode booking reference tidak sesuai'", async () => {
    for (const masukan of ["ZZZZZZ", "AP5T3", "", "   ", "'; DROP TABLE", null, undefined, 123]) {
      const e = await galat(otorisasiKodeBooking(masukan));
      expect(e.message).toBe("kode booking reference tidak sesuai");
      expect(e.message).toBe(PESAN_KODE_TIDAK_SESUAI);
      expect(e.kode).toBe("KODE_TIDAK_SESUAI");
    }
  });
});

describe("pesanUntukPengunjung (US8-b) dan e-tiket (US8-d)", () => {
  it("pengunjung baru: membuat akun login, booking atas namanya, mengurangi kursi, dan mengirim e-tiket", async () => {
    const { driver, terkirim } = buatDriverPalsu();
    const hasil = await pesanUntukPengunjung(manager, { penerbanganId, pengunjung: DATA }, { driverEmail: driver });

    expect(hasil.akunBaru).toBe(true);
    expect(hasil.pengunjung).toMatchObject({ nama: "Fajar Hidayat", email: "pengunjung1@aps.test" });
    expect(hasil.booking).toMatchObject({ status: "BOOKED", dibuatOlehId: manager.id });
    expect(hasil.booking.tiket[0]).toMatchObject({ namaPenumpang: "Fajar Hidayat", status: "TERBIT" });
    expect(hasil.booking.pemilikId).not.toBe(manager.id);
    expect((await db.penerbangan.findUniqueOrThrow({ where: { id: penerbanganId } })).kursiTersedia).toBe(4);

    // kata sandi sementara benar-benar dapat dipakai login, dan tidak tersimpan sebagai teks asli
    expect(hasil.kataSandiSementara).toMatch(/^[\w-]{12}$/);
    const akun = await db.user.findUniqueOrThrow({ where: { email: "pengunjung1@aps.test" } });
    expect(akun.role).toBe("PENGUNJUNG");
    expect(akun.passwordHash).not.toContain(hasil.kataSandiSementara!);
    expect(await verifikasiKredensial({ email: "pengunjung1@aps.test", password: hasil.kataSandiSementara })).toMatchObject({ role: "PENGUNJUNG" });

    // e-tiket terkirim ke email terdaftar
    expect(terkirim).toHaveLength(1);
    expect(terkirim[0].kepada).toBe("pengunjung1@aps.test");
    expect(terkirim[0].subjek).toBe(`E-tiket APS ${hasil.booking.tiket[0].nomorTiket}`);
    expect(terkirim[0].teks).toContain(hasil.booking.kodeBookingReference);
    expect(terkirim[0].teks).toContain("Jakarta (CGK) → Denpasar (DPS)");
    expect(terkirim[0].teks).toContain("Garuda Indonesia GA100");
    expect(hasil.etiket).toMatchObject({ terkirim: 1, gagal: 0 });
    const notif = await db.notifikasiEmail.findMany();
    expect(notif).toHaveLength(1);
    expect(notif[0]).toMatchObject({ status: "TERKIRIM", kepada: "pengunjung1@aps.test", percobaan: 1, error: null });
    expect(notif[0].terkirimAt).toBeInstanceOf(Date);
  });

  it("pengunjung muncul di 'tiket saya' miliknya dan bukan milik manager (US8-c)", async () => {
    const { driver } = buatDriverPalsu();
    const hasil = await pesanUntukPengunjung(manager, { penerbanganId, pengunjung: DATA }, { driverEmail: driver });
    const tiket = await ambilTiketMilik(hasil.booking.pemilikId);
    expect(tiket).toHaveLength(1);
    expect(tiket[0].booking.kodeBookingReference).toBe(hasil.booking.kodeBookingReference);
    expect(await ambilTiketMilik(manager.id)).toHaveLength(0);
  });

  it("pengunjung yang sudah ada dipakai ulang tanpa akun/kata sandi baru", async () => {
    const { driver } = buatDriverPalsu();
    const pertama = await pesanUntukPengunjung(manager, { penerbanganId, pengunjung: DATA }, { driverEmail: driver });
    const kedua = await buatPenerbanganTes({ asal: "CGK", tujuan: "SUB", tanggal: besokWIB(2), jam: 9, harga: 600_000, kursi: 5 });
    const hasil = await pesanUntukPengunjung(manager, { penerbanganId: kedua.id, pengunjung: { ...DATA, nama: "Nama Lain Yang Diketik" } }, { driverEmail: driver });

    expect(hasil.akunBaru).toBe(false);
    expect(hasil.kataSandiSementara).toBeUndefined();
    expect(hasil.pengunjung.id).toBe(pertama.pengunjung.id);
    expect(hasil.pengunjung.nama).toBe("Fajar Hidayat"); // data tersimpan tidak ditimpa
    expect(await db.pengunjung.count()).toBe(1);
    expect(await db.user.count({ where: { role: "PENGUNJUNG" } })).toBe(1);
  });

  it("data pengunjung tidak lengkap/tidak valid ditolak per kolom dan tidak membuat apa pun", async () => {
    const e = await galat<GalatValidasi>(pesanUntukPengunjung(manager, { penerbanganId, pengunjung: { nama: "Fa", email: "bukan-email", telepon: "123", nik: "12" } }));
    expect(e).toBeInstanceOf(GalatValidasi);
    expect(e.galat).toEqual({
      nama: "Nama pengunjung minimal 3 karakter.",
      email: "Format email pengunjung tidak valid.",
      telepon: "Nomor telepon tidak valid. Contoh: 081234567890.",
      nik: "NIK harus 16 digit angka.",
    });
    expect((await galat<GalatValidasi>(pesanUntukPengunjung(manager, { penerbanganId, pengunjung: {} }))).galat.nik).toBe("NIK pengunjung wajib diisi.");
    expect((await galat(pesanUntukPengunjung(manager, { penerbanganId: " ", pengunjung: DATA }))).message).toBe("Pilih penerbangan terlebih dahulu.");
    expect(await db.pengunjung.count()).toBe(0);
    expect(await db.booking.count()).toBe(0);
  });

  it("menolak email yang sudah dipakai akun non-pengunjung", async () => {
    const e = await galat(pesanUntukPengunjung(manager, { penerbanganId, pengunjung: { ...DATA, email: "pengguna@tes.test" } }));
    expect(e.kode).toBe("EMAIL_DIPAKAI");
    expect(await db.booking.count()).toBe(0);
  });

  it("kursi penuh: pemesanan gagal dan tidak meninggalkan akun pengunjung (transaksi dibatalkan)", async () => {
    const penuh = await buatPenerbanganTes({ asal: "CGK", tujuan: "SUB", tanggal: besokWIB(1), jam: 9, harga: 500_000, kursi: 0 });
    const e = await galat(pesanUntukPengunjung(manager, { penerbanganId: penuh.id, pengunjung: DATA }));
    expect(e.kode).toBe("PENUH");
    expect(await db.pengunjung.count()).toBe(0);
    expect(await db.user.count({ where: { email: "pengunjung1@aps.test" } })).toBe(0);
  });

  it("pesanan yang sama untuk pengunjung yang sama ditolak sebagai duplikat", async () => {
    const { driver } = buatDriverPalsu();
    await pesanUntukPengunjung(manager, { penerbanganId, pengunjung: DATA }, { driverEmail: driver });
    expect((await galat(pesanUntukPengunjung(manager, { penerbanganId, pengunjung: DATA }, { driverEmail: driver }))).kode).toBe("DUPLIKAT");
  });
});

describe("pengiriman e-tiket gagal dan kirim ulang (alternatif RB18)", () => {
  it("kegagalan kirim tidak membatalkan pesanan; dicatat GAGAL lalu terkirim saat dikirim ulang", async () => {
    const rusak = buatDriverPalsu("SMTP tidak dapat dihubungi");
    const hasil = await pesanUntukPengunjung(manager, { penerbanganId, pengunjung: DATA }, { driverEmail: rusak.driver });

    expect(hasil.booking.status).toBe("BOOKED"); // pesanan tetap ada
    expect(hasil.etiket).toMatchObject({ terkirim: 0, gagal: 1 });
    let notif = await db.notifikasiEmail.findMany();
    expect(notif).toHaveLength(1);
    expect(notif[0]).toMatchObject({ status: "GAGAL", error: "SMTP tidak dapat dihubungi", percobaan: 1, terkirimAt: null });

    const baik = buatDriverPalsu();
    const ulang = await kirimUlangEtiket(hasil.booking.id, baik.driver);
    expect(ulang).toMatchObject({ terkirim: 1, gagal: 0 });
    expect(baik.terkirim).toHaveLength(1);
    notif = await db.notifikasiEmail.findMany();
    expect(notif).toHaveLength(1); // baris yang sama diperbarui, bukan menumpuk
    expect(notif[0]).toMatchObject({ status: "TERKIRIM", error: null, percobaan: 2 });

    // kirim ulang berikutnya tidak mengirim dobel
    const lagi = await kirimUlangEtiket(hasil.booking.id, baik.driver);
    expect(lagi).toMatchObject({ terkirim: 0, gagal: 0, dilewati: 1 });
    expect(baik.terkirim).toHaveLength(1);
  });

  it("kirim ulang yang masih gagal menambah jumlah percobaan", async () => {
    const rusak = buatDriverPalsu("timeout");
    const hasil = await pesanUntukPengunjung(manager, { penerbanganId, pengunjung: DATA }, { driverEmail: rusak.driver });
    await kirimUlangEtiket(hasil.booking.id, rusak.driver);
    const notif = await db.notifikasiEmail.findMany();
    expect(notif).toHaveLength(1);
    expect(notif[0]).toMatchObject({ status: "GAGAL", percobaan: 2 });
  });

  it("email terdaftar tidak tersedia → dicatat gagal dengan alasan yang jelas", async () => {
    const { driver, terkirim } = buatDriverPalsu();
    const hasil = await pesanUntukPengunjung(manager, { penerbanganId, pengunjung: DATA }, { driverEmail: buatDriverPalsu("x").driver });
    await db.pengunjung.update({ where: { id: hasil.pengunjung.id }, data: { email: "  " } });
    const ulang = await kirimUlangEtiket(hasil.booking.id, driver);
    expect(ulang.gagal).toBe(1);
    expect(ulang.rincian[0].error).toBe("Email terdaftar pengunjung tidak tersedia.");
    expect(terkirim).toHaveLength(0);
  });

  it("tiket yang dibatalkan dilewati, dan booking non-pengunjung ditolak", async () => {
    const { driver, terkirim } = buatDriverPalsu();
    const hasil = await pesanUntukPengunjung(manager, { penerbanganId, pengunjung: DATA }, { driverEmail: buatDriverPalsu("x").driver });
    await db.tiketPesawat.updateMany({ where: { bookingId: hasil.booking.id }, data: { status: "DIBATALKAN" } });
    expect(await kirimEtiket(hasil.booking.id, driver)).toMatchObject({ terkirim: 0, dilewati: 1 });
    expect(terkirim).toHaveLength(0);

    const sendiri = await buatBookingTes({ pemilikId: pengguna.id, penerbanganId, kode: "SENDIR" });
    expect((await galat(kirimEtiket(sendiri.id, driver))).kode).toBe("BUKAN_PENGUNJUNG");
    expect((await galat(kirimEtiket("tidak-ada", driver))).kode).toBe("TIDAK_DITEMUKAN");
  });
});

describe("buatEtiket", () => {
  it("mengosongkan HTML berbahaya pada nama penumpang", async () => {
    const { driver, terkirim } = buatDriverPalsu();
    const hasil = await pesanUntukPengunjung(manager, { penerbanganId, pengunjung: { ...DATA, nama: `<script>alert("x")</script> Budi` } }, { driverEmail: driver });
    expect(hasil.etiket).toMatchObject({ terkirim: 1 });
    expect(terkirim[0].html).not.toContain("<script>");
    expect(terkirim[0].html).toContain("&lt;script&gt;");
    const pesan = buatEtiket(hasil.booking, hasil.booking.tiket[0]);
    expect(pesan.html).toContain("E-tiket APS");
  });
});
