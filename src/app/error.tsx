"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-6 py-24">
      <h1 className="text-2xl font-semibold tracking-tight">Terjadi kesalahan</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Kami tidak dapat memproses permintaan Anda saat ini. Silakan coba lagi; bila berlanjut, hubungi administrator
        {error.digest ? ` dengan kode ${error.digest}` : ""}.
      </p>
      <div>
        <Button onClick={reset}>Coba lagi</Button>
      </div>
    </main>
  );
}
