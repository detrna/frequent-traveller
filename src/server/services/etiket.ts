/**
 * E-tiket (RB18 / SQ18): "Mengirim E-Tiket" meminta "Membuat E-Tiket", mengambil email terdaftar dari Data Pengunjung,
 * lalu mengirim lewat Email E-Tiket. Pengiriman yang gagal dicatat (NotifikasiEmail GAGAL) agar dapat dikirim ulang.
 */
import type { ResultType } from "@prisma/orm-postgres/components/runtime";
import { db } from "@/server/db";
import { GalatBisnis } from "@/server/errors";
import { alamatPengirim, ambilDriverEmail, type EmailDriver, type PesanEmail } from "@/server/email";
import { wajib } from "@/lib/wajib";
import { formatDurasi, formatJam, formatRupiah, formatTanggal } from "@/lib/waktu";

/** Booking beserta data pengunjung dan tiket (dengan penerbangan, maskapai, asal, tujuan). */
function kueriEtiket() {
  return db.orm.public.Booking.include("pengunjung").include("tiket", (t) =>
    t.orderBy((x) => x.createdAt.asc()).include("penerbangan", (p) => p.include("maskapai").include("asal").include("tujuan")),
  );
}

type BookingEtiket = ResultType<ReturnType<typeof kueriEtiket>>;
type TiketEtiket = BookingEtiket["tiket"][number];

const ESC: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c]);

/** "Membuat E-Tiket": isi email (teks + HTML) untuk satu tiket. Murni. */
export function buatEtiket(booking: Pick<BookingEtiket, "kodeBookingReference">, tiket: TiketEtiket): Omit<PesanEmail, "dari" | "kepada"> {
  const p = wajib(tiket.penerbangan, "penerbangan pada tiket");
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
  const teks = [`E-tiket Frequent Traveller`, "", ...baris.map(([k, v]) => `${k}: ${v}`), "", "Tunjukkan kode booking ini saat check-in. Terima kasih telah memesan melalui Frequent Traveller."].join("\n");
  const html = `<!doctype html><html lang="id"><body style="font-family:system-ui,sans-serif;color:#171717">
<h1 style="font-size:20px">E-tiket Frequent Traveller</h1>
<table role="presentation" cellpadding="6" style="border-collapse:collapse">
${baris.map(([k, v]) => `<tr><th align="left" style="color:#52525b;font-weight:500">${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`).join("\n")}
</table>
<p>Tunjukkan kode booking ini saat check-in. Terima kasih telah memesan melalui Frequent Traveller.</p>
</body></html>`;
  return { subjek: `E-tiket Frequent Traveller ${tiket.nomorTiket}`, teks, html };
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
  const booking = await kueriEtiket().where({ id: bookingId }).first();
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
    const riwayat = await db.orm.public.NotifikasiEmail.where({ tiketId: tiket.id })
      .orderBy((n) => n.createdAt.desc())
      .all();
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

    const status = error ? ("GAGAL" as const) : ("TERKIRIM" as const);
    const data = { kepada: kepada ?? "", subjek: pesan.subjek, status, error: error ?? null, terkirimAt: error ? null : new Date() };
    if (gagalSebelumnya) {
      // pengiriman satu booking berjalan berurutan, jadi baca-lalu-tulis jumlah percobaan di sini aman
      await db.orm.public.NotifikasiEmail.where({ id: gagalSebelumnya.id }).update({ ...data, percobaan: gagalSebelumnya.percobaan + 1 });
    } else {
      await db.orm.public.NotifikasiEmail.create({ tiketId: tiket.id, ...data, percobaan: 1 });
    }

    hasil.rincian.push({ tiketId: tiket.id, nomorTiket: tiket.nomorTiket, kepada, status, error });
    if (error) hasil.gagal++;
    else hasil.terkirim++;
  }
  return hasil;
}

/** Status pengiriman e-tiket per tiket pada sebuah booking (untuk ditampilkan ke Manager Travel). */
export async function ambilStatusEtiket(bookingId: string) {
  const tiket = await db.orm.public.TiketPesawat.where({ bookingId }).select("id", "nomorTiket").all();
  if (tiket.length === 0) return [];
  const nomor = new Map(tiket.map((t) => [t.id, t.nomorTiket]));
  const notifikasi = await db.orm.public.NotifikasiEmail.where((n) => n.tiketId.in([...nomor.keys()]))
    .orderBy((n) => n.createdAt.asc())
    .all();
  return notifikasi.map((n) => ({ ...n, tiket: { nomorTiket: nomor.get(n.tiketId)! } }));
}
