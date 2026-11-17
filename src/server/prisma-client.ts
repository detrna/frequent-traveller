import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/** Membuat klien Prisma baru untuk URL tertentu (dipakai seed dan tes; aplikasi memakai `db` dari ./db). */
export function createPrismaClient(connectionString: string) {
  // Di serverless (Vercel) setiap instans punya kolam sendiri; batasi agar tidak menghabiskan koneksi database.
  const max = Number(process.env.DB_POOL_MAX) || 5;
  const adapter = new PrismaPg({ connectionString, max, idleTimeoutMillis: 10_000 });
  return new PrismaClient({ adapter });
}

export type Db = ReturnType<typeof createPrismaClient>;
