import { z } from "zod";
import { hapusPemisah, POLA_NIK, POLA_TELEPON } from "./common";
import { normalisasiKodeBooking } from "@/lib/kode-booking";
import { PARAM_STATUS } from "@/lib/status";

/** ?status= pada US7: kosong = semua; selain itu harus salah satu dari tiga status yang dapat difilter. */
export const filterStatusSkema = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z
    .string()
    .refine((v) => v in PARAM_STATUS, { error: "Status tidak dikenal." })
    .transform((v) => PARAM_STATUS[v])
    .optional(),
);

export const halamanSkema = z.preprocess(
  (v) => (typeof v === "string" && /^\d+$/.test(v) ? Number(v) : 1),
  z.number().int().min(1).max(10_000),
);

export const kodeBookingSkema = z.string().transform(normalisasiKodeBooking);

/** "Data Pengunjung" yang lengkap untuk memesan atas nama pengunjung (US8-b). */
export const dataPengunjungSkema = z.object({
  nama: z.string({ error: "Nama pengunjung wajib diisi." }).trim().min(3, { error: "Nama pengunjung minimal 3 karakter." }).max(100, { error: "Nama pengunjung maksimal 100 karakter." }),
  email: z
    .string({ error: "Email pengunjung wajib diisi." })
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "Format email pengunjung tidak valid." })),
  telepon: z
    .string({ error: "Nomor telepon pengunjung wajib diisi." })
    .transform(hapusPemisah)
    .pipe(z.string().regex(POLA_TELEPON, { error: "Nomor telepon tidak valid. Contoh: 081234567890." })),
  nik: z
    .string({ error: "NIK pengunjung wajib diisi." })
    .transform(hapusPemisah)
    .pipe(z.string().regex(POLA_NIK, { error: "NIK harus 16 digit angka." })),
});
export type DataPengunjungInput = z.output<typeof dataPengunjungSkema>;
