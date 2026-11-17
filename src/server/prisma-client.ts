import { Pool } from "pg";
import postgres from "@prisma/orm-postgres/runtime";
import { contractFromJson } from "@prisma/orm-postgres/static";
import type { Contract } from "../prisma/contract.d";
import contractJson from "../prisma/contract.json" with { type: "json" };

export const contract = contractFromJson<Contract>(contractJson);

const kolam = new WeakMap<object, Pool>();

/**
 * Membuat klien Prisma 8 baru untuk URL tertentu (dipakai seed dan tes; aplikasi memakai `db` dari ./db).
 * Kolam koneksi dibuat sendiri agar jumlah koneksinya dapat dibatasi — Prisma 8 tidak mengekspos `max` lewat opsi.
 */
export function createDb(connectionString: string) {
  // Di serverless (Vercel) setiap instans punya kolam sendiri; batasi agar tidak menghabiskan koneksi database.
  const max = Number(process.env.DB_POOL_MAX) || 5;
  const pool = new Pool({ connectionString, max, idleTimeoutMillis: 10_000 });
  // @types/pg dipasang dua kali (milik kita dan milik Prisma) sehingga tipe `Pool` tidak identik; objeknya sama.
  const db = postgres({ contract, pg: pool as never });
  kolam.set(db, pool);
  return db;
}

export type Db = ReturnType<typeof createDb>;

/** Transaksi: argumen `tx` yang diterima callback `db.transaction(async (tx) => ...)`. */
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

/** Menutup klien dan kolam koneksi buatan kita (klien tidak menutup kolam yang diberikan dari luar). */
export async function closeDb(db: Db): Promise<void> {
  await db.close();
  await kolam.get(db)?.end();
}
