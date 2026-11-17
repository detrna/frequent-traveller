import { redirect } from "next/navigation";
import { ambilPengguna } from "@/server/auth/session";

export default async function Home() {
  redirect((await ambilPengguna()) ? "/dashboard" : "/jadwal");
}
