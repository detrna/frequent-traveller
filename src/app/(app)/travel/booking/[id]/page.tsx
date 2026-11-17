import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RincianBooking } from "@/components/booking/rincian-booking";
import { Alert } from "@/components/ui/alert";
import { Button, buttonClass } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { ambilSatu, type SearchParams } from "@/lib/query";
import { formatJam, formatTanggal } from "@/lib/waktu";
import { wajibBisa } from "@/server/auth/session";
import { GalatBisnis } from "@/server/errors";
import { ambilStatusEtiket } from "@/server/services/etiket";
import { ambilBookingTravel } from "@/server/services/travel";
import { kirimUlangEtiketAction } from "../../actions";

export const metadata: Metadata = { title: "Detail Booking" };

const INFO: Record<string, string> = {
  "etiket-terkirim": "E-tiket berhasil dikirim.",
  "etiket-sudah-terkirim": "E-tiket sudah terkirim sebelumnya.",
};

export default async function DetailBookingTravelPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SearchParams> }) {
  await wajibBisa("travel.kelola");
  const { id } = await params;
  const sp = await searchParams;

  let booking;
  try {
    booking = await ambilBookingTravel(id);
  } catch (error) {
    if (error instanceof GalatBisnis) notFound();
    throw error;
  }
  const notifikasi = await ambilStatusEtiket(id);
  const galat = ambilSatu(sp, "galat");
  const info = INFO[ambilSatu(sp, "info")];

  const adaTiketAktif = booking.tiket.some((t) => t.status !== "DIBATALKAN");
  const perluKirim =
    !!booking.pengunjung && adaTiketAktif && booking.tiket.some((t) => t.status !== "DIBATALKAN" && !notifikasi.some((n) => n.tiketId === t.id && n.status === "TERKIRIM"));

  return (
    <>
      <PageHeader title="Detail Booking" actions={<Link href="/travel/status" className={buttonClass("secondary")}>Kembali ke status booking</Link>} />
      <div className="space-y-6">
        {galat ? <Alert tone="error">{galat}</Alert> : null}
        {info ? <Alert tone="success">{info}</Alert> : null}
        <RincianBooking booking={booking} />

        {booking.pengunjung ? (
          <Card>
            <h2 className="mb-3 text-lg font-medium">E-tiket</h2>
            {notifikasi.length === 0 ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">E-tiket belum pernah dikirim.</p>
            ) : (
              <ul className="divide-y divide-zinc-100 text-sm dark:divide-zinc-800">
                {notifikasi.map((n) => (
                  <li key={n.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <span>
                      <span className="font-mono">{n.tiket.nomorTiket}</span> → {n.kepada || "(tanpa email)"}
                      <span className="text-zinc-500"> · {n.percobaan}× percobaan · {formatTanggal(n.terkirimAt ?? n.createdAt)}, {formatJam(n.terkirimAt ?? n.createdAt)} WIB</span>
                      {n.error ? <span className="block text-xs text-red-700 dark:text-red-400">{n.error}</span> : null}
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${n.status === "TERKIRIM" ? "bg-emerald-100 text-emerald-900 ring-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-800" : "bg-red-100 text-red-900 ring-red-300 dark:bg-red-950 dark:text-red-200 dark:ring-red-800"}`}>
                      {n.status === "TERKIRIM" ? "Terkirim" : "Gagal"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {perluKirim ? (
              <form action={kirimUlangEtiketAction} className="mt-4">
                <input type="hidden" name="id" value={booking.id} />
                <Button type="submit">{notifikasi.length === 0 ? "Kirim e-tiket" : "Kirim ulang e-tiket"}</Button>
              </form>
            ) : null}
          </Card>
        ) : null}
      </div>
    </>
  );
}
