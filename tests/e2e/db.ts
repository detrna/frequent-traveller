import { randomUUID } from "node:crypto";
import { Client } from "pg";

const URL_TES = process.env.DATABASE_URL_TEST ?? "postgresql://aps:aps@localhost:5433/aps_test";

/** Menjalankan SQL langsung ke database tes e2e (untuk menyiapkan data yang pasti, terlepas dari seed acak). */
export async function dengan<T>(fn: (q: (sql: string, params?: unknown[]) => Promise<unknown[]>) => Promise<T>): Promise<T> {
  const klien = new Client({ connectionString: URL_TES });
  await klien.connect();
  try {
    return await fn(async (sql, params) => (await klien.query(sql, params)).rows);
  } finally {
    await klien.end();
  }
}

export const id = () => randomUUID();
