import { z } from "zod";

export const namaPenumpang = z
  .string({ error: "Nama penumpang wajib diisi." })
  .trim()
  .min(3, { error: "Nama penumpang minimal 3 karakter." })
  .max(100, { error: "Nama penumpang maksimal 100 karakter." });

export const pemesananSkema = z.object({
  penerbanganId: z.string({ error: "Pilih penerbangan terlebih dahulu." }).trim().min(1, { error: "Pilih penerbangan terlebih dahulu." }),
  namaPenumpang,
});
export type PemesananInput = z.output<typeof pemesananSkema>;

export const idSkema = z.string().trim().min(1, { error: "Pesanan tidak ditemukan." });
