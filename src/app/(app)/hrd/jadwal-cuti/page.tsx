import type { Metadata } from "next";
import Link from "next/link";
import { KalenderBulan } from "@/components/cuti/kalender-bulan";
import { PilihPeriode } from "@/components/cuti/pilih-periode";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/card";
import { formatTanggalCuti, namaPeriode } from "@/lib/cuti";
import type { SearchParams } from "@/lib/query";
import { wajibBisa } from "@/server/auth/session";
import { GalatValidasi } from "@/server/errors";
import { ambilJadwalCuti } from "@/server/services/cuti";
import { bacaPeriode } from "../periode";

export const metadata: Metadata = { title: "Jadwal Cuti Pegawai" };

export default async function JadwalCutiPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await wajibBisa("cuti.lihat");
  const { nilai, tahunDari, tahunSampai } = bacaPeriode(await searchParams);

  let hasil = null;
  let galat: Record<string, string> = {};
  try {
    hasil = await ambilJadwalCuti(nilai);
  } catch (error) {
    if (!(error instanceof GalatValidasi)) throw error;
    galat = error.galat;
  }

  return (
    <>
      <PageHeader title="Jadwal Cuti Pegawai" description="Pilih periode untuk melihat siapa saja yang mengambil cuti dan berapa lama." />
      <PilihPeriode action="/hrd/jadwal-cuti" nilai={nilai} galat={galat} tahunDari={tahunDari} tahunSampai={tahunSampai} />

      <section className="mt-6 space-y-4" aria-live="polite">
        {Object.keys(galat).length > 0 ? <Alert tone="error">Periode tidak valid. Pilih tahun dan bulan terlebih dahulu.</Alert> : null}
        {hasil ? (
          <>
            <h2 className="text-lg font-medium">
              {hasil.pegawai.length} pegawai cuti pada {namaPeriode(hasil.periode)}
            </h2>
            {hasil.pegawai.length === 0 ? (
              <p className="rounded-md border border-dashed border-zinc-300 px-4 py-10 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                Tidak ada pegawai yang cuti pada periode ini.
              </p>
            ) : (
              <>
                {hasil.periode.tanggal === undefined ? <KalenderBulan tahun={hasil.periode.tahun} bulan={hasil.periode.bulan} pegawai={hasil.pegawai} /> : null}
                <div className="overflow-x-auto rounded-lg ring-1 ring-zinc-200 dark:ring-zinc-800">
                  <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
                    <caption className="sr-only">Pegawai yang cuti pada {namaPeriode(hasil.periode)}</caption>
                    <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                      <tr>
                        <th scope="col" className="px-4 py-2">Pegawai</th>
                        <th scope="col" className="px-4 py-2">Periode cuti</th>
                        <th scope="col" className="px-4 py-2 text-right">Lama cuti</th>
                        <th scope="col" className="px-4 py-2 text-right">Dalam periode ini</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
                      {hasil.pegawai.map((p) => (
                        <tr key={p.pegawai.id}>
                          <td className="px-4 py-3">
                            <Link href={`/hrd/riwayat?pegawai=${p.pegawai.id}`} className="font-medium text-sky-800 hover:underline dark:text-sky-300">{p.pegawai.nama}</Link>
                            <div className="text-xs text-zinc-500">{p.pegawai.jabatan}</div>
                          </td>
                          <td className="px-4 py-3">
                            {p.permohonan.map((m) => (
                              <div key={m.id}>{formatTanggalCuti(m.tglMulai)} – {formatTanggalCuti(m.tglSelesai)}</div>
                            ))}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {p.permohonan.map((m) => (
                              <div key={m.id}>{m.lamaHari} hari</div>
                            ))}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-medium">{p.totalHariDalamPeriode} hari</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        ) : null}
      </section>
    </>
  );
}
