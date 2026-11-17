import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass } from "@/components/ui/button";

export const metadata: Metadata = { title: "Akses ditolak" };

export default function AksesDitolakPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-6 py-24">
      <h1 className="text-2xl font-semibold tracking-tight">Akses ditolak</h1>
      <p className="text-zinc-600 dark:text-zinc-400">Peran akun Anda tidak memiliki izin untuk membuka halaman tersebut.</p>
      <div>
        <Link href="/dashboard" className={buttonClass("primary")}>
          Kembali ke dashboard
        </Link>
      </div>
    </main>
  );
}
