import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/server/db";
import type { Role } from "@/generated/prisma/enums";

const kredensialSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1),
});

export interface PenggunaTerautentikasi {
  id: string;
  name: string;
  email: string;
  role: Role;
}

// Hash asli untuk dibandingkan saat email tidak ditemukan, agar waktu respons tidak membocorkan keberadaan akun.
let hashPalsu: string | undefined;
function ambilHashPalsu() {
  return (hashPalsu ??= bcrypt.hashSync("kata-sandi-palsu", 10));
}

/** Memeriksa email + kata sandi. Mengembalikan null bila salah (pesan galat sengaja tidak dibedakan). */
export async function verifikasiKredensial(masukan: unknown): Promise<PenggunaTerautentikasi | null> {
  const hasil = kredensialSchema.safeParse(masukan);
  if (!hasil.success) return null;

  const user = await db.user.findUnique({ where: { email: hasil.data.email } });
  const cocok = await bcrypt.compare(hasil.data.password, user?.passwordHash ?? ambilHashPalsu());
  if (!user || !cocok) return null;

  return { id: user.id, name: user.nama, email: user.email, role: user.role };
}
