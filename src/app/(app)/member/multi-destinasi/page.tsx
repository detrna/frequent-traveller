import type { Metadata } from "next";
import { aksiPesan } from "@/components/booking/tombol-pesan";
import { HasilPenerbanganTabel } from "@/components/flight/hasil-penerbangan";
import { Alert } from "@/components/ui/alert";
import { Card, PageHeader } from "@/components/ui/card";
import { adaParameter, ambilBanyak, type SearchParams } from "@/lib/query";
import { formatRupiah, formatTanggal, awalHariWIB, tanggalWIB } from "@/lib/waktu";
import { wajibBisa } from "@/server/auth/session";
import { cariMultiDestinasi, daftarBandara } from "@/server/services/penerbangan";
import { validasi } from "@/server/validation/common";
import { multiDestinasiSkema } from "@/server/validation/penerbangan";
import { RuasForm, type RuasNilai } from "./ruas-form";

export const metadata: Metadata = { title: "Penerbangan Multi-Destinasi" };

export default async function MultiDestinasiPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await wajibBisa("member.fitur");
  const sp = await searchParams;
  const bandara = await daftarBandara();

  const asal = ambilBanyak(sp, "asal");
  const tujuan = ambilBanyak(sp, "tujuan");
  const tanggal = ambilBanyak(sp, "tanggal");
  const jumlah = Math.max(asal.length, tujuan.length, tanggal.length);
  const ruasDiisi: RuasNilai[] = Array.from({ length: jumlah }, (_, i) => ({ asal: asal[i] ?? "", tujuan: tujuan[i] ?? "", tanggal: tanggal[i] ?? "" }));

  const dikirim = adaParameter(sp, "cari");
  const cek = dikirim ? validasi(multiDestinasiSkema, { ruas: ruasDiisi }) : null;
  const hasil = cek?.ok ? await cariMultiDestinasi(cek.data) : null;
  const galat = cek && !cek.ok ? cek.galat : {};

  return (
    <>
      <PageHeader title="Penerbangan Multi-Destinasi" description="Susun perjalanan beberapa kota, lalu bandingkan total harga dan jumlah penerbangannya." />
      {/* key memaksa form dibuat ulang agar nilai awal mengikuti query terbaru */}
      <RuasForm key={JSON.stringify(ruasDiisi)} bandara={bandara} awal={ruasDiisi} galat={galat} hariIni={tanggalWIB()} />

      <section className="mt-6 space-y-6" aria-live="polite">
        {hasil ? (
          <>
            <dl className="grid gap-4 sm:grid-cols-3">
              <Card>
                <dt className="text-xs uppercase text-zinc-500">Total harga termurah</dt>
                <dd className="mt-1 text-xl font-semibold text-emerald-700 dark:text-emerald-400">{formatRupiah(hasil.totalHargaTermurah)}</dd>
              </Card>
              <Card>
                <dt className="text-xs uppercase text-zinc-500">Jumlah penerbangan</dt>
                <dd className="mt-1 text-xl font-semibold">{hasil.jumlahPenerbangan} dari {hasil.ruas.length} ruas</dd>
              </Card>
              <Card>
                <dt className="text-xs uppercase text-zinc-500">Pilihan tersedia</dt>
                <dd className="mt-1 text-xl font-semibold">{hasil.jumlahPilihan} penerbangan</dd>
              </Card>
            </dl>
            {!hasil.lengkap ? <Alert tone="info">Ada ruas tanpa penerbangan pada tanggal tersebut, sehingga total harga belum mencakup seluruh perjalanan.</Alert> : null}
            {hasil.ruas.map((r, i) => (
              <div key={`${i}-${r.asal}-${r.tujuan}`}>
                <h2 className="mb-3 text-lg font-medium">
                  {i + 1}. {r.asal} → {r.tujuan} · {formatTanggal(awalHariWIB(r.tanggal))}
                  <span className="ml-2 text-sm font-normal text-zinc-500">({r.penerbangan.length} pilihan)</span>
                </h2>
                <HasilPenerbanganTabel penerbangan={r.penerbangan} keterangan={`Penerbangan ${r.asal} ke ${r.tujuan}`} aksi={aksiPesan} />
              </div>
            ))}
          </>
        ) : null}
      </section>
    </>
  );
}
