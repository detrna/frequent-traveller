"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button, buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { LABEL_STATUS_BOOKING } from "@/lib/status";
import type { StatusBooking } from "@/generated/prisma/enums";
import { pesanUntukPengunjungAction, type PesanPengunjungState } from "../actions";

export function PesanPengunjungForm({ penerbanganId }: { penerbanganId: string }) {
  const [state, formAction, pending] = useActionState<PesanPengunjungState, FormData>(pesanUntukPengunjungAction, {});

  if (state.hasil) {
    const h = state.hasil;
    return (
      <div className="space-y-4" aria-live="polite">
        <Alert tone="success">Pesanan berhasil disimpan atas nama {h.namaPengunjung}.</Alert>
        <Card>
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <div><dt className="text-zinc-500">Kode booking reference</dt><dd className="font-mono text-lg font-semibold tracking-widest">{h.kodeBooking}</dd></div>
            <div><dt className="text-zinc-500">Status</dt><dd className="font-medium">{LABEL_STATUS_BOOKING[h.status as StatusBooking]}</dd></div>
            <div><dt className="text-zinc-500">Pengunjung</dt><dd>{h.namaPengunjung}<br /><span className="text-zinc-500">{h.emailPengunjung}</span></dd></div>
          </dl>
        </Card>
        {h.etiket.terkirim > 0 || h.etiket.dilewati > 0 ? (
          <Alert tone="success">E-tiket telah dikirim ke {h.emailPengunjung}.</Alert>
        ) : (
          <Alert tone="error">
            E-tiket gagal dikirim ke {h.emailPengunjung}{h.etiket.galat ? ` (${h.etiket.galat})` : ""}. Pesanan tetap tersimpan; Anda dapat mengirim ulang dari halaman detail booking.
          </Alert>
        )}
        {h.akunBaru && h.kataSandiSementara ? (
          <Alert tone="info">
            Akun pengunjung baru dibuat agar pengunjung dapat melihat tiketnya. Email: <strong>{h.emailPengunjung}</strong>, kata sandi sementara:{" "}
            <code className="rounded bg-white/70 px-1.5 py-0.5 font-mono text-base dark:bg-black/30">{h.kataSandiSementara}</code>. Sampaikan kepada pengunjung — kata sandi ini hanya ditampilkan sekali.
          </Alert>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Link href={`/travel/booking/${h.bookingId}`} className={buttonClass("primary")}>Lihat detail booking</Link>
          <Link href="/travel/cari" className={buttonClass("secondary")}>Pesan tiket lain</Link>
        </div>
      </div>
    );
  }

  const galat = state.galat ?? {};
  const nilai = state.nilai ?? {};
  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="penerbanganId" value={penerbanganId} />
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {Object.keys(galat).length > 0 ? <Alert tone="error">Data pengunjung belum lengkap atau tidak valid. Periksa isian yang ditandai.</Alert> : null}
      <Field label="Nama pengunjung" name="nama" defaultValue={nilai.nama} error={galat.nama} autoComplete="off" required />
      <Field label="Email pengunjung" name="email" type="email" defaultValue={nilai.email} error={galat.email} autoComplete="off" required hint="E-tiket dikirim ke email ini. Jika email sudah terdaftar, data pengunjung yang ada dipakai." />
      <Field label="Nomor telepon" name="telepon" type="tel" defaultValue={nilai.telepon} error={galat.telepon} autoComplete="off" required hint="Contoh: 081234567890." />
      <Field label="NIK" name="nik" inputMode="numeric" defaultValue={nilai.nik} error={galat.nik} autoComplete="off" required hint="16 digit angka." />
      <Button type="submit" disabled={pending}>{pending ? "Memproses…" : "Pesan tiket untuk pengunjung"}</Button>
    </form>
  );
}
