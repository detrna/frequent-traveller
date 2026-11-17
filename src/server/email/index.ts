import { buatDriverResend } from "./resend";
import { buatDriverSmtp } from "./smtp";
import type { EmailDriver } from "./types";

export type { EmailDriver, PesanEmail } from "./types";

/** Memilih pengirim berdasarkan EMAIL_DRIVER: "smtp" (default, Mailpit lokal) atau "resend" (produksi). */
export function ambilDriverEmail(env: Record<string, string | undefined> = process.env): EmailDriver {
  const pilihan = (env.EMAIL_DRIVER || "smtp").trim().toLowerCase();
  if (pilihan === "resend") return buatDriverResend(env);
  if (pilihan === "smtp") return buatDriverSmtp(env);
  throw new Error(`EMAIL_DRIVER tidak valid: "${env.EMAIL_DRIVER}". Gunakan "smtp" atau "resend".`);
}

export function alamatPengirim(env: Record<string, string | undefined> = process.env): string {
  return env.EMAIL_FROM || "APS <no-reply@aps.test>";
}
