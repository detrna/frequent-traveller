import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageHeader } from "@/components/ui/card";
import { ROLE_LABEL, navUntuk } from "@/server/auth/roles";
import { wajibLogin } from "@/server/auth/session";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const pengguna = await wajibLogin();
  const fitur = navUntuk(pengguna.role);

  return (
    <>
      <PageHeader title={`Halo, ${pengguna.nama}`} description={`Masuk sebagai ${ROLE_LABEL[pengguna.role]}.`} />
      {fitur.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Belum ada fitur yang tersedia untuk peran ini.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fitur.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="block h-full rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700">
                <Card className="h-full transition-shadow hover:shadow-md">
                  <h2 className="font-medium">{item.label}</h2>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{item.deskripsi}</p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
