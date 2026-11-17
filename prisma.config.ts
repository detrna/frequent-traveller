import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";
import { getDatabaseUrl } from "./src/server/db-target";

// Next.js memuat .env.local sendiri, tetapi CLI Prisma tidak. dotenv tidak menimpa variabel yang sudah ada.
loadEnv({ path: ".env.local", quiet: true });
loadEnv({ quiet: true });

function resolveUrl(): string {
  try {
    return getDatabaseUrl();
  } catch {
    // `prisma generate` (postinstall / build Vercel) tidak butuh koneksi, jadi jangan gagal bila URL cloud belum diisi.
    // Perintah yang benar-benar butuh database lewat skrip `npm run db:*`, yang memvalidasi URL dengan pesan jelas.
    return "postgresql://placeholder:placeholder@localhost:5432/placeholder";
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: resolveUrl(),
  },
});
