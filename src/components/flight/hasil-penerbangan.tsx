import type { ReactNode } from "react";
import { formatDurasi, formatJam, formatRupiah, formatTanggal } from "@/lib/waktu";
import type { HasilPenerbangan } from "@/server/services/penerbangan";

type Baris = HasilPenerbangan & { selisihDariTermurah?: number; termurah?: boolean };

/** Tabel hasil pencarian (jadwal, maskapai, harga). `aksi` menambahkan kolom tombol, mis. "Pesan". */
export function HasilPenerbanganTabel({
  penerbangan,
  aksi,
  tampilkanSelisih = false,
  keterangan = "Hasil pencarian penerbangan",
}: {
  penerbangan: Baris[];
  aksi?: (p: HasilPenerbangan) => ReactNode;
  tampilkanSelisih?: boolean;
  keterangan?: string;
}) {
  if (penerbangan.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
        Tidak ada penerbangan yang sesuai. Coba ubah tanggal atau bandara.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg ring-1 ring-zinc-200 dark:ring-zinc-800">
      <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
        <caption className="sr-only">{keterangan}</caption>
        <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
          <tr>
            <th scope="col" className="px-4 py-2">Maskapai</th>
            <th scope="col" className="px-4 py-2">Rute</th>
            <th scope="col" className="px-4 py-2">Jadwal (WIB)</th>
            <th scope="col" className="px-4 py-2 text-right">Harga</th>
            <th scope="col" className="px-4 py-2 text-right">Kursi</th>
            {aksi ? <th scope="col" className="px-4 py-2"><span className="sr-only">Aksi</span></th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
          {penerbangan.map((p) => (
            <tr key={p.id} className={p.termurah ? "bg-emerald-50/60 dark:bg-emerald-950/20" : undefined}>
              <td className="px-4 py-3">
                <div className="font-medium">{p.maskapai.nama}</div>
                <div className="text-xs text-zinc-500">{p.kodePenerbangan}</div>
              </td>
              <td className="px-4 py-3">
                <div>
                  {p.asal.kota} <span className="text-zinc-500">({p.asal.kode})</span>
                </div>
                <div className="text-zinc-600 dark:text-zinc-400">
                  → {p.tujuan.kota} <span className="text-zinc-500">({p.tujuan.kode})</span>
                </div>
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <div>{formatTanggal(p.berangkat)}</div>
                <div className="text-zinc-600 dark:text-zinc-400">
                  {formatJam(p.berangkat)} – {formatJam(p.tiba)} · {formatDurasi(p.berangkat, p.tiba)}
                </div>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right">
                <div className="font-semibold">{formatRupiah(p.harga)}</div>
                {tampilkanSelisih ? (
                  p.termurah ? (
                    <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Termurah</div>
                  ) : (
                    <div className="text-xs text-zinc-500">+{formatRupiah(p.selisihDariTermurah ?? 0)}</div>
                  )
                ) : null}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{p.kursiTersedia}</td>
              {aksi ? <td className="px-4 py-3 text-right">{aksi(p)}</td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
