import type { Metadata } from "next";
import { BandaraSelect } from "@/components/flight/bandara-select";
import { FormCari } from "@/components/flight/form-cari";
import { aksiPesanUntuk } from "@/components/booking/tombol-pesan";
import { HasilPenerbanganTabel } from "@/components/flight/hasil-penerbangan";
import { Field } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/card";
import { adaParameter, ambilSatu, type SearchParams } from "@/lib/query";
import { tanggalWIB } from "@/lib/waktu";
import { ambilPengguna } from "@/server/auth/session";
import { cariPenerbangan, daftarBandara } from "@/server/services/penerbangan";
import { validasi } from "@/server/validation/common";
import { pencarianWajibTanggalSkema } from "@/server/validation/penerbangan";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Cari Penerbangan" };

export default async function CariPenerbanganPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const aksi = aksiPesanUntuk((await ambilPengguna())?.role);
  const sp = await searchParams;
  const bandara = await daftarBandara();

  const nilai = { asal: ambilSatu(sp, "asal"), tujuan: ambilSatu(sp, "tujuan"), tanggal: ambilSatu(sp, "tanggal") };
  const dikirim = adaParameter(sp, "tujuan", "tanggal", "asal");
  const cek = dikirim ? validasi(pencarianWajibTanggalSkema, nilai) : null;
  const hasil = cek?.ok ? await cariPenerbangan(cek.data) : null;
  const galat = cek && !cek.ok ? cek.galat : {};

  return (
    <>
      <PageHeader title="Cari Penerbangan" description="Lihat jadwal, maskapai, dan harga tiket sesuai tujuan dan tanggal." />
      <FormCari action="/jadwal">
        <BandaraSelect name="asal" label="Dari (opsional)" bandara={bandara} defaultValue={nilai.asal} error={galat.asal} kosong="Semua bandara" />
        <BandaraSelect name="tujuan" label="Tujuan" bandara={bandara} defaultValue={nilai.tujuan} error={galat.tujuan} kosong="Pilih tujuan" required />
        <Field label="Tanggal" name="tanggal" type="date" min={tanggalWIB()} defaultValue={nilai.tanggal} error={galat.tanggal} required />
      </FormCari>

      <section className="mt-6" aria-live="polite">
        {hasil ? (
          <>
            <h2 className="mb-3 text-lg font-medium">{hasil.length} penerbangan ditemukan</h2>
            <HasilPenerbanganTabel penerbangan={hasil} aksi={aksi} />
          </>
        ) : dikirim && Object.keys(galat).length > 0 ? (
          <Alert tone="error">Periksa kembali isian pencarian di atas.</Alert>
        ) : null}
      </section>
    </>
  );
}
