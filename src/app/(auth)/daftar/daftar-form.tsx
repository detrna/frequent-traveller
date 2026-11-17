"use client";

import { useActionState } from "react";
import { daftarAction, type DaftarState } from "@/server/auth/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

export function DaftarForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, pending] = useActionState<DaftarState, FormData>(daftarAction, {});
  const galat = state.galat ?? {};

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <Field label="Nama" name="nama" autoComplete="name" required autoFocus defaultValue={state.nilai?.nama} error={galat.nama} />
      <Field label="Email" name="email" type="email" autoComplete="email" required defaultValue={state.nilai?.email} error={galat.email} />
      <Field label="Kata sandi" name="password" type="password" autoComplete="new-password" required minLength={8} hint="Minimal 8 karakter." error={galat.password} />
      <Field label="Konfirmasi kata sandi" name="konfirmasi" type="password" autoComplete="new-password" required error={galat.konfirmasi} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Memproses…" : "Daftar"}
      </Button>
    </form>
  );
}
