"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4 relative bg-transparent font-sans">
      {/* Floating Theme Toggle in Top Right */}
      <div className="absolute top-6 right-6 z-50 animate-fade-in-up">
        <ThemeToggle />
      </div>

      {/* Login Card */}
      <div className="w-full max-w-sm bg-white/60 dark:bg-[#111626]/40 border border-black/5 dark:border-white/5 backdrop-blur-xl p-8 rounded-3xl shadow-xl dark:shadow-2xl dark:shadow-black/50 transition-all duration-300 animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 dark:border-blue-500/30 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-sm shadow-blue-500/10">
            <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 dark:text-blue-400">
              <path d="M21 2 12 11"/>
              <path d="m15.5 5.5 3 3"/>
              <path d="M10 11a5 5 0 1 0-7.5 4.3L2 22l7.7-1.5a5 5 0 0 0 4.1-4.1C13.8 14 12 12 10 11Z"/>
              <circle cx="10" cy="11" r="1"/>
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">
            Welcome Back
          </h1>
          <p className="text-slate-500 text-[10px] mt-2 font-bold uppercase tracking-widest">
            Sign in to manage loans
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-center font-bold text-xs tracking-wide">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 dark:text-slate-500">
                <rect width="20" height="16" x="2" y="4" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-100/60 dark:bg-slate-950/60 border border-black/5 dark:border-white/5 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-sm"
              placeholder="admin@ledger.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 dark:text-slate-500">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-100/60 dark:bg-slate-950/60 border border-black/5 dark:border-white/5 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-sm"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 active:scale-[0.98] mt-2 text-xs uppercase tracking-widest cursor-pointer"
          >
            {loading ? "Verifying..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
