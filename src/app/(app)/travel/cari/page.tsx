import type { Metadata } from "next";
import Link from "next/link";
import { BandaraSelect } from "@/components/flight/bandara-select";
import { FormCari } from "@/components/flight/form-cari";
import { HasilPenerbanganTabel } from "@/components/flight/hasil-penerbangan";
import { Alert } from "@/components/ui/alert";
import { buttonClass } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { adaParameter, ambilSatu, type SearchParams } from "@/lib/query";
import { tanggalWIB } from "@/lib/waktu";
import { wajibBisa } from "@/server/auth/session";
import { cariPenerbangan, daftarBandara, type HasilPenerbangan } from "@/server/services/penerbangan";
import { validasi } from "@/server/validation/common";
import { pencarianSkema } from "@/server/validation/penerbangan";

export const metadata: Metadata = { title: "Cari Tiket" };

function aksiPesanUntukPengunjung(p: HasilPenerbangan) {
  if (p.kursiTersedia <= 0) return <span className="text-xs font-medium text-zinc-500">Penuh</span>;
  return (
    <Link href={`/travel/pesan?penerbangan=${p.id}`} className={buttonClass("primary", "px-3 py-1.5")}>
      Pesan untuk pengunjung
    </Link>
  );
}

export default async function CariTiketPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await wajibBisa("travel.kelola");
  const sp = await searchParams;
  const bandara = await daftarBandara();

  const nilai = { asal: ambilSatu(sp, "asal"), tujuan: ambilSatu(sp, "tujuan"), tanggal: ambilSatu(sp, "tanggal") };
  const dikirim = adaParameter(sp, "tujuan", "tanggal", "asal");
  const cek = dikirim ? validasi(pencarianSkema, nilai) : null;
  const hasil = cek?.ok ? await cariPenerbangan(cek.data) : null;
  const galat = cek && !cek.ok ? cek.galat : {};

  return (
    <>
      <PageHeader title="Cari Tiket Penerbangan" description="Cari tiket ke tujuan tertentu, lalu pesankan atas nama pengunjung." />
      <FormCari action="/travel/cari" tombol="Cari tiket">
        <BandaraSelect name="asal" label="Dari (opsional)" bandara={bandara} defaultValue={nilai.asal} error={galat.asal} kosong="Semua bandara" />
        <BandaraSelect name="tujuan" label="Tujuan" bandara={bandara} defaultValue={nilai.tujuan} error={galat.tujuan} kosong="Pilih tujuan" required />
        <Field label="Tanggal (opsional)" name="tanggal" type="date" min={tanggalWIB()} defaultValue={nilai.tanggal} error={galat.tanggal} />
      </FormCari>

      <section className="mt-6" aria-live="polite">
        {hasil ? (
          <>
            <h2 className="mb-3 text-lg font-medium">{hasil.length} tiket ditemukan</h2>
            <HasilPenerbanganTabel penerbangan={hasil} aksi={aksiPesanUntukPengunjung} keterangan="Hasil pencarian tiket" />
          </>
        ) : dikirim && Object.keys(galat).length > 0 ? (
          <Alert tone="error">Periksa kembali isian pencarian di atas.</Alert>
        ) : null}
      </section>
    </>
  );
}
