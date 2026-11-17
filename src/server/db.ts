import { getDatabaseUrl } from "./db-target";
import { closeDb, createDb, type Db } from "./prisma-client";

// Singleton agar hot-reload di `next dev` tidak membuka koneksi baru setiap kali.
const globalForDb = globalThis as unknown as { __apsDb?: Db };

function getDb(): Db {
  if (!globalForDb.__apsDb) {
    globalForDb.__apsDb = createDb(getDatabaseUrl());
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
    // metode seperti transaction/query harus dipanggil dengan `this` = klien asli, bukan proxy ini
    return typeof nilai === "function" ? nilai.bind(klien) : nilai;
  },
});

/** Menutup klien dan kolam koneksi (untuk skrip/tes agar proses dapat selesai). Aplikasi server tidak memanggil ini. */
export async function tutupDb(): Promise<void> {
  const klien = globalForDb.__apsDb;
  if (klien) {
    globalForDb.__apsDb = undefined;
    await closeDb(klien);
  }
}
