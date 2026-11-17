import { z } from "zod";

const angka = (pesan: string) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.coerce.number({ error: pesan }).int({ error: pesan }),
  );

const hariDalamBulan = (tahun: number, bulan: number) => new Date(Date.UTC(tahun, bulan, 0)).getUTCDate();

/** Periode yang dipilih HRD Manager: tahun dan bulan wajib, tanggal opsional (US1-a, RB01). */
export const periodeSkema = z
  .object({
    tahun: angka("Tahun wajib dipilih.").pipe(z.number().min(2000, { error: "Tahun tidak valid." }).max(2100, { error: "Tahun tidak valid." })),
    bulan: angka("Bulan wajib dipilih.").pipe(z.number().min(1, { error: "Bulan tidak valid." }).max(12, { error: "Bulan tidak valid." })),
    tanggal: z.preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
      z
        .coerce.number({ error: "Tanggal tidak valid." })
        .int({ error: "Tanggal tidak valid." })
        .min(1, { error: "Tanggal tidak valid." })
        .max(31, { error: "Tanggal tidak valid." })
        .optional(),
    ),
  })
  .superRefine((p, ctx) => {
    if (p.tanggal !== undefined && p.tanggal > hariDalamBulan(p.tahun, p.bulan)) {
      ctx.addIssue({ code: "custom", path: ["tanggal"], message: "Tanggal tidak ada pada bulan yang dipilih." });
    }
  });

export type PeriodeInput = z.output<typeof periodeSkema>;

export const idPegawaiSkema = z.string({ error: "Pilih pegawai terlebih dahulu." }).trim().min(1, { error: "Pilih pegawai terlebih dahulu." });
