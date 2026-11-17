/**
 * Enum domain sebagai nilai (objek) dan tipe. Nilainya HARUS sama dengan enum pada prisma/schema.prisma;
 * kesamaannya diperiksa saat kompilasi terhadap kontrak Prisma 8 di bagian bawah berkas ini.
 */
import type { Models } from "../prisma/contract.d";

export const Role = {
  HRD_MANAGER: "HRD_MANAGER",
  PENGGUNA: "PENGGUNA",
  MEMBER: "MEMBER",
  MANAGER_TRAVEL: "MANAGER_TRAVEL",
  PENGUNJUNG: "PENGUNJUNG",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

/** US7: confirmed, booked, waiting for the payment. DIBATALKAN dipakai oleh pembatalan (US2-c) dan bukan opsi filter US7. */
export const StatusBooking = {
  BOOKED: "BOOKED",
  WAITING_FOR_PAYMENT: "WAITING_FOR_PAYMENT",
  CONFIRMED: "CONFIRMED",
  DIBATALKAN: "DIBATALKAN",
} as const;
export type StatusBooking = (typeof StatusBooking)[keyof typeof StatusBooking];

export const StatusTiket = {
  TERBIT: "TERBIT",
  TERVALIDASI: "TERVALIDASI",
  DIBATALKAN: "DIBATALKAN",
} as const;
export type StatusTiket = (typeof StatusTiket)[keyof typeof StatusTiket];

export const StatusEmail = {
  TERKIRIM: "TERKIRIM",
  GAGAL: "GAGAL",
} as const;
export type StatusEmail = (typeof StatusEmail)[keyof typeof StatusEmail];

// ---- pemeriksaan kesamaan dengan kontrak (gagal kompilasi bila enum di skema berubah tanpa memperbarui berkas ini) ----
type Sama<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;
export const _enumSamaDenganKontrak: [
  Sama<Models.public_User["role"], Role>,
  Sama<Models.public_Booking["status"], StatusBooking>,
  Sama<Models.public_TiketPesawat["status"], StatusTiket>,
  Sama<Models.public_NotifikasiEmail["status"], StatusEmail>,
] = [true, true, true, true];
