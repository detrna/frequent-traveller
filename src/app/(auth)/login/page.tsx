import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Masuk" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { callbackUrl } = await searchParams;
  const tujuan = typeof callbackUrl === "string" ? callbackUrl : "";
  const tautanDaftar = tujuan ? `/daftar?callbackUrl=${encodeURIComponent(tujuan)}` : "/daftar";

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Masuk ke APS</h1>
      <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">Aplikasi pemesanan tiket pesawat dan manajemen perjalanan.</p>
      <Card>
        <LoginForm callbackUrl={tujuan} />
      </Card>
      <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
        Belum punya akun?{" "}
        <Link href={tautanDaftar} className="font-medium text-sky-700 hover:underline dark:text-sky-400">
          Daftar
        </Link>
      </p>
      {process.env.NODE_ENV !== "production" ? (
        <p className="mt-4 text-xs text-zinc-500">
          Dev: akun demo <code>*@aps.test</code> (hrd, pengguna, member, member2, travel, pengunjung1), kata sandi{" "}
          <code>Demo#12345</code> — jalankan <code>npm run db:seed</code> terlebih dahulu.
        </p>
      ) : null}
    </main>
  );
}
