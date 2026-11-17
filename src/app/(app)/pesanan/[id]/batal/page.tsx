import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RingkasanPenerbangan } from "@/components/booking/ringkasan-penerbangan";
import { StatusBadge } from "@/components/booking/status-badge";
import { Alert } from "@/components/ui/alert";
import { Button, buttonClass } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { ambilSatu, type SearchParams } from "@/lib/query";
import { wajibBisa } from "@/server/auth/session";
import { GalatBisnis } from "@/server/errors";
import { ambilPesananMilik } from "@/server/services/booking";
import { keHasil } from "@/server/services/penerbangan";
import { batalkanAction } from "../../actions";

export const metadata: Metadata = { title: "Konfirmasi Pembatalan" };

export default async function KonfirmasiPembatalanPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SearchParams> }) {
  const pengguna = await wajibBisa("booking.kelola");
  const { id } = await params;
  const galat = ambilSatu(await searchParams, "galat");

  let pesanan;
  try {
    pesanan = await ambilPesananMilik(pengguna.id, id);
  } catch (error) {
    if (error instanceof GalatBisnis) notFound();
    throw error;
  }

  return (
    <>
      <PageHeader title="Batalkan Pesanan" description="Tindakan ini tidak dapat dibatalkan. Kursi akan dilepas kembali." />
      <div className="space-y-4">
        {galat ? <Alert tone="error">{galat}</Alert> : null}
        <Card>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span>Kode booking <span className="font-mono font-semibold tracking-wider">{pesanan.kodeBookingReference}</span></span>
            <StatusBadge status={pesanan.status} />
          </div>
          {pesanan.tiket.map((t) => (
            <RingkasanPenerbangan key={t.id} penerbangan={keHasil(t.penerbangan)} />
          ))}
        </Card>
        {pesanan.status === "DIBATALKAN" ? (
          <Alert tone="info">Pesanan ini sudah dibatalkan.</Alert>
        ) : (
          <form action={batalkanAction} className="flex flex-wrap gap-3">
            <input type="hidden" name="id" value={pesanan.id} />
            <Button type="submit" variant="danger">Ya, batalkan pesanan</Button>
            <Link href={`/pesanan/${pesanan.id}`} className={buttonClass("secondary")}>Kembali</Link>
          </form>
        )}
      </div>
    </>
  );
}
