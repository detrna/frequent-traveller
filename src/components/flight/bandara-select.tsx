import { SelectField } from "@/components/ui/field";

export interface OpsiBandara {
  kode: string;
  kota: string;
  nama: string;
}

export function BandaraSelect({
  name,
  label,
  bandara,
  defaultValue = "",
  error,
  kosong,
  required,
}: {
  name: string;
  label: string;
  bandara: OpsiBandara[];
  defaultValue?: string;
  error?: string;
  /** Teks opsi kosong, mis. "Semua bandara" atau "Pilih tujuan". */
  kosong: string;
  required?: boolean;
}) {
  return (
    <SelectField label={label} name={name} defaultValue={defaultValue} error={error} required={required}>
      <option value="">{kosong}</option>
      {bandara.map((b) => (
        <option key={b.kode} value={b.kode}>
          {b.kota} ({b.kode}) — {b.nama}
        </option>
      ))}
    </SelectField>
  );
}
