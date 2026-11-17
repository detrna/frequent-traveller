import type { Metadata } from "next";
import { FormPreferensi } from "@/components/flight/form-preferensi";
import { HasilPenerbanganTabel } from "@/components/flight/hasil-penerbangan";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/card";
import { adaParameter, ambilSatu, type SearchParams } from "@/lib/query";
import { wajibBisa } from "@/server/auth/session";
import { cariSesuaiPreferensi, daftarBandara } from "@/server/services/penerbangan";
import { validasi } from "@/server/validation/common";
import { preferensiSkema } from "@/server/validation/penerbangan";

export const metadata: Metadata = { title: "Penerbangan Sesuai Preferensi" };

export default async function PreferensiPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
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
  const hasil = cek?.ok ? await cariSesuaiPreferensi(cek.data) : null;
  const galat = cek && !cek.ok ? cek.galat : {};

  return (
    <>
      <PageHeader title="Penerbangan Sesuai Preferensi" description="Atur tujuan, tanggal, dan jam keberangkatan yang Anda inginkan." />
      <FormPreferensi action="/member/preferensi" bandara={bandara} nilai={nilai} galat={galat} tombol="Tampilkan penerbangan" />
      <section className="mt-6" aria-live="polite">
        {hasil ? (
          <>
            <h2 className="mb-3 text-lg font-medium">{hasil.length} penerbangan sesuai preferensi</h2>
            <HasilPenerbanganTabel penerbangan={hasil} />
          </>
        ) : dikirim && Object.keys(galat).length > 0 ? (
          <Alert tone="error">Periksa kembali preferensi di atas.</Alert>
        ) : null}
      </section>
    </>
  );
}
