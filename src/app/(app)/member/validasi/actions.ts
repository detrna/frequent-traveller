"use server";

import { redirect } from "next/navigation";
import { wajibBisa } from "@/server/auth/session";
import { pesanUntukPengguna } from "@/server/errors";
import { validasiTiket } from "@/server/services/tiket";

/** Halaman Validasi Tiket → Memeriksa Kelengkapan Profil → Memvalidasi Tiket (SQ10). */
export async function validasiTiketAction(formData: FormData) {
  const member = await wajibBisa("member.fitur");
  const tiketId = String(formData.get("tiketId") ?? "");
  let hasil;
  try {
    hasil = await validasiTiket(member.id, tiketId);
  } catch (error) {
    redirect(`/member/validasi?galat=${encodeURIComponent(pesanUntukPengguna(error))}&tiket=${encodeURIComponent(tiketId)}`);
  }
  redirect(`/member/validasi?berhasil=${encodeURIComponent(hasil.tiket.nomorTiket)}`);
}
