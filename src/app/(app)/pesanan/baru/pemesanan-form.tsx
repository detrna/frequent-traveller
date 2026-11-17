"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { pesanAction, type PesanState } from "../actions";

export function PemesananForm({ penerbanganId, namaAwal }: { penerbanganId: string; namaAwal: string }) {
  const [state, formAction, pending] = useActionState<PesanState, FormData>(pesanAction, {});
  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="penerbanganId" value={penerbanganId} />
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <Field label="Nama penumpang" name="namaPenumpang" defaultValue={namaAwal} required minLength={3} maxLength={100} autoComplete="name" hint="Isi sesuai identitas (KTP/paspor)." />
      <Button type="submit" disabled={pending}>
        {pending ? "Memproses…" : "Pesan tiket"}
      </Button>
    </form>
  );
}
