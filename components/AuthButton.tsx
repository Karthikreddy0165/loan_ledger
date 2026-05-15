"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";

export default function AuthButton({ session }: { session: any }) {
  if (session) {
    return (
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex flex-col items-end">
          <p className="text-xs font-semibold text-white">{session.user?.name || session.user?.email}</p>
          <p className="text-[10px] text-slate-500 capitalize">{session.user?.email}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-slate-400 hover:text-white text-xs font-medium transition-colors"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="text-slate-400 hover:text-white text-xs font-medium transition-colors"
    >
      Login
    </Link>
  );
}
