import { getDatabaseUrl } from "./db-target";
import { createPrismaClient, type Db } from "./prisma-client";

// Singleton agar hot-reload di `next dev` tidak membuka koneksi baru setiap kali.
const globalForDb = globalThis as unknown as { __apsDb?: Db };

function getDb(): Db {
  if (!globalForDb.__apsDb) {
    globalForDb.__apsDb = createPrismaClient(getDatabaseUrl());
  }
  return globalForDb.__apsDb;
}

/**
 * Klien database. Koneksi baru dibuat saat pertama kali dipakai (bukan saat modul diimpor),
 * sehingga `next build` tidak membutuhkan database maupun kredensial cloud.
 */
export const db = new Proxy({} as Db, {
  get(_target, prop) {
    const klien = getDb();
    const nilai = Reflect.get(klien, prop);
    // metode seperti $transaction/$queryRaw harus dipanggil dengan `this` = klien asli, bukan proxy ini
    return typeof nilai === "function" ? nilai.bind(klien) : nilai;
  },
});
