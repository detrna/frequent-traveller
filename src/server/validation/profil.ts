import { z } from "zod";
import { tanggalValid, tanggalWIB } from "@/lib/waktu";

/** Kolom kosong dari form → null (berarti "belum diisi"); selain itu divalidasi formatnya. */
const isian = <T extends z.ZodType>(skema: T) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? null : v), skema.nullable());

const hapusPemisah = (v: string) => v.replace(/[\s().-]/g, "");

export const profilSkema = z.object({
  namaLengkap: isian(z.string().trim().min(3, { error: "Nama lengkap minimal 3 karakter." }).max(100, { error: "Nama lengkap maksimal 100 karakter." })),
  tglLahir: isian(
    z
      .string()
      .trim()
      .refine(tanggalValid, { error: "Tanggal lahir tidak valid." })
      .refine((v) => v <= tanggalWIB(), { error: "Tanggal lahir tidak boleh di masa depan." })
      .refine((v) => v >= "1900-01-01", { error: "Tanggal lahir tidak valid." })
      .transform((v) => new Date(`${v}T00:00:00Z`)),
  ),
  nik: isian(z.string().transform(hapusPemisah).pipe(z.string().regex(/^\d{16}$/, { error: "NIK harus 16 digit angka." }))),
  noPaspor: isian(
    z.string().trim().toUpperCase().regex(/^[A-Z0-9]{6,9}$/, { error: "Nomor paspor harus 6–9 huruf/angka." }),
  ),
  telepon: isian(
    z
      .string()
      .transform(hapusPemisah)
      .pipe(z.string().regex(/^(\+62|62|0)8\d{8,11}$/, { error: "Nomor telepon tidak valid. Contoh: 081234567890." })),
  ),
  kewarganegaraan: isian(z.string().trim().min(2, { error: "Kewarganegaraan minimal 2 karakter." }).max(60, { error: "Kewarganegaraan maksimal 60 karakter." })),
  alamat: isian(z.string().trim().min(5, { error: "Alamat minimal 5 karakter." }).max(255, { error: "Alamat maksimal 255 karakter." })),
});

export type ProfilInput = z.output<typeof profilSkema>;
