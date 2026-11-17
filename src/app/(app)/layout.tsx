import { AppHeader } from "@/components/layout/app-header";
import { wajibLogin } from "@/server/auth/session";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const pengguna = await wajibLogin();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppHeader pengguna={pengguna} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
