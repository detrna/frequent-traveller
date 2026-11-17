import nodemailer from "nodemailer";
import type { EmailDriver } from "./types";

/** SMTP biasa. Lokal diarahkan ke Mailpit (localhost:1025) yang menangkap email tanpa mengirimnya ke luar. */
export function buatDriverSmtp(env: Record<string, string | undefined> = process.env): EmailDriver {
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST || "localhost",
    port: Number(env.SMTP_PORT || 1025),
    secure: false,
    ignoreTLS: !env.SMTP_USER,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD ?? "" } : undefined,
    connectionTimeout: 5_000,
    greetingTimeout: 5_000,
    socketTimeout: 10_000,
  });
  return {
    nama: "smtp",
    async kirim({ dari, kepada, subjek, teks, html }) {
      await transport.sendMail({ from: dari, to: kepada, subject: subjek, text: teks, html });
    },
  };
}
