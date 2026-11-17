import Link from "next/link";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/server/auth/actions";
import { ROLE_LABEL, navUntuk } from "@/server/auth/roles";
import { wajibLogin } from "@/server/auth/session";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const pengguna = await wajibLogin();
  const menu = navUntuk(pengguna.role);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
            APS
          </Link>
          <nav aria-label="Menu utama" className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <Link href="/dashboard" className="text-zinc-700 hover:text-sky-700 dark:text-zinc-300">
              Dashboard
            </Link>
            {menu.map((item) => (
              <Link key={item.href} href={item.href} className="text-zinc-700 hover:text-sky-700 dark:text-zinc-300">
                {item.label}
              </Link>
            ))}
          </nav>
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
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
