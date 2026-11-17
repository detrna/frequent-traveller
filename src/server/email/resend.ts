import type { EmailDriver } from "./types";

/** Resend lewat REST API (tanpa SDK). Butuh RESEND_API_KEY dan EMAIL_FROM dengan domain yang terverifikasi. */
export function buatDriverResend(env: Record<string, string | undefined> = process.env, fetchFn: typeof fetch = fetch): EmailDriver {
  return {
    nama: "resend",
    async kirim({ dari, kepada, subjek, teks, html }) {
      const kunci = env.RESEND_API_KEY;
      if (!kunci) throw new Error("RESEND_API_KEY belum diisi.");
      const respons = await fetchFn("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${kunci}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: dari, to: [kepada], subject: subjek, text: teks, html }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!respons.ok) {
        const detail = await respons.text().catch(() => "");
        throw new Error(`Resend menolak pengiriman (HTTP ${respons.status}). ${detail}`.trim());
      }
    },
  };
}
