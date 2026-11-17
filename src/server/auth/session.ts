import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { can, type Ability, type Role } from "@/server/auth/roles";

export interface SesiPengguna {
  id: string;
  nama: string;
  email: string;
  role: Role;
}

/** Pengguna yang sedang login, atau null. */
export async function ambilPengguna(): Promise<SesiPengguna | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    nama: session.user.name ?? "",
    email: session.user.email ?? "",
    role: session.user.role,
  };
}

/** Wajib login; bila tidak, arahkan ke halaman login. */
export async function wajibLogin(): Promise<SesiPengguna> {
  const pengguna = await ambilPengguna();
  if (!pengguna) redirect("/login");
  return pengguna;
}

/** Wajib login dan memiliki kemampuan tertentu. Dipanggil di dalam server action/service, bukan hanya di proxy. */
export async function wajibBisa(ability: Ability): Promise<SesiPengguna> {
  const pengguna = await wajibLogin();
  if (!can(pengguna.role, ability)) redirect("/akses-ditolak");
  return pengguna;
}
