import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/** Membuat klien Prisma baru untuk URL tertentu (dipakai seed dan tes; aplikasi memakai `db` dari ./db). */
export function createPrismaClient(connectionString: string) {
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export type Db = ReturnType<typeof createPrismaClient>;
