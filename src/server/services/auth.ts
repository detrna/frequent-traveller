import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/server/db";
import type { Role } from "@/lib/enums";
import { GalatValidasi } from "@/server/errors";
import { validasi } from "@/server/validation/common";
import { daftarSkema } from "@/server/validation/auth";

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

  const user = await db.orm.public.User.where({ email: hasil.data.email }).first();
  const cocok = await bcrypt.compare(hasil.data.password, user?.passwordHash ?? ambilHashPalsu());
  if (!user || !cocok) return null;

  return { id: user.id, name: user.nama, email: user.email, role: user.role };
}

export const PESAN_EMAIL_TERDAFTAR = "Email sudah terdaftar.";

/**
 * Mendaftarkan akun baru (US10-b). Peran selalu PENGGUNA: tidak pernah dibaca dari masukan.
 * Mengembalikan data yang sama dengan `verifikasiKredensial` agar langsung dapat dipakai login.
 */
export async function daftarPengguna(masukan: unknown): Promise<PenggunaTerautentikasi> {
  const cek = validasi(daftarSkema, masukan);
  if (!cek.ok) throw new GalatValidasi(cek.galat);
  const { nama, email, password } = cek.data;

  const emailTerpakai = async () => (await db.orm.public.User.where({ email }).select("id").first()) !== null;
  if (await emailTerpakai()) throw new GalatValidasi({ email: PESAN_EMAIL_TERDAFTAR });

  const passwordHash = await bcrypt.hash(password, 10);
  try {
    const user = await db.orm.public.User.create({ nama, email, passwordHash, role: "PENGGUNA" });
    return { id: user.id, name: user.nama, email: user.email, role: user.role };
  } catch (error) {
    // Pendaftar lain dengan email sama menyela di antara pemeriksaan dan penyimpanan (batasan unik).
    if (await emailTerpakai()) throw new GalatValidasi({ email: PESAN_EMAIL_TERDAFTAR });
    throw error;
  }
}
