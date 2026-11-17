import Link from "next/link";
import { bulanTampil, judulBulan, NAMA_HARI_SINGKAT, selBulan } from "@/lib/kalender";
import { awalHariWIB, formatTanggal, tanggalWIB } from "@/lib/waktu";

/**
 * Kalender pilih-banyak-tanggal. Murni server component: tiap hari adalah checkbox bernama `name` (CSS `peer`),
 * jadi tetap berfungsi tanpa JavaScript dan hasilnya masuk ke URL (?tanggal=…&tanggal=…).
 */
export function KalenderTanggal({
  name = "tanggal",
  legend,
  terpilih,
  maks,
  error,
  aturUlang,
}: {
  name?: string;
  legend: string;
  terpilih: string[];
  maks: number;
  error?: string;
  /** Tautan "Atur ulang" (menghapus semua pilihan). */
  aturUlang?: string;
}) {
  const hariIni = tanggalWIB();
  const bulan = bulanTampil(hariIni, terpilih);

  return (
    <fieldset className="sm:col-span-2 lg:col-span-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <legend className="text-sm font-medium">
          {legend} <span className="font-normal text-zinc-500">(pilih satu atau lebih, maksimal {maks})</span>
        </legend>
        {aturUlang ? (
          <Link href={aturUlang} className="text-xs text-sky-700 hover:underline dark:text-sky-400">
            Atur ulang
          </Link>
        ) : null}
      </div>

      <div className="mt-3 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {bulan.map((b) => (
          <div key={`${b.tahun}-${b.bulan}`}>
            <p className="mb-2 text-sm font-semibold">{judulBulan(b)}</p>
            <div className="grid grid-cols-7 gap-1 text-center">
              {NAMA_HARI_SINGKAT.map((h) => (
                <span key={h} aria-hidden className="pb-1 text-xs text-zinc-500">
                  {h}
                </span>
              ))}
              {selBulan(b).map((t, i) =>
                t === null ? (
                  <span key={`kosong-${i}`} />
                ) : (
                  <span key={t} className="relative">
                    <input
                      type="checkbox"
                      name={name}
                      value={t}
                      defaultChecked={terpilih.includes(t)}
                      disabled={t < hariIni}
                      aria-label={formatTanggal(awalHariWIB(t))}
                      className="peer absolute inset-0 z-10 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                    />
                    <span
                      aria-hidden
                      className={`flex h-9 items-center justify-center rounded-md text-sm transition-colors hover:bg-sky-50 peer-checked:bg-sky-700 peer-checked:font-medium peer-checked:text-white peer-checked:hover:bg-sky-800 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sky-700 peer-disabled:text-zinc-500 peer-disabled:line-through peer-disabled:hover:bg-transparent dark:hover:bg-zinc-800 dark:peer-disabled:text-zinc-400 dark:peer-disabled:hover:bg-transparent ${t === hariIni ? "ring-1 ring-inset ring-sky-700" : ""}`}
                    >
                      {Number(t.slice(8))}
                    </span>
                  </span>
                ),
              )}
            </div>
          </div>
        ))}
      </div>

      {error ? (
        <p className="mt-2 text-xs text-red-700 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
