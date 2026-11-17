import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { DaftarForm } from "./daftar-form";

export const metadata: Metadata = { title: "Daftar" };

export default async function DaftarPage({ searchParams }: PageProps<"/daftar">) {
  const { callbackUrl } = await searchParams;
  const tujuan = typeof callbackUrl === "string" ? callbackUrl : "";
  const tautanMasuk = tujuan ? `/login?callbackUrl=${encodeURIComponent(tujuan)}` : "/login";

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Daftar akun Frequent Traveller</h1>
      <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">Buat akun untuk memesan dan mengelola tiket pesawat Anda.</p>
      <Card>
        <DaftarForm callbackUrl={tujuan} />
      </Card>
      <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
        Sudah punya akun?{" "}
        <Link href={tautanMasuk} className="font-medium text-sky-700 hover:underline dark:text-sky-400">
          Masuk
        </Link>
      </p>
    </main>
  );
}
