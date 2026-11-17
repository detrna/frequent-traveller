import { z } from "zod";
import { tanggalValid, tanggalWIB } from "@/lib/waktu";

export type GalatField = Record<string, string>;

export type HasilValidasi<T> = { ok: true; data: T } | { ok: false; galat: GalatField };

/** Menjalankan skema zod dan mengubah galatnya menjadi {namaField: pesan pertama}. */
export function validasi<S extends z.ZodType>(skema: S, masukan: unknown): HasilValidasi<z.output<S>> {
  const hasil = skema.safeParse(masukan);
  if (hasil.success) return { ok: true, data: hasil.data };
  const galat: GalatField = {};
  for (const isu of hasil.error.issues) {
    const kunci = isu.path.join(".") || "_";
    galat[kunci] ??= isu.message;
  }
  return { ok: false, galat };
}

/** Teks opsional dari form: string kosong → undefined. */
export const teksOpsional = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

export const kodeBandara = (pesan: string) =>
  z
    .string({ error: pesan })
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, { error: pesan });

const tanggalDasar = z
  .string({ error: "Tanggal wajib diisi." })
  .trim()
  .refine((v) => tanggalValid(v), { error: "Tanggal tidak valid." })
  .refine((v) => v >= tanggalWIB(), { error: "Tanggal tidak boleh di masa lalu." });

export const tanggalWajib = () => tanggalDasar;

export const tanggalOpsional = () => z.union([z.literal("").transform(() => undefined), tanggalDasar]).optional();

/** Jam 0–23 dari input form (string) atau kosong. */
export const jamOpsional = (nama: string) =>
  z
    .union([z.literal("").transform(() => undefined), z.coerce.number({ error: `${nama} tidak valid.` }).int({ error: `${nama} tidak valid.` }).min(0, { error: `${nama} harus 0–23.` }).max(23, { error: `${nama} harus 0–23.` })])
    .optional();

/** Pola yang dipakai profil member (US5) dan data pengunjung (US8). */
export const hapusPemisah = (v: string) => v.replace(/[\s().-]/g, "");
export const POLA_NIK = /^\d{16}$/;
export const POLA_TELEPON = /^(\+62|62|0)8\d{8,11}$/;
