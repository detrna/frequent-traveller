import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { putuskanAkses } from "@/server/auth/roles";

export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const keputusan = putuskanAkses(pathname, req.auth?.user?.role);

  switch (keputusan) {
    case "ke-login": {
      const url = new URL("/login", req.nextUrl);
      url.searchParams.set("callbackUrl", pathname + search);
      return NextResponse.redirect(url);
    }
    case "ke-beranda":
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    case "ditolak":
      return NextResponse.redirect(new URL("/akses-ditolak", req.nextUrl));
    default:
      return NextResponse.next();
  }
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
