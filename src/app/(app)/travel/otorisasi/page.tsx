import type { Metadata } from "next";
import Link from "next/link";
import { RincianBooking } from "@/components/booking/rincian-booking";
import { Alert } from "@/components/ui/alert";
import { Button, buttonClass } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { adaParameter, ambilSatu, type SearchParams } from "@/lib/query";
import { wajibBisa } from "@/server/auth/session";
import { GalatBisnis } from "@/server/errors";
import { otorisasiKodeBooking } from "@/server/services/travel";

export const metadata: Metadata = { title: "Otorisasi Tiket" };

export default async function OtorisasiTiketPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await wajibBisa("travel.kelola");
  const sp = await searchParams;
  const kode = ambilSatu(sp, "kode");
  const dikirim = adaParameter(sp, "kode");

  let booking = null;
  let pesan: string | null = null;
  if (dikirim) {
    try {
      booking = await otorisasiKodeBooking(kode);
    } catch (error) {
      if (!(error instanceof GalatBisnis)) throw error;
      pesan = error.message;
    }
  }

  return (
    <>
      <PageHeader title="Otorisasi Tiket" description="Masukkan kode booking reference untuk memverifikasi status booking." />
      <Card className="max-w-xl">
        <form action="/travel/otorisasi" method="get" className="space-y-4">
          {/* Alert hanya berisi pesan wajib dari US9-b; instruksi mengulang ada di petunjuk terpisah. */}
          {pesan ? <Alert tone="error">{pesan}</Alert> : null}
          <Field
            label="Kode booking reference"
            name="kode"
            defaultValue={kode}
            required
            autoFocus={!!pesan}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            placeholder="mis. AP5T3K"
            hint={pesan ? "Silakan ulangi input kode booking reference." : "Kode terdiri dari 6 karakter huruf dan angka."}
            error={undefined}
          />
          <Button type="submit">Periksa kode</Button>
        </form>
      </Card>

      {booking ? (
        <section className="mt-6" aria-live="polite">
          <h2 className="mb-3 text-lg font-medium">Status booking</h2>
          <RincianBooking booking={booking} />
          <p className="mt-4">
            <Link href={`/travel/booking/${booking.id}`} className={buttonClass("secondary")}>Lihat detail & e-tiket</Link>
          </p>
        </section>
      ) : null}
    </>
  );
}
