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

/** Galat validasi masukan dengan pesan per kolom, mis. { nik: "NIK harus 16 digit angka." }. */
export class GalatValidasi extends GalatBisnis {
  constructor(public readonly galat: Record<string, string>) {
    super(Object.values(galat)[0] ?? "Masukan tidak valid.", "VALIDASI");
    this.name = "GalatValidasi";
  }
}

/** Mengubah galat tak dikenal menjadi pesan umum; GalatBisnis diteruskan apa adanya. */
export function pesanUntukPengguna(error: unknown): string {
  if (error instanceof GalatBisnis) return error.message;
  console.error(error);
  return "Terjadi kesalahan pada sistem. Silakan coba lagi.";
}
