import type { Metadata } from "next";
import { FormPreferensi } from "@/components/flight/form-preferensi";
import { HasilPenerbanganTabel } from "@/components/flight/hasil-penerbangan";
import { Alert } from "@/components/ui/alert";
import { Card, PageHeader } from "@/components/ui/card";
import { adaParameter, ambilSatu, type SearchParams } from "@/lib/query";
import { formatRupiah } from "@/lib/waktu";
import { wajibBisa } from "@/server/auth/session";
import { bandingkanHarga, daftarBandara } from "@/server/services/penerbangan";
import { validasi } from "@/server/validation/common";
import { preferensiSkema } from "@/server/validation/penerbangan";

export const metadata: Metadata = { title: "Bandingkan Harga Tiket" };

export default async function BandingkanPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await wajibBisa("member.fitur");
  const sp = await searchParams;
  const bandara = await daftarBandara();

  const nilai = {
    asal: ambilSatu(sp, "asal"),
    tujuan: ambilSatu(sp, "tujuan"),
    tanggal: ambilSatu(sp, "tanggal"),
    jamMulai: ambilSatu(sp, "jamMulai"),
    jamSelesai: ambilSatu(sp, "jamSelesai"),
  };
  const dikirim = adaParameter(sp, "tujuan", "tanggal");
  const cek = dikirim ? validasi(preferensiSkema, nilai) : null;
  const perbandingan = cek?.ok ? await bandingkanHarga(cek.data) : null;
  const galat = cek && !cek.ok ? cek.galat : {};

  return (
    <>
      <PageHeader title="Bandingkan Harga Tiket" description="Penerbangan diurutkan dari harga termurah sesuai preferensi Anda." />
      <FormPreferensi action="/member/bandingkan" bandara={bandara} nilai={nilai} galat={galat} tombol="Bandingkan harga" />
      <section className="mt-6" aria-live="polite">
        {cek?.ok && !perbandingan ? (
          <HasilPenerbanganTabel penerbangan={[]} />
        ) : perbandingan ? (
          <div className="space-y-4">
            <dl className="grid gap-4 sm:grid-cols-3">
              <Card><dt className="text-xs uppercase text-zinc-500">Termurah</dt><dd className="mt-1 text-xl font-semibold text-emerald-700 dark:text-emerald-400">{formatRupiah(perbandingan.termurah)}</dd></Card>
              <Card><dt className="text-xs uppercase text-zinc-500">Rata-rata</dt><dd className="mt-1 text-xl font-semibold">{formatRupiah(perbandingan.rataRata)}</dd></Card>
              <Card><dt className="text-xs uppercase text-zinc-500">Termahal</dt><dd className="mt-1 text-xl font-semibold">{formatRupiah(perbandingan.termahal)}</dd></Card>
            </dl>
            <HasilPenerbanganTabel penerbangan={perbandingan.penerbangan} tampilkanSelisih keterangan="Perbandingan harga tiket" />
          </div>
        ) : dikirim && Object.keys(galat).length > 0 ? (
          <Alert tone="error">Periksa kembali preferensi di atas.</Alert>
        ) : null}
      </section>
    </>
  );
}
