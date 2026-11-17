import { hariIrisan } from "@/lib/cuti";
import type { PegawaiCuti } from "@/server/services/cuti";

/** Jalur kalender sebulan: hari yang terisi menandakan pegawai sedang cuti. Hiasan visual; datanya juga ada di tabel. */
export function KalenderBulan({ tahun, bulan, pegawai }: { tahun: number; bulan: number; pegawai: PegawaiCuti[] }) {
  const jumlahHari = new Date(Date.UTC(tahun, bulan, 0)).getUTCDate();
  const hari = Array.from({ length: jumlahHari }, (_, i) => i + 1);
  const kolom = { gridTemplateColumns: `repeat(${jumlahHari}, minmax(0, 1fr))` };

  return (
    <div aria-hidden="true" className="overflow-x-auto rounded-lg bg-white p-4 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
      <div className="min-w-[36rem] space-y-2 text-[10px]">
        <div className="grid gap-px pl-36 text-center text-zinc-500" style={kolom}>
          {hari.map((h) => (
            <span key={h}>{h}</span>
          ))}
        </div>
        {pegawai.map((p) => (
          <div key={p.pegawai.id} className="flex items-center gap-2">
            <span className="shrink-0 truncate text-xs" style={{ width: "8.5rem" }}>{p.pegawai.nama}</span>
            <div className="grid flex-1 gap-px" style={kolom}>
              {hari.map((h) => {
                const tgl = new Date(Date.UTC(tahun, bulan - 1, h));
                const cuti = p.permohonan.some((m) => hariIrisan(m.tglMulai, m.tglSelesai, { awal: tgl, akhir: tgl }) > 0);
                return <span key={h} className={`h-4 rounded-sm ${cuti ? "bg-sky-600" : "bg-zinc-100 dark:bg-zinc-800"}`} />;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
