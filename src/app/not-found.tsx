import Link from "next/link";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-6 py-24">
      <p className="text-sm font-medium text-sky-700 dark:text-sky-400">404</p>
      <h1 className="text-2xl font-semibold tracking-tight">Halaman tidak ditemukan</h1>
      <p className="text-zinc-600 dark:text-zinc-400">Halaman atau data yang Anda cari tidak ada, atau bukan milik akun Anda.</p>
      <div>
        <Link href="/dashboard" className={buttonClass("primary")}>Kembali ke dashboard</Link>
      </div>
    </main>
  );
}
