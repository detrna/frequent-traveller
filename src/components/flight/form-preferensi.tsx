import { BandaraSelect, type OpsiBandara } from "@/components/flight/bandara-select";
import { FormCari, opsiJam } from "@/components/flight/form-cari";
import { Field, SelectField } from "@/components/ui/field";
import { tanggalWIB } from "@/lib/waktu";

export function FormPreferensi({
  action,
  bandara,
  nilai,
  galat,
  tombol,
}: {
  action: string;
  bandara: OpsiBandara[];
  nilai: { asal: string; tujuan: string; tanggal: string; jamMulai: string; jamSelesai: string };
  galat: Record<string, string>;
  tombol: string;
}) {
  const jam = opsiJam();
  return (
    <FormCari action={action} tombol={tombol}>
      <BandaraSelect name="asal" label="Dari (opsional)" bandara={bandara} defaultValue={nilai.asal} error={galat.asal} kosong="Semua bandara" />
      <BandaraSelect name="tujuan" label="Tujuan" bandara={bandara} defaultValue={nilai.tujuan} error={galat.tujuan} kosong="Pilih tujuan" required />
      <Field label="Tanggal" name="tanggal" type="date" min={tanggalWIB()} defaultValue={nilai.tanggal} error={galat.tanggal} required />
      <div className="grid grid-cols-2 gap-3">
        <SelectField label="Berangkat dari jam" name="jamMulai" defaultValue={nilai.jamMulai} error={galat.jamMulai}>
          <option value="">Kapan saja</option>
          {jam.map((j) => (
            <option key={j.nilai} value={j.nilai}>{j.label}</option>
          ))}
        </SelectField>
        <SelectField label="Sampai jam" name="jamSelesai" defaultValue={nilai.jamSelesai} error={galat.jamSelesai}>
          <option value="">Kapan saja</option>
          {jam.map((j) => (
            <option key={j.nilai} value={j.nilai}>{j.label}</option>
          ))}
        </SelectField>
      </div>
    </FormCari>
  );
}
