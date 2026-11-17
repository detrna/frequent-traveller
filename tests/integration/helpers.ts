import bcrypt from "bcryptjs";
import { db } from "@/server/db";
import { getDatabaseUrl } from "@/server/db-target";
import type { Role } from "@/generated/prisma/enums";

/** Mengosongkan semua tabel. Menolak jalan bila bukan database tes, agar data pengembangan/cloud tidak terhapus. */
export async function resetDb() {
  const nama = new URL(getDatabaseUrl()).pathname.replace(/^\//, "");
  if (!/test/i.test(nama)) {
    throw new Error(`resetDb ditolak: database "${nama}" bukan database tes.`);
  }
  const tabel = await db.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  if (tabel.length === 0) return;
  const daftar = tabel.map((t) => `"${t.tablename}"`).join(", ");
  await db.$executeRawUnsafe(`TRUNCATE TABLE ${daftar} RESTART IDENTITY CASCADE`);
}

export const PASSWORD_TES = "Rahasia#123";

let hashTes: string | undefined;

export async function buatUserTes(role: Role, email = `${role.toLowerCase()}@tes.test`, nama = `Tes ${role}`) {
  hashTes ??= await bcrypt.hash(PASSWORD_TES, 4);
  return db.user.create({ data: { email, nama, role, passwordHash: hashTes } });
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
    ].map(([kode, kota]) => db.bandara.create({ data: { kode, kota, nama: `Bandara ${kota}` } })),
  );
  const maskapai = await Promise.all(
    [
      ["GA", "Garuda Indonesia"],
      ["JT", "Lion Air"],
    ].map(([kode, nama]) => db.maskapai.create({ data: { kode, nama } })),
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
    db.bandara.findUniqueOrThrow({ where: { kode: o.asal } }),
    db.bandara.findUniqueOrThrow({ where: { kode: o.tujuan } }),
    db.maskapai.findUniqueOrThrow({ where: { kode: o.maskapai ?? "GA" } }),
  ]);
  const berangkat = new Date(`${o.tanggal}T${String(o.jam).padStart(2, "0")}:00:00+07:00`);
  return db.penerbangan.create({
    data: {
      kodePenerbangan: o.kode ?? `${maskapai.kode}${Math.floor(Math.random() * 9000 + 1000)}`,
      maskapaiId: maskapai.id,
      asalId: asal.id,
      tujuanId: tujuan.id,
      berangkat,
      tiba: new Date(berangkat.getTime() + 90 * 60_000),
      harga: o.harga,
      kursiTersedia: o.kursi ?? 10,
    },
  });
}
