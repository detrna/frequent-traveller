import { RingkasanPenerbangan } from "@/components/booking/ringkasan-penerbangan";
import { StatusBadge } from "@/components/booking/status-badge";
import { Card } from "@/components/ui/card";
import { LABEL_STATUS_TIKET } from "@/lib/status";
import { keHasil } from "@/server/services/penerbangan";
import type { BookingTravel } from "@/server/services/travel";

/** Kartu rincian booking untuk Manager Travel: kode, status, atas nama, dan tiket. */
export function RincianBooking({ booking }: { booking: BookingTravel }) {
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase text-zinc-500">Kode booking reference</div>
            <div className="font-mono text-2xl font-semibold tracking-widest">{booking.kodeBookingReference}</div>
          </div>
          <div className="text-right">
            <div className="mb-1 text-xs uppercase text-zinc-500">Status booking</div>
            <StatusBadge status={booking.status} />
          </div>
        </div>
        <dl className="mt-4 grid gap-3 border-t border-zinc-200 pt-4 text-sm sm:grid-cols-3 dark:border-zinc-800">
          <div><dt className="text-zinc-500">Atas nama</dt><dd className="font-medium">{booking.pengunjung?.nama ?? booking.pemilik.nama}</dd></div>
          <div><dt className="text-zinc-500">Email</dt><dd>{booking.pengunjung?.email ?? booking.pemilik.email}</dd></div>
          <div><dt className="text-zinc-500">Jenis pesanan</dt><dd>{booking.pengunjung ? "Dipesankan Manager Travel" : "Pemesan mandiri"}</dd></div>
        </dl>
      </Card>
      {booking.tiket.map((t) => (
        <Card key={t.id}>
          <RingkasanPenerbangan penerbangan={keHasil(t.penerbangan)} />
          <dl className="mt-4 grid gap-3 border-t border-zinc-200 pt-4 text-sm sm:grid-cols-3 dark:border-zinc-800">
            <div><dt className="text-zinc-500">Penumpang</dt><dd className="font-medium">{t.namaPenumpang}</dd></div>
            <div><dt className="text-zinc-500">Nomor tiket</dt><dd className="font-mono">{t.nomorTiket}</dd></div>
            <div><dt className="text-zinc-500">Status tiket</dt><dd className="font-medium">{LABEL_STATUS_TIKET[t.status]}</dd></div>
          </dl>
        </Card>
      ))}
    </div>
  );
}
