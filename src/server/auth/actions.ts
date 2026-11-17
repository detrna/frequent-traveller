"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/server/auth";
import { HOME_PATH } from "@/server/auth/roles";
import { GalatValidasi, pesanUntukPengguna } from "@/server/errors";
import { daftarPengguna } from "@/server/services/auth";

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

export interface DaftarState {
  /** Pesan galat per kolom, mis. { email: "Email sudah terdaftar." }. */
  galat?: Record<string, string>;
  /** Galat umum yang tidak terkait satu kolom. */
  error?: string;
  /** Isian yang dikembalikan agar form tidak kosong; kata sandi tidak pernah dikembalikan. */
  nilai?: { nama: string; email: string };
}

/** Mendaftarkan akun Pengguna lalu langsung masuk (US10-b); callbackUrl dihormati agar pemesanan dapat dilanjutkan (US10-c). */
export async function daftarAction(_prev: DaftarState, formData: FormData): Promise<DaftarState> {
  const teks = (nama: string) => (typeof formData.get(nama) === "string" ? (formData.get(nama) as string) : "");
  const masukan = { nama: teks("nama"), email: teks("email"), password: teks("password"), konfirmasi: teks("konfirmasi") };
  const nilai = { nama: masukan.nama, email: masukan.email };

  try {
    await daftarPengguna(masukan);
  } catch (error) {
    if (error instanceof GalatValidasi) return { galat: error.galat, nilai };
    return { error: pesanUntukPengguna(error), nilai };
  }

  try {
    await signIn("credentials", { email: masukan.email, password: masukan.password, redirectTo: jalurAman(formData.get("callbackUrl")) });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Akun dibuat, tetapi masuk otomatis gagal. Silakan masuk secara manual.", nilai };
    throw error; // redirect() dari signIn
  }
  return {};
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
