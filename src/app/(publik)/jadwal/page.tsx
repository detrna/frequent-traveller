import type { Metadata } from "next";
import Link from "next/link";
import { BandaraSelect } from "@/components/flight/bandara-select";
import { KalenderTanggal } from "@/components/flight/kalender-tanggal";
import { FormCari } from "@/components/flight/form-cari";
import { aksiPesanUntuk } from "@/components/booking/tombol-pesan";
import { HasilPenerbanganTabel } from "@/components/flight/hasil-penerbangan";
import { Alert } from "@/components/ui/alert";
import { buttonClass } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/card";
import { ambilBanyak, ambilSatu, type SearchParams } from "@/lib/query";
import { ambilPengguna } from "@/server/auth/session";
import { daftarBandara, jelajahiJadwal } from "@/server/services/penerbangan";
import { validasi } from "@/server/validation/common";
import { halamanSkema } from "@/server/validation/travel";
import { jadwalSkema, MAKS_TANGGAL_JADWAL } from "@/server/validation/penerbangan";

export const metadata: Metadata = { title: "Jadwal Penerbangan" };

export default async function JadwalPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const aksi = aksiPesanUntuk((await ambilPengguna())?.role);
  const sp = await searchParams;
  const bandara = await daftarBandara();

  const terpilih = ambilBanyak(sp, "tanggal").filter(Boolean);
  const nilai = { asal: ambilSatu(sp, "asal"), tujuan: ambilSatu(sp, "tujuan") };
  const cek = validasi(jadwalSkema, { ...nilai, tanggal: terpilih });
  const halamanMinta = validasi(halamanSkema, ambilSatu(sp, "halaman"));
  const hasil = cek.ok ? await jelajahiJadwal(cek.data, halamanMinta.ok ? halamanMinta.data : 1) : null;
  const galat = cek.ok ? {} : cek.galat;
  const adaGalat = Object.keys(galat).length > 0;

  const hrefHalaman = (halaman: number) => {
    const q = new URLSearchParams();
    if (nilai.asal) q.set("asal", nilai.asal);
    if (nilai.tujuan) q.set("tujuan", nilai.tujuan);
    for (const t of terpilih) q.append("tanggal", t);
    if (halaman > 1) q.set("halaman", String(halaman));
    const s = q.toString();
    return `/jadwal${s ? `?${s}` : ""}`;
  };
  const difilter = Boolean(nilai.asal || nilai.tujuan || terpilih.length);

  return (
    <>
      <PageHeader title="Jadwal Penerbangan" description="Semua penerbangan yang akan berangkat. Persempit menurut bandara dan tanggal (boleh lebih dari satu)." />
      <FormCari action="/jadwal" tombol="Terapkan filter">
        <BandaraSelect name="asal" label="Dari" bandara={bandara} defaultValue={nilai.asal} error={galat.asal} kosong="Semua bandara" />
        <BandaraSelect name="tujuan" label="Tujuan" bandara={bandara} defaultValue={nilai.tujuan} error={galat.tujuan} kosong="Semua tujuan" />
        <KalenderTanggal
          legend="Tanggal"
          terpilih={terpilih}
          maks={MAKS_TANGGAL_JADWAL}
          error={galat.tanggal ?? galat[Object.keys(galat).find((k) => k.startsWith("tanggal.")) ?? ""]}
          aturUlang="/jadwal"
        />
      </FormCari>

      <section className="mt-6" aria-live="polite">
        {hasil ? (
          <>
            <h2 className="mb-3 text-lg font-medium">
              {hasil.total} penerbangan {difilter ? "ditemukan" : "tersedia"}
              {hasil.totalHalaman > 1 ? <span className="ml-2 text-sm font-normal text-zinc-500">Halaman {hasil.halaman} dari {hasil.totalHalaman}</span> : null}
            </h2>
            <HasilPenerbanganTabel penerbangan={hasil.penerbangan} aksi={aksi} />
            {hasil.totalHalaman > 1 ? (
              <nav aria-label="Halaman hasil" className="mt-4 flex items-center justify-between">
                {hasil.halaman > 1 ? (
                  <Link href={hrefHalaman(hasil.halaman - 1)} className={buttonClass("secondary")}>Sebelumnya</Link>
                ) : <span />}
                {hasil.halaman < hasil.totalHalaman ? (
                  <Link href={hrefHalaman(hasil.halaman + 1)} className={buttonClass("secondary")}>Berikutnya</Link>
                ) : null}
              </nav>
            ) : null}
          </>
        ) : adaGalat ? (
          <Alert tone="error">Periksa kembali isian filter di atas.</Alert>
        ) : null}
      </section>
    </>
  );
}
