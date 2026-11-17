export interface PesanEmail {
  dari: string;
  kepada: string;
  subjek: string;
  teks: string;
  html: string;
}

/** Antarmuka pengirim email: boundary "Email E-Tiket" pada RB18. Implementasi: smtp (Mailpit), resend. */
export interface EmailDriver {
  readonly nama: string;
  kirim(pesan: PesanEmail): Promise<void>;
}
