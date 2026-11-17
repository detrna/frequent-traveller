import { execSync } from "node:child_process";

/** Menyiapkan database tes: migrasi + seed ulang (data contoh deterministik). Butuh `npm run db:up`. */
export default function globalSetup() {
  const url = process.env.DATABASE_URL_TEST ?? "postgresql://aps:aps@localhost:5433/aps_test";
  const env = { ...process.env, DB_TARGET: "local", DATABASE_URL_LOCAL: url };
  try {
    execSync("npx prisma migrate deploy", { env, stdio: "pipe" });
    execSync("npx tsx prisma/seed.ts", { env, stdio: "pipe" });
  } catch (error) {
    const stderr = error instanceof Error && "stderr" in error ? String((error as { stderr: Buffer }).stderr) : "";
    throw new Error(`Gagal menyiapkan database e2e. Pastikan Docker berjalan (npm run db:up).\n${stderr}`);
  }
}
