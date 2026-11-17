import type { Metadata } from "next";
import Link from "next/link";
import { TabelBookingTravel } from "@/components/booking/tabel-booking-travel";
import { Alert } from "@/components/ui/alert";
import { Card, PageHeader } from "@/components/ui/card";
import { ambilSatu, type SearchParams } from "@/lib/query";
import { LABEL_STATUS_BOOKING, PARAM_DARI_STATUS, STATUS_FILTER } from "@/lib/status";
import { wajibBisa } from "@/server/auth/session";
import { GalatBisnis } from "@/server/errors";
import { ambilStatusBooking } from "@/server/services/travel";

export const metadata: Metadata = { title: "Status Booking" };

const href = (status?: string, halaman = 1) => {
  const q = new URLSearchParams();
  if (status) q.set("status", status);
  if (halaman > 1) q.set("halaman", String(halaman));
  const s = q.toString();
  return `/travel/status${s ? `?${s}` : ""}`;
};

export default async function StatusBookingPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await wajibBisa("travel.kelola");
  const sp = await searchParams;
  const paramStatus = ambilSatu(sp, "status");

  let hasil;
  let galat: string | null = null;
  try {
    hasil = await ambilStatusBooking({ status: paramStatus, halaman: ambilSatu(sp, "halaman") });
  } catch (error) {
    if (!(error instanceof GalatBisnis)) throw error;
    galat = error.message;
    hasil = await ambilStatusBooking({});
  }

  const semua = Object.values(hasil.jumlahPerStatus).reduce((a, b) => a + b, 0);
  const aktifParam = galat ? "" : paramStatus;
  const tab = [
    { param: "", label: "Semua", jumlah: semua },
    ...STATUS_FILTER.map((s) => ({ param: PARAM_DARI_STATUS[s]!, label: LABEL_STATUS_BOOKING[s], jumlah: hasil.jumlahPerStatus[s] })),
  ];

  return (
    <>
      <PageHeader title="Status Booking" description="Periksa otorisasi travel: lihat semua booking atau filter berdasarkan status." />
      {galat ? <div className="mb-4"><Alert tone="error">{galat}</Alert></div> : null}

      <nav aria-label="Filter status booking" className="mb-4 flex flex-wrap gap-2">
        {tab.map((t) => {
          const aktif = aktifParam === t.param;
          return (
            <Link
              key={t.param || "semua"}
              href={href(t.param)}
              aria-current={aktif ? "page" : undefined}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ring-1 ring-inset transition-colors ${
                aktif ? "bg-sky-700 text-white ring-sky-700" : "bg-white text-zinc-700 ring-zinc-300 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-700"
              }`}
            >
              {t.label} <span className={aktif ? "text-sky-100" : "text-zinc-500"}>({t.jumlah})</span>
            </Link>
          );
        })}
      </nav>

      <section aria-live="polite">
        <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">{hasil.total} booking ditampilkan.</p>
        <TabelBookingTravel booking={hasil.booking} />
        {hasil.totalHalaman > 1 ? (
          <nav aria-label="Halaman" className="mt-4 flex items-center justify-between text-sm">
            {hasil.halaman > 1 ? <Link href={href(aktifParam, hasil.halaman - 1)} className="underline">← Sebelumnya</Link> : <span />}
            <span>Halaman {hasil.halaman} dari {hasil.totalHalaman}</span>
            {hasil.halaman < hasil.totalHalaman ? <Link href={href(aktifParam, hasil.halaman + 1)} className="underline">Berikutnya →</Link> : <span />}
          </nav>
        ) : null}
      </section>
      <Card className="mt-8 text-sm text-zinc-600 dark:text-zinc-400">
        Punya kode booking reference? Gunakan <Link href="/travel/otorisasi" className="font-medium text-sky-800 underline dark:text-sky-300">Otorisasi Tiket</Link> untuk memeriksa statusnya.
      </Card>
    </>
  );
}
