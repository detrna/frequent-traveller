import type { StatusBooking, StatusTiket } from "@/lib/enums";

/** Label status sesuai istilah user stories (US7): confirmed, booked, waiting for the payment. */
export const LABEL_STATUS_BOOKING: Record<StatusBooking, string> = {
  BOOKED: "booked",
  WAITING_FOR_PAYMENT: "waiting for the payment",
  CONFIRMED: "confirmed",
  DIBATALKAN: "dibatalkan",
};

export const LABEL_STATUS_TIKET: Record<StatusTiket, string> = {
  TERBIT: "Terbit",
  TERVALIDASI: "Tervalidasi",
  DIBATALKAN: "Dibatalkan",
};

/** Status yang dapat dipilih sebagai filter pada US7 (DIBATALKAN bukan opsi filter). */
export const STATUS_FILTER: readonly StatusBooking[] = ["CONFIRMED", "BOOKED", "WAITING_FOR_PAYMENT"];

/** Nilai parameter query `?status=` untuk filter US7 → status booking. */
export const PARAM_STATUS: Record<string, StatusBooking> = {
  confirmed: "CONFIRMED",
  booked: "BOOKED",
  waiting_for_payment: "WAITING_FOR_PAYMENT",
};

export const PARAM_DARI_STATUS: Partial<Record<StatusBooking, string>> = {
  CONFIRMED: "confirmed",
  BOOKED: "booked",
  WAITING_FOR_PAYMENT: "waiting_for_payment",
};
