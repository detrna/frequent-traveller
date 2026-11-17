import { z } from "zod";

/** Pendaftaran akun mandiri (US10-b). Peran tidak ada di sini: akun baru selalu Pengguna. */
export const daftarSkema = z
  .object({
    nama: z
      .string({ error: "Nama wajib diisi." })
      .trim()
      .min(2, { error: "Nama minimal 2 karakter." })
      .max(100, { error: "Nama maksimal 100 karakter." }),
    email: z
      .string({ error: "Email wajib diisi." })
      .trim()
      .toLowerCase()
      .pipe(z.email({ error: "Format email tidak valid." })),
    password: z
      .string({ error: "Kata sandi wajib diisi." })
      .min(8, { error: "Kata sandi minimal 8 karakter." })
      .max(72, { error: "Kata sandi maksimal 72 karakter." }),
    konfirmasi: z.string({ error: "Konfirmasi kata sandi wajib diisi." }),
  })
  .refine((v) => v.password === v.konfirmasi, { path: ["konfirmasi"], error: "Konfirmasi kata sandi tidak cocok." });

export type MasukanDaftar = z.input<typeof daftarSkema>;
