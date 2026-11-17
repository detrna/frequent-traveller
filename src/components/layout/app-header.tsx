import Link from "next/link";
import { buttonClass, Button } from "@/components/ui/button";
import { logoutAction } from "@/server/auth/actions";
import { ROLE_LABEL, navUntuk } from "@/server/auth/roles";
import type { SesiPengguna } from "@/server/auth/session";

const TAUTAN = "text-zinc-700 hover:text-sky-700 dark:text-zinc-300";

/** Menu untuk tamu: hanya halaman publik (US10-a). */
const MENU_TAMU = [
  { href: "/jadwal", label: "Cari Penerbangan" },
  { href: "/jadwal/multi-tujuan", label: "Beberapa Tujuan" },
];

/** Header bersama layout `(app)` (pengguna login) dan `(publik)` (pengguna login atau tamu). */
export function AppHeader({ pengguna }: { pengguna: SesiPengguna | null }) {
  const menu = pengguna ? [{ href: "/dashboard", label: "Dashboard" }, ...navUntuk(pengguna.role)] : MENU_TAMU;

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href={pengguna ? "/dashboard" : "/jadwal"} className="text-lg font-semibold tracking-tight">
          APS
        </Link>
        <nav aria-label="Menu utama" className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {menu.map((item) => (
            <Link key={item.href} href={item.href} className={TAUTAN}>
              {item.label}
            </Link>
          ))}
        </nav>
        {pengguna ? (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-right leading-tight">
              <span className="block font-medium">{pengguna.nama}</span>
              <span className="block text-xs text-zinc-500">{ROLE_LABEL[pengguna.role]}</span>
            </span>
            <form action={logoutAction}>
              <Button type="submit" variant="secondary">
                Keluar
              </Button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm">
            <Link href="/login" className={buttonClass("secondary")}>
              Masuk
            </Link>
            <Link href="/daftar" className={buttonClass("primary")}>
              Daftar
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
