"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";

interface Bandara {
  kode: string;
  kota: string;
  nama: string;
}
export interface RuasNilai {
  asal: string;
  tujuan: string;
  tanggal: string;
}

const MIN_RUAS = 2;
const MAKS_RUAS = 5;

export function RuasForm({
  bandara,
  awal,
  galat,
  hariIni,
}: {
  bandara: Bandara[];
  awal: RuasNilai[];
  /** Galat per kunci "ruas.<indeks>.<field>" atau "ruas". */
  galat: Record<string, string>;
  hariIni: string;
}) {
  const [ruas, setRuas] = useState(() => {
    const dasar: Partial<RuasNilai>[] = awal.length >= MIN_RUAS ? awal : [...awal, ...Array(MIN_RUAS - awal.length).fill({})];
    return dasar.map((r, id) => ({ id, asal: "", tujuan: "", tanggal: "", ...r }));
  });
  // id baris unik dan stabil: selalu satu di atas id terbesar yang pernah dipakai
  const [idBerikut, setIdBerikut] = useState(ruas.length);
  const tambah = () => {
    setRuas((d) => [...d, { id: idBerikut, asal: "", tujuan: "", tanggal: "" }]);
    setIdBerikut((n) => n + 1);
  };

  const ubah = (id: number, field: keyof RuasNilai, nilai: string) =>
    setRuas((daftar) => daftar.map((r) => (r.id === id ? { ...r, [field]: nilai } : r)));

  return (
    <form action="/member/multi-destinasi" method="get" className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
      <input type="hidden" name="cari" value="1" />
      <ol className="space-y-4">
        {ruas.map((r, i) => (
          <li key={r.id} className="rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium">Penerbangan {i + 1}</h3>
              {ruas.length > MIN_RUAS ? (
                <Button variant="secondary" onClick={() => setRuas((d) => d.filter((x) => x.id !== r.id))} aria-label={`Hapus penerbangan ${i + 1}`}>
                  Hapus
                </Button>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {(["asal", "tujuan"] as const).map((field) => {
                const id = `ruas-${r.id}-${field}`;
                const pesan = galat[`ruas.${i}.${field}`];
                return (
                  <div key={field}>
                    <label htmlFor={id} className="block text-sm font-medium">
                      {field === "asal" ? "Lokasi keberangkatan" : "Tujuan"}
                    </label>
                    <select id={id} name={field} value={r[field]} onChange={(e) => ubah(r.id, field, e.target.value)} required aria-invalid={pesan ? true : undefined} aria-describedby={pesan ? `${id}-err` : undefined} className={inputClass}>
                      <option value="">Pilih bandara</option>
                      {bandara.map((b) => (
                        <option key={b.kode} value={b.kode}>
                          {b.kota} ({b.kode})
                        </option>
                      ))}
                    </select>
                    {pesan ? <p id={`${id}-err`} className="mt-1 text-xs text-red-700 dark:text-red-400">{pesan}</p> : null}
                  </div>
                );
              })}
              {(() => {
                const id = `ruas-${r.id}-tanggal`;
                const pesan = galat[`ruas.${i}.tanggal`];
                return (
                  <div>
                    <label htmlFor={id} className="block text-sm font-medium">Tanggal</label>
                    <input id={id} type="date" name="tanggal" min={hariIni} value={r.tanggal} onChange={(e) => ubah(r.id, "tanggal", e.target.value)} required aria-invalid={pesan ? true : undefined} aria-describedby={pesan ? `${id}-err` : undefined} className={inputClass} />
                    {pesan ? <p id={`${id}-err`} className="mt-1 text-xs text-red-700 dark:text-red-400">{pesan}</p> : null}
                  </div>
                );
              })()}
            </div>
          </li>
        ))}
      </ol>
      {galat.ruas ? <p className="mt-3 text-sm text-red-700 dark:text-red-400" role="alert">{galat.ruas}</p> : null}
      <div className="mt-4 flex flex-wrap gap-3">
        {ruas.length < MAKS_RUAS ? (
          <Button variant="secondary" onClick={tambah}>
            + Tambah penerbangan
          </Button>
        ) : null}
        <Button type="submit">Cari multi-destinasi</Button>
      </div>
    </form>
  );
}
