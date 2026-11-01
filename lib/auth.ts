import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const DEMO_USER_EMAIL = "test@example.com";

export function isDemoEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === DEMO_USER_EMAIL.toLowerCase();
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.trim().toLowerCase() }
          });
          if (!user) return null;
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          if (!isPasswordValid) return null;

          const isDemo = isDemoEmail(user.email);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            isDemo,
            role: isDemo ? 'demo' : 'admin'
          };
        } catch (err) {
          console.error("Auth Error (Loan):", err);
          return null;
        }
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isDemo = user.isDemo ?? isDemoEmail(user.email);
        token.role = user.role ?? (token.isDemo ? 'demo' : 'admin');
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || '';
        session.user.isDemo = Boolean(token.isDemo || isDemoEmail(session.user.email));
        session.user.role = (token.role as string) || (session.user.isDemo ? 'demo' : 'admin');
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  session: { 
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};
