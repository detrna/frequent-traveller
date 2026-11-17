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
