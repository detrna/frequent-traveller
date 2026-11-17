import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RingkasanPenerbangan } from "@/components/booking/ringkasan-penerbangan";
import { StatusBadge } from "@/components/booking/status-badge";
import { Alert } from "@/components/ui/alert";
import { Button, buttonClass } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { ambilSatu, type SearchParams } from "@/lib/query";
import { LABEL_STATUS_TIKET } from "@/lib/status";
import { wajibBisa } from "@/server/auth/session";
import { GalatBisnis } from "@/server/errors";
import { ambilPesananMilik } from "@/server/services/booking";
import { keHasil } from "@/server/services/penerbangan";
import { bayarAction, mulaiPembayaranAction } from "../actions";

export const metadata: Metadata = { title: "Detail Pesanan" };

const INFO: Record<string, string> = {
  "pembayaran-dimulai": "Pesanan menunggu pembayaran.",
  dibayar: "Pembayaran berhasil. Pesanan Anda telah dikonfirmasi.",
  dibatalkan: "Pesanan telah dibatalkan.",
};

export default async function DetailPesananPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SearchParams> }) {
  const pengguna = await wajibBisa("booking.kelola");
  const { id } = await params;
  const sp = await searchParams;

  let pesanan;
  try {
    pesanan = await ambilPesananMilik(pengguna.id, id);
  } catch (error) {
    if (error instanceof GalatBisnis) notFound();
    throw error;
  }

  const galat = ambilSatu(sp, "galat");
  const info = INFO[ambilSatu(sp, "info")];

  return (
    <>
      <PageHeader
        title="Detail Pesanan"
        actions={<Link href="/pesanan" className={buttonClass("secondary")}>Kembali ke pesanan</Link>}
      />
      <div className="space-y-4">
        {galat ? <Alert tone="error">{galat}</Alert> : null}
        {info ? <Alert tone="success">{info}</Alert> : null}

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase text-zinc-500">Kode booking</div>
              <div className="font-mono text-2xl font-semibold tracking-widest">{pesanan.kodeBookingReference}</div>
            </div>
            <StatusBadge status={pesanan.status} />
          </div>
        </Card>

        {pesanan.tiket.map((t) => (
          <Card key={t.id}>
            <RingkasanPenerbangan penerbangan={keHasil(t.penerbangan)} />
            <dl className="mt-4 grid gap-3 border-t border-zinc-200 pt-4 text-sm sm:grid-cols-3 dark:border-zinc-800">
              <div><dt className="text-zinc-500">Penumpang</dt><dd className="font-medium">{t.namaPenumpang}</dd></div>
              <div><dt className="text-zinc-500">Nomor tiket</dt><dd className="font-mono">{t.nomorTiket}</dd></div>
              <div><dt className="text-zinc-500">Status tiket</dt><dd className="font-medium">{LABEL_STATUS_TIKET[t.status]}</dd></div>
            </dl>
          </Card>
        ))}

        {pesanan.status !== "DIBATALKAN" ? (
          <div className="flex flex-wrap gap-3">
            {pesanan.status === "BOOKED" ? (
              <form action={mulaiPembayaranAction}>
                <input type="hidden" name="id" value={pesanan.id} />
                <Button type="submit">Lanjut ke pembayaran</Button>
              </form>
            ) : null}
            {pesanan.status === "WAITING_FOR_PAYMENT" ? (
              <form action={bayarAction}>
                <input type="hidden" name="id" value={pesanan.id} />
                <Button type="submit">Bayar sekarang (simulasi)</Button>
              </form>
            ) : null}
            <Link href={`/pesanan/${pesanan.id}/batal`} className={buttonClass("secondary")}>Batalkan pesanan</Link>
          </div>
        ) : null}
      </div>
    </>
  );
}
