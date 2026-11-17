import { execSync } from "node:child_process";
import { DEFAULT_TEST_URL } from "../src/server/db-target";

/** Menyamakan database tes dengan kontrak sebelum tes dijalankan. Butuh `npm run db:up`. */
export default function setup() {
  const url = process.env.DATABASE_URL_TEST ?? DEFAULT_TEST_URL;
  try {
    execSync("npx prisma db update --yes --advance-ref test", {
      stdio: "pipe",
      env: { ...process.env, DB_TARGET: "local", DATABASE_URL_LOCAL: url },
    });
  } catch (error) {
    const detail = error instanceof Error && "stderr" in error ? String((error as { stderr: Buffer }).stderr) : "";
    throw new Error(
      `Tidak dapat menyiapkan database tes (${url.replace(/:[^:@/]*@/, ":***@")}).\n` +
        `Pastikan Docker berjalan: npm run db:up\n${detail}`,
    );
  }
}
