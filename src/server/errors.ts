/** Galat yang aman ditampilkan ke pengguna (pesan sudah berbahasa Indonesia). Galat lain dianggap bug. */
export class GalatBisnis extends Error {
  constructor(
    message: string,
    public readonly kode: string = "GALAT_BISNIS",
  ) {
    super(message);
    this.name = "GalatBisnis";
  }
}

/** Mengubah galat tak dikenal menjadi pesan umum; GalatBisnis diteruskan apa adanya. */
export function pesanUntukPengguna(error: unknown): string {
  if (error instanceof GalatBisnis) return error.message;
  console.error(error);
  return "Terjadi kesalahan pada sistem. Silakan coba lagi.";
}
