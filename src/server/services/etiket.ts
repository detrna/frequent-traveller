/**
 * E-tiket (RB18 / SQ18): "Mengirim E-Tiket" meminta "Membuat E-Tiket", mengambil email terdaftar dari Data Pengunjung,
 * lalu mengirim lewat Email E-Tiket. Pengiriman yang gagal dicatat (NotifikasiEmail GAGAL) agar dapat dikirim ulang.
 */
import { db } from "@/server/db";
import { GalatBisnis } from "@/server/errors";
import { alamatPengirim, ambilDriverEmail, type EmailDriver, type PesanEmail } from "@/server/email";
import { formatDurasi, formatJam, formatRupiah, formatTanggal } from "@/lib/waktu";
import type { Prisma } from "@/generated/prisma/client";

const INCLUDE_ETIKET = {
  pengunjung: true,
  tiket: { include: { penerbangan: { include: { maskapai: true, asal: true, tujuan: true } } }, orderBy: { createdAt: "asc" } },
} satisfies Prisma.BookingInclude;

type BookingEtiket = Prisma.BookingGetPayload<{ include: typeof INCLUDE_ETIKET }>;
type TiketEtiket = BookingEtiket["tiket"][number];

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c]);

/** "Membuat E-Tiket": isi email (teks + HTML) untuk satu tiket. Murni. */
export function buatEtiket(booking: Pick<BookingEtiket, "kodeBookingReference">, tiket: TiketEtiket): Omit<PesanEmail, "dari" | "kepada"> {
  const p = tiket.penerbangan;
  const baris: Array<[string, string]> = [
    ["Kode booking", booking.kodeBookingReference],
    ["Nomor tiket", tiket.nomorTiket],
    ["Penumpang", tiket.namaPenumpang],
    ["Maskapai", `${p.maskapai.nama} ${p.kodePenerbangan}`],
    ["Rute", `${p.asal.kota} (${p.asal.kode}) → ${p.tujuan.kota} (${p.tujuan.kode})`],
    ["Tanggal", formatTanggal(p.berangkat)],
    ["Berangkat – tiba", `${formatJam(p.berangkat)} – ${formatJam(p.tiba)} WIB (${formatDurasi(p.berangkat, p.tiba)})`],
    ["Harga", formatRupiah(p.harga)],
  ];
  const teks = [`E-tiket APS`, "", ...baris.map(([k, v]) => `${k}: ${v}`), "", "Tunjukkan kode booking ini saat check-in. Terima kasih telah memesan melalui APS."].join("\n");
  const html = `<!doctype html><html lang="id"><body style="font-family:system-ui,sans-serif;color:#171717">
<h1 style="font-size:20px">E-tiket APS</h1>
<table role="presentation" cellpadding="6" style="border-collapse:collapse">
${baris.map(([k, v]) => `<tr><th align="left" style="color:#52525b;font-weight:500">${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`).join("\n")}
</table>
<p>Tunjukkan kode booking ini saat check-in. Terima kasih telah memesan melalui APS.</p>
</body></html>`;
  return { subjek: `E-tiket APS ${tiket.nomorTiket}`, teks, html };
}

export interface RincianKirim {
  tiketId: string;
  nomorTiket: string;
  kepada: string | null;
  status: "TERKIRIM" | "GAGAL";
  error?: string;
}

export interface HasilKirimEtiket {
  terkirim: number;
  gagal: number;
  dilewati: number;
  rincian: RincianKirim[];
}

function pesanGalat(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).slice(0, 300);
}

/**
 * Mengirim e-tiket untuk setiap tiket aktif yang belum berhasil terkirim. Aman dipanggil berulang (kirim ulang):
 * tiket yang sudah TERKIRIM dilewati. Kegagalan tidak dilempar — dicatat dan dilaporkan di hasil.
 */
export async function kirimEtiket(bookingId: string, driver?: EmailDriver): Promise<HasilKirimEtiket> {
  const booking = await db.booking.findUnique({ where: { id: bookingId }, include: INCLUDE_ETIKET });
  if (!booking) throw new GalatBisnis("Pesanan tidak ditemukan.", "TIDAK_DITEMUKAN");
  if (!booking.pengunjung) throw new GalatBisnis("E-tiket hanya dikirim untuk pesanan atas nama pengunjung.", "BUKAN_PENGUNJUNG");

  const hasil: HasilKirimEtiket = { terkirim: 0, gagal: 0, dilewati: 0, rincian: [] };
  const kepada = booking.pengunjung.email?.trim() || null; // "email terdaftar" dari Data Pengunjung

  let pengirim: EmailDriver | null = null;
  let galatDriver: string | null = null;
  try {
    pengirim = driver ?? ambilDriverEmail();
  } catch (error) {
    galatDriver = pesanGalat(error);
  }

  for (const tiket of booking.tiket) {
    if (tiket.status === "DIBATALKAN") {
      hasil.dilewati++;
      continue;
    }
    const riwayat = await db.notifikasiEmail.findMany({ where: { tiketId: tiket.id }, orderBy: { createdAt: "desc" } });
    if (riwayat.some((r) => r.status === "TERKIRIM")) {
      hasil.dilewati++;
      continue;
    }
    const gagalSebelumnya = riwayat.find((r) => r.status === "GAGAL");

    const pesan = buatEtiket(booking, tiket);
    let error: string | undefined;
    if (!kepada) error = "Email terdaftar pengunjung tidak tersedia.";
    else if (!pengirim) error = galatDriver ?? "Pengirim email tidak tersedia.";
    else {
      try {
        await pengirim.kirim({ dari: alamatPengirim(), kepada, ...pesan });
      } catch (e) {
        error = pesanGalat(e);
      }
    }

    const status = error ? "GAGAL" : "TERKIRIM";
    const data = { kepada: kepada ?? "", subjek: pesan.subjek, status, error: error ?? null, terkirimAt: error ? null : new Date() } as const;
    if (gagalSebelumnya) {
      await db.notifikasiEmail.update({ where: { id: gagalSebelumnya.id }, data: { ...data, percobaan: { increment: 1 } } });
    } else {
      await db.notifikasiEmail.create({ data: { tiketId: tiket.id, ...data } });
    }

    hasil.rincian.push({ tiketId: tiket.id, nomorTiket: tiket.nomorTiket, kepada, status, error });
    if (error) hasil.gagal++;
    else hasil.terkirim++;
  }
  return hasil;
}

/** Status pengiriman e-tiket per tiket pada sebuah booking (untuk ditampilkan ke Manager Travel). */
export async function ambilStatusEtiket(bookingId: string) {
  return db.notifikasiEmail.findMany({
    where: { tiket: { bookingId } },
    include: { tiket: { select: { nomorTiket: true } } },
    orderBy: { createdAt: "asc" },
  });
}
