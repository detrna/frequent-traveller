import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verifikasiKredensial } from "@/server/services/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Di Vercel host otomatis dipercaya. Lokal (dev) dipercaya di sini; di host produksi lain set AUTH_TRUST_HOST=true.
  trustHost: process.env.NODE_ENV !== "production" ? true : undefined,
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: (masukan) => verifikasiKredensial(masukan),
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
});
