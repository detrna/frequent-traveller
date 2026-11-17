import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

/** Form pencarian berbasis GET: hasil bisa dibagikan lewat URL dan berfungsi tanpa JavaScript. */
export function FormCari({ action, children, tombol = "Cari penerbangan" }: { action: string; children: ReactNode; tombol?: string }) {
  return (
    <form action={action} method="get" className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
      <div className="mt-4">
        <Button type="submit">{tombol}</Button>
      </div>
    </form>
  );
}

export function opsiJam() {
  return Array.from({ length: 24 }, (_, jam) => ({ nilai: String(jam), label: `${String(jam).padStart(2, "0")}:00` }));
}
