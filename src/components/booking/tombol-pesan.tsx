import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
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

export const aksiPesan = (p: HasilPenerbangan) => <TombolPesan penerbangan={p} />;
