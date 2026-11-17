import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/field";
import { NAMA_BULAN } from "@/lib/cuti";

export interface NilaiPeriode {
  tahun: string;
  bulan: string;
  tanggal: string;
}

/** Form pilih periode (tanggal, bulan, tahun) berbasis GET. Tahun & bulan wajib, tanggal opsional. */
export function PilihPeriode({
  action,
  nilai,
  galat,
  tahunDari,
  tahunSampai,
}: {
  action: string;
  nilai: NilaiPeriode;
  galat: Record<string, string>;
  tahunDari: number;
  tahunSampai: number;
}) {
  const tahun = Array.from({ length: tahunSampai - tahunDari + 1 }, (_, i) => tahunDari + i);
  return (
    <form action={action} method="get" className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
      <div className="grid gap-4 sm:grid-cols-3">
        <SelectField label="Tahun" name="tahun" defaultValue={nilai.tahun} error={galat.tahun} required>
          <option value="">Pilih tahun</option>
          {tahun.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </SelectField>
        <SelectField label="Bulan" name="bulan" defaultValue={nilai.bulan} error={galat.bulan} required>
          <option value="">Pilih bulan</option>
          {NAMA_BULAN.map((nama, i) => (
            <option key={nama} value={i + 1}>{nama}</option>
          ))}
        </SelectField>
        <SelectField label="Tanggal (opsional)" name="tanggal" defaultValue={nilai.tanggal} error={galat.tanggal}>
          <option value="">Seluruh bulan</option>
          {Array.from({ length: 31 }, (_, i) => (
            <option key={i + 1} value={i + 1}>{i + 1}</option>
          ))}
        </SelectField>
      </div>
      <div className="mt-4">
        <Button type="submit">Tampilkan</Button>
      </div>
    </form>
  );
}
