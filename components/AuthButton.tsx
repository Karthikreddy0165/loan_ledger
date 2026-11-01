"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { LogOut } from "lucide-react";

export default function AuthButton({ session }: { session: any }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut({ redirect: false });
    } catch (err) {
      console.error("Sign out error:", err);
    }
    window.location.href = "/login";
  };

  if (session) {
    const isDemo = Boolean(session.user?.isDemo || session.user?.email?.toLowerCase() === "test@example.com");

    return (
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col items-end leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              {session.user?.name || "User"}
            </span>
            {isDemo && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                View Only
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500 truncate max-w-[140px]">
            {session.user?.email}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          disabled={isLoggingOut}
          className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
          title="Sign out"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="btn-primary text-xs"
    >
      Sign In
    </Link>
  );
}
