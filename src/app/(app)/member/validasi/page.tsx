import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/booking/status-badge";
import { RingkasanPenerbangan } from "@/components/booking/ringkasan-penerbangan";
import { Alert } from "@/components/ui/alert";
import { Button, buttonClass } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { ambilSatu, type SearchParams } from "@/lib/query";
import { LABEL_STATUS_TIKET } from "@/lib/status";
import { formatTanggal } from "@/lib/waktu";
import { wajibBisa } from "@/server/auth/session";
import { PESAN_PROFIL_TIDAK_LENGKAP, ambilTiketMilik } from "@/server/services/tiket";
import { keHasil } from "@/server/services/penerbangan";
import { validasiTiketAction } from "./actions";

export const metadata: Metadata = { title: "Validasi Tiket" };

export default async function ValidasiTiketPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const member = await wajibBisa("member.fitur");
  const sp = await searchParams;
  const galat = ambilSatu(sp, "galat");
  const berhasil = ambilSatu(sp, "berhasil");
  const tiketGalat = ambilSatu(sp, "tiket");
  const daftar = await ambilTiketMilik(member.id);

  return (
    <>
      <PageHeader title="Validasi Tiket" description="Validasi tiket menggunakan data profil Anda. Profil harus lengkap terlebih dahulu." />
      <div className="mb-6 space-y-3">
        {berhasil ? <Alert tone="success">Tiket {berhasil} berhasil divalidasi.</Alert> : null}
        {galat ? (
          <Alert tone="error">
            <span>{galat}</span>
            {galat === PESAN_PROFIL_TIDAK_LENGKAP ? (
              <>
                {" "}
                <Link href="/member/profil" className="font-medium underline">Lengkapi profil</Link>
              </>
            ) : null}
          </Alert>
        ) : null}
      </div>

      {daftar.length === 0 ? (
        <p className="rounded-md border border-dashed border-zinc-300 px-4 py-10 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
          Belum ada tiket. Pesan tiket terlebih dahulu.
        </p>
      ) : (
        <ul className="space-y-4">
          {daftar.map((t) => (
            <li key={t.id}>
              <Card className={t.id === tiketGalat && galat ? "ring-red-400 dark:ring-red-700" : ""}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span>
                    <span className="font-mono">{t.nomorTiket}</span> · {t.namaPenumpang}
                  </span>
                  <span className="flex items-center gap-2">
                    <StatusBadge status={t.booking.status} />
                    <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-300 dark:bg-zinc-800 dark:ring-zinc-700">
                      Tiket: {LABEL_STATUS_TIKET[t.status]}
                    </span>
                  </span>
                </div>
                <RingkasanPenerbangan penerbangan={keHasil(t.penerbangan)} />
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {t.status === "TERBIT" ? (
                    <form action={validasiTiketAction}>
                      <input type="hidden" name="tiketId" value={t.id} />
                      <Button type="submit">Validasi tiket</Button>
                    </form>
                  ) : t.status === "TERVALIDASI" ? (
                    <span className="text-sm text-emerald-700 dark:text-emerald-400">
                      Tervalidasi{t.validatedAt ? ` pada ${formatTanggal(t.validatedAt)}` : ""}
                    </span>
                  ) : (
                    <span className="text-sm text-zinc-500">Tiket dibatalkan</span>
                  )}
                  <Link href={`/pesanan/${t.booking.id}`} className={buttonClass("secondary")}>Lihat pesanan</Link>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
