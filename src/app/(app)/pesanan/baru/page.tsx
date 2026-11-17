import type { Metadata } from "next";
import Link from "next/link";
import { RingkasanPenerbangan } from "@/components/booking/ringkasan-penerbangan";
import { Alert } from "@/components/ui/alert";
import { buttonClass } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { ambilSatu, type SearchParams } from "@/lib/query";
import { db } from "@/server/db";
import { wajibBisa } from "@/server/auth/session";
import { ambilPenerbanganById } from "@/server/services/penerbangan";
import { PemesananForm } from "./pemesanan-form";

export const metadata: Metadata = { title: "Pemesanan Tiket" };

export default async function PemesananPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const pengguna = await wajibBisa("booking.kelola");
  const id = ambilSatu(await searchParams, "penerbangan");
  const penerbangan = id ? await ambilPenerbanganById(id) : null;

  if (!penerbangan) {
    return (
      <>
        <PageHeader title="Pemesanan Tiket" />
        <Alert tone="error">Penerbangan tidak ditemukan. Pilih penerbangan dari hasil pencarian.</Alert>
        <p className="mt-4">
          <Link href="/penerbangan/cari" className={buttonClass("primary")}>Cari penerbangan</Link>
        </p>
      </>
    );
  }

  const profil = await db.orm.public.ProfilMember.where({ userId: pengguna.id }).select("namaLengkap").first();
  const namaAwal = profil?.namaLengkap || pengguna.nama;
  const berangkat = penerbangan.berangkat <= new Date();

  return (
    <>
      <PageHeader title="Pemesanan Tiket" description="Periksa penerbangan dan isi data penumpang." />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card><RingkasanPenerbangan penerbangan={penerbangan} /></Card>
        <Card>
          {berangkat ? (
            <Alert tone="error">Penerbangan ini sudah berangkat.</Alert>
          ) : penerbangan.kursiTersedia <= 0 ? (
            <Alert tone="error">Kursi pada penerbangan ini sudah penuh.</Alert>
          ) : (
            <PemesananForm penerbanganId={penerbangan.id} namaAwal={namaAwal} />
          )}
        </Card>
      </div>
    </>
  );
}
