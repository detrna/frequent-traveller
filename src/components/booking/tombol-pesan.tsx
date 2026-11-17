import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { can, type Role } from "@/server/auth/roles";
import type { HasilPenerbangan } from "@/server/services/penerbangan";

/** Aksi kolom terakhir pada tabel hasil pencarian. */
export function TombolPesan({ penerbangan }: { penerbangan: HasilPenerbangan }) {
  if (penerbangan.kursiTersedia <= 0) {
    return <span className="text-xs font-medium text-zinc-500">Penuh</span>;
  }
  return (
    <Link href={`/pesanan/baru?penerbangan=${penerbangan.id}`} className={buttonClass("primary", "px-3 py-1.5")}>
      Pesan
    </Link>
  );
}

/** Untuk tamu: memesan butuh login; setelah masuk, kembali ke formulir pemesanan (US10-c). */
export function TombolMasukUntukPesan({ penerbangan }: { penerbangan: HasilPenerbangan }) {
  if (penerbangan.kursiTersedia <= 0) {
    return <span className="text-xs font-medium text-zinc-500">Penuh</span>;
  }
  const kembali = encodeURIComponent(`/pesanan/baru?penerbangan=${penerbangan.id}`);
  return (
    <Link href={`/login?callbackUrl=${kembali}`} className={buttonClass("secondary", "px-3 py-1.5")}>
      Masuk untuk memesan
    </Link>
  );
}

export const aksiPesan = (p: HasilPenerbangan) => <TombolPesan penerbangan={p} />;
const aksiMasuk = (p: HasilPenerbangan) => <TombolMasukUntukPesan penerbangan={p} />;

/**
 * Aksi pemesanan menurut pengunjung halaman publik: tamu → tombol masuk, pemilik `booking.kelola` → "Pesan",
 * peran lain (HRD, Manager Travel, Pengunjung) → tanpa kolom aksi.
 */
export function aksiPesanUntuk(role: Role | null | undefined) {
  if (!role) return aksiMasuk;
  return can(role, "booking.kelola") ? aksiPesan : undefined;
}
