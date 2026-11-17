import type { Metadata } from "next";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { SelectField } from "@/components/ui/field";
import { formatTanggalCuti } from "@/lib/cuti";
import { adaParameter, ambilSatu, type SearchParams } from "@/lib/query";
import { wajibBisa } from "@/server/auth/session";
import { GalatBisnis } from "@/server/errors";
import { ambilRiwayatCuti, daftarPegawai } from "@/server/services/cuti";

export const metadata: Metadata = { title: "Riwayat Cuti Pegawai" };

export default async function RiwayatCutiPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await wajibBisa("cuti.lihat");
  const sp = await searchParams;
  const pegawai = await daftarPegawai();
  const dipilih = ambilSatu(sp, "pegawai");

  let hasil = null;
  let pesan: string | null = null;
  if (adaParameter(sp, "pegawai")) {
    try {
      hasil = await ambilRiwayatCuti(dipilih);
    } catch (error) {
      if (!(error instanceof GalatBisnis)) throw error;
      pesan = error.message;
    }
  }

  return (
    <>
      <PageHeader title="Riwayat Cuti Pegawai" description="Pilih pegawai untuk melihat riwayat cuti dan sisa cuti tahun berjalan." />
      <form action="/hrd/riwayat" method="get" className="max-w-xl rounded-lg bg-white p-5 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
        <SelectField label="Nama pegawai" name="pegawai" defaultValue={dipilih} required>
          <option value="">Pilih pegawai</option>
          {pegawai.map((p) => (
            <option key={p.id} value={p.id}>{p.nama} — {p.jabatan}</option>
          ))}
        </SelectField>
        <div className="mt-4"><Button type="submit">Tampilkan riwayat</Button></div>
      </form>

      <section className="mt-6 space-y-4" aria-live="polite">
        {pesan ? <Alert tone="error">{pesan}</Alert> : null}
        {hasil ? (
          <>
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">{hasil.pegawai.nama}</h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{hasil.pegawai.jabatan} · NIP {hasil.pegawai.nip}</p>
                </div>
                <dl className="grid grid-cols-3 gap-6 text-center">
                  <div><dt className="text-xs uppercase text-zinc-500">Jatah {hasil.tahunBerjalan}</dt><dd className="text-xl font-semibold">{hasil.jatah} hari</dd></div>
                  <div><dt className="text-xs uppercase text-zinc-500">Terpakai</dt><dd className="text-xl font-semibold">{hasil.terpakai} hari</dd></div>
                  <div>
                    <dt className="text-xs uppercase text-zinc-500">Sisa cuti</dt>
                    <dd className={`text-xl font-semibold ${hasil.sisa < 0 ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}>{hasil.sisa} hari</dd>
                  </div>
                </dl>
              </div>
              {hasil.sisa < 0 ? <p className="mt-3 text-sm text-red-700 dark:text-red-400">Cuti yang diambil melebihi jatah tahunan.</p> : null}
            </Card>

            <h3 className="text-lg font-medium">Riwayat cuti</h3>
            {hasil.riwayat.length === 0 ? (
              <p className="rounded-md border border-dashed border-zinc-300 px-4 py-10 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">Belum ada riwayat cuti.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg ring-1 ring-zinc-200 dark:ring-zinc-800">
                <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
                  <caption className="sr-only">Riwayat cuti {hasil.pegawai.nama}</caption>
                  <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                    <tr>
                      <th scope="col" className="px-4 py-2">Tahun</th>
                      <th scope="col" className="px-4 py-2">Periode</th>
                      <th scope="col" className="px-4 py-2 text-right">Lama</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
                    {hasil.riwayat.map((r) => (
                      <tr key={r.id}>
                        <td className="px-4 py-3">{r.tahun}</td>
                        <td className="whitespace-nowrap px-4 py-3">{formatTanggalCuti(r.tglMulai)} – {formatTanggalCuti(r.tglSelesai)}</td>
                        <td className="px-4 py-3 text-right font-medium">{r.lamaHari} hari</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : null}
      </section>
    </>
  );
}
