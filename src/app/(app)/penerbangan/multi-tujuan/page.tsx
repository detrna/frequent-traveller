import type { Metadata } from "next";
import { FormCari } from "@/components/flight/form-cari";
import { BandaraSelect } from "@/components/flight/bandara-select";
import { HasilPenerbanganTabel } from "@/components/flight/hasil-penerbangan";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { adaParameter, ambilBanyak, ambilSatu, type SearchParams } from "@/lib/query";
import { tanggalWIB } from "@/lib/waktu";
import { wajibBisa } from "@/server/auth/session";
import { cariBeberapaTujuan, daftarBandara } from "@/server/services/penerbangan";
import { validasi } from "@/server/validation/common";
import { multiTujuanSkema } from "@/server/validation/penerbangan";

export const metadata: Metadata = { title: "Cari Beberapa Tujuan" };

export default async function MultiTujuanPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await wajibBisa("penerbangan.cari");
  const sp = await searchParams;
  const bandara = await daftarBandara();

  const terpilih = ambilBanyak(sp, "tujuan");
  const nilai = { asal: ambilSatu(sp, "asal"), tanggal: ambilSatu(sp, "tanggal") };
  const dikirim = adaParameter(sp, "tujuan", "tanggal", "asal", "cari");
  const cek = dikirim ? validasi(multiTujuanSkema, { ...nilai, tujuan: terpilih }) : null;
  const hasil = cek?.ok ? await cariBeberapaTujuan(cek.data) : null;
  const galat = cek && !cek.ok ? cek.galat : {};
  const namaKota = new Map(bandara.map((b) => [b.kode, b.kota]));

  return (
    <>
      <PageHeader title="Cari Beberapa Tujuan" description="Bandingkan penerbangan ke beberapa kota tujuan sekaligus pada tanggal yang sama." />
      <FormCari action="/penerbangan/multi-tujuan" tombol="Cari semua tujuan">
        <input type="hidden" name="cari" value="1" />
        <BandaraSelect name="asal" label="Dari (opsional)" bandara={bandara} defaultValue={nilai.asal} error={galat.asal} kosong="Semua bandara" />
        <Field label="Tanggal" name="tanggal" type="date" min={tanggalWIB()} defaultValue={nilai.tanggal} error={galat.tanggal} required />
        <fieldset className="sm:col-span-2 lg:col-span-2">
          <legend className="text-sm font-medium">Tujuan (pilih satu atau lebih)</legend>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
            {bandara.map((b) => (
              <label key={b.kode} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="tujuan" value={b.kode} defaultChecked={terpilih.includes(b.kode)} className="size-4 rounded border-zinc-300 text-sky-700 focus:ring-sky-700" />
                {b.kota} <span className="text-zinc-500">({b.kode})</span>
              </label>
            ))}
          </div>
          {galat.tujuan ? <p className="mt-1 text-xs text-red-700 dark:text-red-400" role="alert">{galat.tujuan}</p> : null}
        </fieldset>
      </FormCari>

      <section className="mt-6 space-y-8" aria-live="polite">
        {hasil
          ? hasil.map((kelompok) => (
              <div key={kelompok.tujuan}>
                <h2 className="mb-3 text-lg font-medium">
                  {namaKota.get(kelompok.tujuan) ?? kelompok.tujuan} ({kelompok.tujuan}) · {kelompok.penerbangan.length} penerbangan
                </h2>
                <HasilPenerbanganTabel penerbangan={kelompok.penerbangan} keterangan={`Penerbangan ke ${kelompok.tujuan}`} />
              </div>
            ))
          : dikirim && Object.keys(galat).length > 0
            ? <Alert tone="error">Periksa kembali isian pencarian di atas.</Alert>
            : null}
      </section>
    </>
  );
}
