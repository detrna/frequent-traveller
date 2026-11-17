// Tanpa huruf/angka yang mudah tertukar (0/O, 1/I/L) agar kode mudah dibaca dan diketik manajer travel.
const ALFABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export const PANJANG_KODE_BOOKING = 6;

export function buatKodeBooking(acak: () => number = Math.random): string {
  let kode = "";
  for (let i = 0; i < PANJANG_KODE_BOOKING; i++) {
    kode += ALFABET[Math.floor(acak() * ALFABET.length)];
  }
  return kode;
}

/** Normalisasi input pengguna: hapus spasi dan ubah ke huruf besar. */
export function normalisasiKodeBooking(input: string): string {
  return input.replace(/\s+/g, "").toUpperCase();
}
