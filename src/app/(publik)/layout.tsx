import { AppHeader } from "@/components/layout/app-header";
import { ambilPengguna } from "@/server/auth/session";

/** Halaman publik (US10-a): terbuka untuk tamu; bila sudah login, menu peran tetap tampil. */
export default async function PublikLayout({ children }: LayoutProps<"/">) {
  const pengguna = await ambilPengguna();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppHeader pengguna={pengguna} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
