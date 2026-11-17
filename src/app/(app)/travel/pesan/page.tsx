import type { Metadata } from "next";
import Link from "next/link";
import { RingkasanPenerbangan } from "@/components/booking/ringkasan-penerbangan";
import { Alert } from "@/components/ui/alert";
import { buttonClass } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/card";
import { ambilSatu, type SearchParams } from "@/lib/query";
import { wajibBisa } from "@/server/auth/session";
import { ambilPenerbanganById } from "@/server/services/penerbangan";
import { PesanPengunjungForm } from "./pesan-form";

export const metadata: Metadata = { title: "Pesan untuk Pengunjung" };

export default async function PesanUntukPengunjungPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await wajibBisa("travel.kelola");
  const id = ambilSatu(await searchParams, "penerbangan");
  const penerbangan = id ? await ambilPenerbanganById(id) : null;

  if (!penerbangan) {
    return (
      <>
        <PageHeader title="Pesan untuk Pengunjung" />
        <Alert tone="error">Penerbangan tidak ditemukan. Pilih tiket dari hasil pencarian.</Alert>
        <p className="mt-4"><Link href="/travel/cari" className={buttonClass("primary")}>Cari tiket</Link></p>
      </>
    );
  }

  const tidakBisa = penerbangan.berangkat <= new Date() ? "Penerbangan ini sudah berangkat." : penerbangan.kursiTersedia <= 0 ? "Kursi pada penerbangan ini sudah penuh." : null;

  return (
    <>
      <PageHeader title="Pesan untuk Pengunjung" description="Isi data pengunjung untuk menyimpan pesanan atas namanya." />
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card><RingkasanPenerbangan penerbangan={penerbangan} /></Card>
        <Card>{tidakBisa ? <Alert tone="error">{tidakBisa}</Alert> : <PesanPengunjungForm penerbanganId={penerbangan.id} />}</Card>
      </div>
    </>
  );
}
