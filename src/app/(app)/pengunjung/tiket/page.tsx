import type { Metadata } from "next";
import { RingkasanPenerbangan } from "@/components/booking/ringkasan-penerbangan";
import { StatusBadge } from "@/components/booking/status-badge";
import { Card, PageHeader } from "@/components/ui/card";
import { LABEL_STATUS_TIKET } from "@/lib/status";
import { wajibBisa } from "@/server/auth/session";
import { keHasil } from "@/server/services/penerbangan";
import { ambilTiketMilik } from "@/server/services/tiket";

export const metadata: Metadata = { title: "Tiket Saya" };

export default async function TiketSayaPage() {
  const pengunjung = await wajibBisa("tiket.lihatMilik");
  const daftar = await ambilTiketMilik(pengunjung.id);

  return (
    <>
      <PageHeader title="Tiket Saya" description="Tiket yang telah dipesankan Manager Travel atas nama Anda." />
      {daftar.length === 0 ? (
        <p className="rounded-md border border-dashed border-zinc-300 px-4 py-10 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          Belum ada tiket yang dipesankan untuk Anda.
        </p>
      ) : (
        <ul className="space-y-4">
          {daftar.map((t) => (
            <li key={t.id}>
              <Card>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span>
                    Kode booking <span className="font-mono font-semibold tracking-wider">{t.booking.kodeBookingReference}</span>
                  </span>
                  <StatusBadge status={t.booking.status} />
                </div>
                <RingkasanPenerbangan penerbangan={keHasil(t.penerbangan)} />
                <dl className="mt-4 grid gap-3 border-t border-zinc-200 pt-4 text-sm sm:grid-cols-3 dark:border-zinc-800">
                  <div><dt className="text-zinc-500">Penumpang</dt><dd className="font-medium">{t.namaPenumpang}</dd></div>
                  <div><dt className="text-zinc-500">Nomor tiket</dt><dd className="font-mono">{t.nomorTiket}</dd></div>
                  <div><dt className="text-zinc-500">Status tiket</dt><dd className="font-medium">{LABEL_STATUS_TIKET[t.status]}</dd></div>
                </dl>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
