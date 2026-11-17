import { config as loadEnv } from "dotenv";
import { definePrismaConfig } from "prisma/config";
import { defineConfig as ormConfig, prisma7Schema } from "@prisma/orm-postgres/config";
import { getDatabaseUrl } from "./src/server/db-target";
import { defineConfig as composer } from "@prisma/composer/config";
import { nextjsBuild } from "@prisma/composer/nextjs/control";
import { nodeBuild } from "@prisma/composer/node/control";
import { prismaCloud, prismaState } from "@prisma/composer-prisma-cloud/control";

// Next.js memuat .env.local sendiri, tetapi CLI Prisma tidak. dotenv tidak menimpa variabel yang sudah ada.
loadEnv({ path: ".env.local", quiet: true });
loadEnv({ quiet: true });

function resolveUrl(): string {
  try {
    return getDatabaseUrl();
  } catch {
    // `contract emit` (postinstall / build) tidak butuh koneksi, jadi jangan gagal bila URL cloud belum diisi.
    // Perintah yang benar-benar butuh database lewat skrip `npm run db:*`, yang memvalidasi URL dengan pesan jelas.
    return "postgresql://placeholder:placeholder@localhost:5432/placeholder";
  }
}

export default definePrismaConfig({
  orm: ormConfig({
    // Skema Prisma 7 tetap menjadi sumber kontrak; Prisma 8 membacanya dan menghasilkan contract.json + contract.d.ts.
    contract: prisma7Schema("prisma/schema.prisma"),
    output: "src/prisma",
    db: { connection: resolveUrl() },
  }),
  composer: composer({
    entry: "./module.mjs",
    extensions: [prismaCloud({ region: "ap-southeast-1" }), nodeBuild(), nextjsBuild()],
    state: prismaState(),
  }),
});
