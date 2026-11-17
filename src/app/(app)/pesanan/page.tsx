import type { Metadata } from "next";
import Link from "next/link";
import { RingkasanPenerbangan } from "@/components/booking/ringkasan-penerbangan";
import { StatusBadge } from "@/components/booking/status-badge";
import { buttonClass } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { wajibBisa } from "@/server/auth/session";
import { ambilDataPesanan } from "@/server/services/booking";
import { keHasil } from "@/server/services/penerbangan";

export const metadata: Metadata = { title: "Pesanan Saya" };

export default async function DataPesananPage() {
  const pengguna = await wajibBisa("booking.kelola");
  const daftar = await ambilDataPesanan(pengguna.id);

  return (
    <>
      <PageHeader
        title="Pesanan Saya"
        description="Data pesanan tiket pesawat Anda."
        actions={<Link href="/jadwal" className={buttonClass("primary")}>Pesan tiket baru</Link>}
      />
      {daftar.length === 0 ? (
        <p className="rounded-md border border-dashed border-zinc-300 px-4 py-10 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          Belum ada pesanan. Cari penerbangan untuk memulai.
        </p>
      ) : (
        <ul className="space-y-4">
          {daftar.map((p) => (
            <li key={p.id}>
              <Card>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm">
                    Kode booking <span className="font-mono font-semibold tracking-wider">{p.kodeBookingReference}</span>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                {p.tiket.map((t) => (
                  <RingkasanPenerbangan key={t.id} penerbangan={keHasil(t.penerbangan)} />
                ))}
                <div className="mt-4">
                  <Link href={`/pesanan/${p.id}`} className={buttonClass("secondary")}>Lihat detail</Link>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
