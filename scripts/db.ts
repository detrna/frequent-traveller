/**
 * Pembungkus perintah database (Prisma ORM 8). Menjalankan CLI `prisma` terhadap target aktif (DB_TARGET) dan
 * menolak perintah destruktif ketika targetnya cloud.
 *
 *   npm run db:target                  tampilkan target aktif
 *   npm run db:emit                    prisma contract emit (skema → src/prisma/contract.json + contract.d.ts)
 *   npm run db:migrate -- --name x     emit + migration plan + db migrate (hanya lokal; setara `migrate dev`)
 *   npm run db:deploy                  prisma db migrate (menerapkan migrasi yang ada; lokal maupun cloud)
 *   npm run db:verify                  prisma db verify (apakah database cocok dengan kontrak)
 *   npm run db:seed [-- --force-cloud] isi data contoh (menghapus data lama!)
 *   npm run db:test:prepare            samakan database tes (aps_test) dengan kontrak
 */
import { spawnSync } from "node:child_process";
import { config as loadEnv } from "dotenv";
import { describeUrl, getDatabaseUrl, getDbTarget, getTestDatabaseUrl } from "../src/server/db-target";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ quiet: true });

const [command, ...rest] = process.argv.slice(2);

function fail(message: string): never {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

function run(cmd: string, args: string[], env: NodeJS.ProcessEnv = process.env): void {
  const result = spawnSync(cmd, args, { stdio: "inherit", env, shell: process.platform === "win32" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const prisma = (...args: string[]) => run("npx", ["prisma", ...args]);

function activeTarget() {
  try {
    return { target: getDbTarget(), url: getDatabaseUrl() };
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}

function requireLocal(action: string, args: string[]) {
  const { target, url } = activeTarget();
  if (target === "cloud") {
    const forced = args.includes("--force-cloud");
    if (!forced || action === "migrate") {
      fail(
        `"${action}" ditolak karena DB_TARGET=cloud (${describeUrl(url)}).\n` +
          `  Ganti ke DB_TARGET=local, atau untuk migrasi cloud pakai: npm run db:deploy` +
          (action === "seed" ? `\n  Untuk sengaja mengisi data contoh ke cloud: npm run db:seed -- --force-cloud` : ""),
      );
    }
  }
  return { target, url };
}

switch (command) {
  case "target": {
    const { target, url } = activeTarget();
    console.log(`DB_TARGET = ${target}\nDatabase  = ${describeUrl(url)}`);
    break;
  }
  case "emit": {
    prisma("contract", "emit", ...rest);
    break;
  }
  case "migrate": {
    const { url } = requireLocal("migrate", rest);
    console.log(`Migrasi (dev) ke ${describeUrl(url)}`);
    prisma("contract", "emit");
    prisma("migration", "plan", ...rest);
    prisma("db", "migrate");
    break;
  }
  case "deploy": {
    const { target, url } = activeTarget();
    console.log(`Menerapkan migrasi (${target}) ke ${describeUrl(url)}`);
    prisma("db", "migrate", ...rest);
    break;
  }
  case "verify": {
    const { url } = activeTarget();
    console.log(`Memeriksa ${describeUrl(url)}`);
    prisma("db", "verify", ...rest);
    break;
  }
  case "seed": {
    const { target, url } = requireLocal("seed", rest);
    console.log(`Mengisi data contoh (${target}) ke ${describeUrl(url)}`);
    run("npx", ["tsx", "prisma/seed.ts", ...rest.filter((a) => a !== "--force-cloud")]);
    break;
  }
  case "test:prepare": {
    const url = getTestDatabaseUrl();
    console.log(`Menyamakan database tes ${describeUrl(url)} dengan kontrak`);
    // Riwayat migrasi database tes tidak perlu dijaga, jadi cukup `db update` (tanpa menulis migrasi).
    // `--advance-ref test` agar ref `db` (yang ikut di-commit dan menjadi asal `migration plan`) tidak ikut bergeser.
    run("npx", ["prisma", "db", "update", "--yes", "--advance-ref", "test"], { ...process.env, DB_TARGET: "local", DATABASE_URL_LOCAL: url });
    break;
  }
  default:
    fail(`Perintah tidak dikenal: "${command ?? ""}". Lihat komentar di scripts/db.ts.`);
}
