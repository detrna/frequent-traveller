/**
 * Sumber kebenaran tunggal untuk memilih database: lokal (docker compose) atau cloud (Prisma Postgres).
 * Dipakai oleh prisma.config.ts, klien Prisma saat runtime, seed, dan skrip `npm run db:*`.
 * Tidak boleh mengimpor apa pun dari Next.js agar bisa dijalankan di luar Next.
 */

export type DbTarget = "local" | "cloud";

type Env = Record<string, string | undefined>;

export const DEFAULT_LOCAL_URL = "postgresql://aps:aps@localhost:5433/aps";
export const DEFAULT_TEST_URL = "postgresql://aps:aps@localhost:5433/aps_test";

function isDirectPostgresUrl(value: string | undefined): value is string {
  return !!value && /^postgres(ql)?:\/\//i.test(value.trim());
}

export function getDbTarget(env: Env = process.env): DbTarget {
  const raw = (env.DB_TARGET ?? "local").trim().toLowerCase();
  if (raw === "local" || raw === "cloud") return raw;
  throw new Error(`DB_TARGET tidak valid: "${env.DB_TARGET}". Gunakan "local" atau "cloud".`);
}

/** URL koneksi langsung (TCP) untuk target aktif. Melempar galat yang jelas bila belum diisi. */
export function getDatabaseUrl(env: Env = process.env): string {
  const target = getDbTarget(env);

  if (target === "local") {
    return env.DATABASE_URL_LOCAL?.trim() || DEFAULT_LOCAL_URL;
  }

  // Cloud: utamakan DATABASE_URL_CLOUD; integrasi Vercel × Prisma Postgres menyediakan POSTGRES_URL / DATABASE_URL.
  // `prisma+postgres://` (Accelerate) tidak didukung oleh driver adapter pg, jadi hanya URL langsung yang diterima.
  const candidates = [env.DATABASE_URL_CLOUD, env.POSTGRES_URL, env.DATABASE_URL];
  const url = candidates.find(isDirectPostgresUrl);
  if (!url) {
    throw new Error(
      'DB_TARGET=cloud tetapi DATABASE_URL_CLOUD belum diisi dengan URL "postgres://..." langsung dari Prisma Postgres.',
    );
  }
  return url.trim();
}

/** URL database untuk tes integrasi (selalu lokal). */
export function getTestDatabaseUrl(env: Env = process.env): string {
  return env.DATABASE_URL_TEST?.trim() || DEFAULT_TEST_URL;
}

/** Ringkasan URL tanpa kata sandi, aman untuk dicetak. */
export function describeUrl(url: string): string {
  try {
    const u = new URL(url);
    const db = u.pathname.replace(/^\//, "");
    return `${u.protocol}//${u.username ? `${u.username}:***@` : ""}${u.host}/${db}`;
  } catch {
    return "(URL tidak dapat dibaca)";
  }
}
