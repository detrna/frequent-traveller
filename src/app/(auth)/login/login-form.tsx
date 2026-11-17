"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/server/auth/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <Field label="Email" name="email" type="email" autoComplete="email" required autoFocus />
      <Field label="Kata sandi" name="password" type="password" autoComplete="current-password" required />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Memproses…" : "Masuk"}
      </Button>
    </form>
  );
}
