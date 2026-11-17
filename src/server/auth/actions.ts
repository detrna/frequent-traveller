"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/server/auth";
import { HOME_PATH } from "@/server/auth/roles";

export interface LoginState {
  error?: string;
}

/** Hanya menerima jalur internal untuk callbackUrl agar tidak menjadi open redirect. */
function jalurAman(nilai: FormDataEntryValue | null): string {
  const jalur = typeof nilai === "string" ? nilai : "";
  return jalur.startsWith("/") && !jalur.startsWith("//") ? jalur : HOME_PATH;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: jalurAman(formData.get("callbackUrl")),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email atau kata sandi salah." };
    }
    throw error; // redirect() dari signIn juga dilempar sebagai error; biarkan Next menanganinya
  }
  return {};
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
