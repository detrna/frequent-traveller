import bcrypt from "bcryptjs";
import { db } from "@/server/db";
import { getDatabaseUrl } from "@/server/db-target";
import type { Role } from "@/lib/enums";

const jalankan = (rencana: { build(): never } | { build(): unknown }) => db.execute(rencana.build() as never);

/** Menolak jalan bila bukan database tes, agar data pengembangan/cloud tidak terhapus. */
function pastikanDatabaseTes() {
  const nama = new URL(getDatabaseUrl()).pathname.replace(/^\//, "");
  if (!/test/i.test(nama)) {
    throw new Error(`Pembersihan ditolak: database "${nama}" bukan database tes.`);
  }
}

/** Mengosongkan semua tabel data. */
export async function resetDb() {
  pastikanDatabaseTes();
  await jalankan(
    db.raw.sql`TRUNCATE TABLE "public"."NotifikasiEmail", "public"."TiketPesawat", "public"."Booking", "public"."Penerbangan", "public"."Maskapai", "public"."Bandara", "public"."Pengunjung", "public"."ProfilMember", "public"."User", "public"."RiwayatCuti", "public"."PermohonanCuti", "public"."Pegawai" CASCADE`.affectedCount(),
  );
}

/** Mengosongkan data transaksi (notifikasi, tiket, booking, penerbangan) tanpa menyentuh pengguna dan referensi. */
export async function bersihkanTransaksi() {
  pastikanDatabaseTes();
  await jalankan(
    db.raw.sql`TRUNCATE TABLE "public"."NotifikasiEmail", "public"."TiketPesawat", "public"."Booking", "public"."Penerbangan" CASCADE`.affectedCount(),
  );
}

export async function bersihkanProfil() {
  pastikanDatabaseTes();
  await jalankan(db.raw.sql`TRUNCATE TABLE "public"."ProfilMember" CASCADE`.affectedCount());
}

/** Menghapus semua data pengunjung beserta akun loginnya. */
export async function bersihkanPengunjung() {
  pastikanDatabaseTes();
  await jalankan(db.raw.sql`TRUNCATE TABLE "public"."Pengunjung" CASCADE`.affectedCount());
  await db.orm.public.User.where({ role: "PENGUNJUNG" }).deleteAndCount();
}

// ---- penghitung & pembacaan kecil yang dipakai berulang oleh tes ----
export async function jumlahBooking(pemilikId?: string) {
  const koleksi = pemilikId ? db.orm.public.Booking.where({ pemilikId }) : db.orm.public.Booking;
  return (await koleksi.aggregate((a) => ({ n: a.count() }))).n;
}
export async function jumlahPengunjung() {
  return (await db.orm.public.Pengunjung.aggregate((a) => ({ n: a.count() }))).n;
}
export async function jumlahProfil() {
  return (await db.orm.public.ProfilMember.aggregate((a) => ({ n: a.count() }))).n;
}
export async function jumlahUserPengunjung(email?: string) {
  const koleksi = email ? db.orm.public.User.where({ role: "PENGUNJUNG", email }) : db.orm.public.User.where({ role: "PENGUNJUNG" });
  return (await koleksi.aggregate((a) => ({ n: a.count() }))).n;
}
export const ambilPenerbanganTes = (id: string) => db.orm.public.Penerbangan.where({ id }).firstOrThrow();
export const ambilTiketTes = (id: string) => db.orm.public.TiketPesawat.where({ id }).firstOrThrow();

export const PASSWORD_TES = "Rahasia#123";

let hashTes: string | undefined;

export async function buatUserTes(role: Role, email = `${role.toLowerCase()}@tes.test`, nama = `Tes ${role}`) {
  hashTes ??= await bcrypt.hash(PASSWORD_TES, 4);
  return db.orm.public.User.create({ email, nama, role, passwordHash: hashTes });
}

/** Besok menurut WIB, format YYYY-MM-DD (selalu di masa depan, jadi lolos validasi tanggal). */
export function besokWIB(tambahHari = 1): string {
  const d = new Date(Date.now() + 7 * 3_600_000 + tambahHari * 86_400_000);
  return d.toISOString().slice(0, 10);
}

/** Bandara + maskapai contoh. Panggil setelah resetDb(). */
export async function siapkanReferensi() {
  const bandara = await Promise.all(
    [
      ["CGK", "Jakarta"],
      ["DPS", "Denpasar"],
      ["SUB", "Surabaya"],
      ["UPG", "Makassar"],
    ].map(([kode, kota]) => db.orm.public.Bandara.create({ kode, kota, nama: `Bandara ${kota}` })),
  );
  const maskapai = await Promise.all(
    [
      ["GA", "Garuda Indonesia"],
      ["JT", "Lion Air"],
    ].map(([kode, nama]) => db.orm.public.Maskapai.create({ kode, nama })),
  );
  return { bandara, maskapai };
}

/** Membuat penerbangan: `tanggal` dan `jam` menurut WIB. */
export async function buatPenerbanganTes(o: {
  asal: string;
  tujuan: string;
  tanggal: string;
  jam: number;
  harga: number;
  kursi?: number;
  maskapai?: string;
  kode?: string;
}) {
  const [asal, tujuan, maskapai] = await Promise.all([
    db.orm.public.Bandara.where({ kode: o.asal }).firstOrThrow(),
    db.orm.public.Bandara.where({ kode: o.tujuan }).firstOrThrow(),
    db.orm.public.Maskapai.where({ kode: o.maskapai ?? "GA" }).firstOrThrow(),
  ]);
  const berangkat = new Date(`${o.tanggal}T${String(o.jam).padStart(2, "0")}:00:00+07:00`);
  return db.orm.public.Penerbangan.create({
    kodePenerbangan: o.kode ?? `${maskapai.kode}${Math.floor(Math.random() * 9000 + 1000)}`,
    maskapaiId: maskapai.id,
    asalId: asal.id,
    tujuanId: tujuan.id,
    berangkat,
    tiba: new Date(berangkat.getTime() + 90 * 60_000),
    harga: o.harga,
    kursiTersedia: o.kursi ?? 10,
  });
}

/** Membuat booking + satu tiket langsung lewat DB (tanpa aturan bisnis), untuk menyiapkan data status/jumlah. */
export async function buatBookingTes(o: {
  pemilikId: string;
  dibuatOlehId?: string;
  penerbanganId: string;
  status?: "BOOKED" | "WAITING_FOR_PAYMENT" | "CONFIRMED" | "DIBATALKAN";
  kode: string;
  pengunjungId?: string;
  namaPenumpang?: string;
}) {
  const booking = await db.orm.public.Booking.create({
    kodeBookingReference: o.kode,
    pemilikId: o.pemilikId,
    dibuatOlehId: o.dibuatOlehId ?? o.pemilikId,
    pengunjungId: o.pengunjungId ?? null,
    status: o.status ?? "BOOKED",
  });
  await db.orm.public.TiketPesawat.create({
    bookingId: booking.id,
    penerbanganId: o.penerbanganId,
    nomorTiket: `TKT-${o.kode}-1`,
    namaPenumpang: o.namaPenumpang ?? "Penumpang Tes",
    status: o.status === "DIBATALKAN" ? "DIBATALKAN" : "TERBIT",
    validatedAt: null,
  });
  return booking;
}

/** Pengirim email palsu: merekam pesan, atau gagal bila `gagal` diisi. */
export function buatDriverPalsu(gagal?: string) {
  const terkirim: Array<{ dari: string; kepada: string; subjek: string; teks: string; html: string }> = [];
  return {
    terkirim,
    driver: {
      nama: "palsu",
      async kirim(pesan: (typeof terkirim)[number]) {
        if (gagal) throw new Error(gagal);
        terkirim.push(pesan);
      },
    },
  };
}
