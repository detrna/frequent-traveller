import { formatDurasi, formatJam, formatRupiah, formatTanggal } from "@/lib/waktu";
import type { HasilPenerbangan } from "@/server/services/penerbangan";

type Ringkas = Pick<HasilPenerbangan, "kodePenerbangan" | "maskapai" | "asal" | "tujuan" | "berangkat" | "tiba" | "harga">;

export function RingkasanPenerbangan({ penerbangan: p }: { penerbangan: Ringkas }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <div className="font-medium">
          {p.maskapai.nama} <span className="text-sm font-normal text-zinc-500">{p.kodePenerbangan}</span>
        </div>
        <div className="mt-1 text-lg font-semibold">
          {p.asal.kota} ({p.asal.kode}) → {p.tujuan.kota} ({p.tujuan.kode})
        </div>
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          {formatTanggal(p.berangkat)} · {formatJam(p.berangkat)} – {formatJam(p.tiba)} WIB · {formatDurasi(p.berangkat, p.tiba)}
        </div>
      </div>
      <div className="text-right">
        <div className="text-xs uppercase text-zinc-500">Harga</div>
        <div className="text-xl font-semibold">{formatRupiah(p.harga)}</div>
      </div>
    </div>
  );
}
