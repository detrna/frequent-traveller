import { z } from "zod";
import { jamOpsional, kodeBandara, tanggalOpsional, tanggalWajib } from "./common";

const asalOpsional = z
  .union([z.literal("").transform(() => undefined), kodeBandara("Kode bandara asal tidak valid.")])
  .optional();

/** US2-a, US8-a: tujuan wajib; asal & tanggal opsional. */
export const pencarianSkema = z.object({
  asal: asalOpsional,
  tujuan: kodeBandara("Pilih bandara tujuan."),
  tanggal: tanggalOpsional(),
});
export type PencarianInput = z.output<typeof pencarianSkema>;

/** US2-a (versi pengguna): tujuan dan tanggal wajib (RB04). */
export const pencarianWajibTanggalSkema = pencarianSkema.extend({
  tanggal: tanggalWajib(),
});

/** Jumlah maksimum tanggal yang dapat dipilih sekaligus pada jadwal publik. */
export const MAKS_TANGGAL_JADWAL = 14;

/** US10-a: jadwal publik. Semua filter opsional; tanpa filter = semua penerbangan yang belum berangkat. Tanggal boleh lebih dari satu. */
export const jadwalSkema = z.object({
  asal: asalOpsional,
  tujuan: z.union([z.literal("").transform(() => undefined), kodeBandara("Kode bandara tujuan tidak valid.")]).optional(),
  tanggal: z
    .array(tanggalWajib(), { error: "Tanggal tidak valid." })
    .max(MAKS_TANGGAL_JADWAL, { error: `Maksimal ${MAKS_TANGGAL_JADWAL} tanggal.` })
    .transform((v) => [...new Set(v)].sort()),
});
export type JadwalInput = z.output<typeof jadwalSkema>;

/** US3: beberapa tujuan + tanggal. */
export const multiTujuanSkema = z.object({
  asal: asalOpsional,
  tujuan: z
    .array(kodeBandara("Kode bandara tujuan tidak valid."), { error: "Pilih minimal satu tujuan." })
    .min(1, { error: "Pilih minimal satu tujuan." })
    .max(6, { error: "Maksimal 6 tujuan." })
    .transform((v) => [...new Set(v)]),
  tanggal: tanggalWajib(),
});
export type MultiTujuanInput = z.output<typeof multiTujuanSkema>;

/** US6-a/b: preferensi tujuan, tanggal, dan jam keberangkatan. */
export const preferensiSkema = z
  .object({
    asal: asalOpsional,
    tujuan: kodeBandara("Pilih bandara tujuan."),
    tanggal: tanggalWajib(),
    jamMulai: jamOpsional("Jam mulai"),
    jamSelesai: jamOpsional("Jam selesai"),
  })
  .refine((v) => v.jamMulai === undefined || v.jamSelesai === undefined || v.jamMulai <= v.jamSelesai, {
    error: "Jam mulai tidak boleh setelah jam selesai.",
    path: ["jamSelesai"],
  });
export type PreferensiInput = z.output<typeof preferensiSkema>;

/** US4: itinerary multi-destinasi — setiap ruas punya keberangkatan, tujuan, dan tanggal. */
export const ruasSkema = z
  .object({
    asal: kodeBandara("Pilih lokasi keberangkatan."),
    tujuan: kodeBandara("Pilih tujuan penerbangan."),
    tanggal: tanggalWajib(),
  })
  .refine((r) => r.asal !== r.tujuan, { error: "Keberangkatan dan tujuan tidak boleh sama.", path: ["tujuan"] });

export const multiDestinasiSkema = z.object({
  ruas: z
    .array(ruasSkema, { error: "Isi minimal dua ruas penerbangan." })
    .min(2, { error: "Multi-destinasi membutuhkan minimal dua ruas penerbangan." })
    .max(5, { error: "Maksimal 5 ruas penerbangan." }),
});
export type MultiDestinasiInput = z.output<typeof multiDestinasiSkema>;
