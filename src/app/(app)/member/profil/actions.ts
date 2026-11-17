"use server";

import { revalidatePath } from "next/cache";
import { wajibBisa } from "@/server/auth/session";
import { pesanUntukPengguna } from "@/server/errors";
import { perbaruiProfil, KOLOM_PROFIL } from "@/server/services/profil";

export interface ProfilState {
  galat?: Record<string, string>;
  pesanGalat?: string;
  tersimpan?: boolean;
  /** Nilai yang dikirim, agar form tidak kehilangan isian saat ada galat. */
  nilai?: Record<string, string>;
}

/** Halaman Profil → Validasi Input Profil → Memperbarui Data Profil (SQ09). */
export async function simpanProfilAction(_prev: ProfilState, formData: FormData): Promise<ProfilState> {
  const member = await wajibBisa("member.fitur");
  const masukan = Object.fromEntries(KOLOM_PROFIL.map((k) => [k, String(formData.get(k) ?? "")]));
  try {
    const hasil = await perbaruiProfil(member.id, masukan);
    if (!hasil.ok) return { galat: hasil.galat, nilai: masukan };
  } catch (error) {
    return { pesanGalat: pesanUntukPengguna(error), nilai: masukan };
  }
  revalidatePath("/member/profil");
  return { tersimpan: true };
}
