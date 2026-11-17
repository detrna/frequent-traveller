import Link from "next/link";
import { StatusBadge } from "@/components/booking/status-badge";
import { formatJam, formatRupiah, formatTanggal } from "@/lib/waktu";
import type { BookingTravel } from "@/server/services/travel";

export function TabelBookingTravel({ booking }: { booking: BookingTravel[] }) {
  if (booking.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-zinc-300 px-4 py-10 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
        Tidak ada booking dengan status ini.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg ring-1 ring-zinc-200 dark:ring-zinc-800">
      <table className="min-w-full divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
        <caption className="sr-only">Daftar status booking</caption>
        <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
          <tr>
            <th scope="col" className="px-4 py-2">Kode booking</th>
            <th scope="col" className="px-4 py-2">Atas nama</th>
            <th scope="col" className="px-4 py-2">Penerbangan</th>
            <th scope="col" className="px-4 py-2">Status</th>
            <th scope="col" className="px-4 py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 bg-white dark:divide-zinc-800 dark:bg-zinc-950">
          {booking.map((b) => {
            const aktif = b.tiket.filter((t) => t.status !== "DIBATALKAN");
            const tiket = (aktif.length > 0 ? aktif : b.tiket)[0];
            const p = tiket?.penerbangan;
            return (
              <tr key={b.id}>
                <td className="whitespace-nowrap px-4 py-3">
                  <Link href={`/travel/booking/${b.id}`} className="font-mono font-semibold tracking-wider text-sky-800 hover:underline dark:text-sky-300">
                    {b.kodeBookingReference}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div>{b.pengunjung?.nama ?? b.pemilik.nama}</div>
                  <div className="text-xs text-zinc-500">{b.pengunjung ? "Pengunjung" : "Pemesan mandiri"}</div>
                </td>
                <td className="px-4 py-3">
                  {p ? (
                    <>
                      <div>
                        {p.asal.kode} → {p.tujuan.kode} <span className="text-zinc-500">· {p.maskapai.nama}</span>
                      </div>
                      <div className="text-xs text-zinc-500">
                        {formatTanggal(p.berangkat)}, {formatJam(p.berangkat)} WIB{b.tiket.length > 1 ? ` · +${b.tiket.length - 1} tiket` : ""}
                      </div>
                    </>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                <td className="whitespace-nowrap px-4 py-3 text-right">{formatRupiah(b.tiket.reduce((n, t) => n + t.penerbangan.harga, 0))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
