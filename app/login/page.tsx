"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import {
  Wallet,
  Video,
  ArrowRight,
  Mail,
  Lock,
  AlertCircle,
  Copy,
  Check,
  CalendarCheck,
  TrendingDown,
  ShieldCheck
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const testEmail = "test@example.com";
  const testPassword = "Passw0rd!";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError("Invalid email or password.");
        setLoading(false);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred during sign in.");
      setLoading(false);
    }
  };

  const handleQuickDemoSignIn = async () => {
    setEmail(testEmail);
    setPassword(testPassword);
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: testEmail,
        password: testPassword,
      });

      if (res?.error) {
        setError("Login failed. Please verify credentials.");
        setLoading(false);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      setError("An error occurred during sign in.");
      setLoading(false);
    }
  };

  const copyCredentials = () => {
    navigator.clipboard.writeText(`Email: ${testEmail}\nPassword: ${testPassword}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full min-h-screen flex flex-col justify-center items-center px-4 py-8 relative bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 font-sans">
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Embedded Walkthrough Video & Core System Highlights */}
        <div className="lg:col-span-7 space-y-5">
          <div>
            <div className="mb-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Loan Ledger
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Loan book management, schedule tracking, and recovery workflow.
            </p>
          </div>

          {/* Embedded YouTube Iframe */}
          <div className="card p-3 overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Video className="w-3.5 h-3.5 text-rose-500" />
                <span>Walkthrough Video</span>
              </div>
              <span className="text-[11px] text-slate-400">
                Full Walkthrough & Architecture
              </span>
            </div>

            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-slate-200 dark:border-slate-800">
              <iframe
                src="https://www.youtube-nocookie.com/embed/PTNaDfRTGJ8?rel=0"
                title="Loan Ledger Walkthrough"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>

          {/* System Highlights Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="card p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <CalendarCheck className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold">Installment Engine</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-snug">
                Daily, weekly, and monthly accruals with exact maturity calculation.
              </p>
            </div>

            <div className="card p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                <TrendingDown className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold">Follow-up Gap</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-snug">
                Deficit tracking: expected payments minus actual cash received.
              </p>
            </div>

            <div className="card p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold">Recovery & Logs</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-snug">
                Timeline contact notes, overdue reminders, and immutable audit trails.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Sign-in & Test Credentials */}
        <div className="lg:col-span-5">
          <div className="card p-6 shadow-sm space-y-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Sign In
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter your credentials or use the test account below
              </p>
            </div>

            {/* Test Credentials Box */}
            <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Test User Credentials (View Access)
                </span>
                <button
                  type="button"
                  onClick={copyCredentials}
                  className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-xs font-mono space-y-1 text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Email:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{testEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span>Password:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{testPassword}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleQuickDemoSignIn}
                disabled={loading}
                className="w-full btn-primary text-xs py-2"
              >
                <span>{loading ? "Signing In..." : "1-Click Sign In with Test User"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
              <span className="flex-shrink mx-3 text-[11px] text-slate-400 uppercase tracking-wider">
                Or Sign In Manually
              </span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
            </div>

            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-9"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pl-9"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-xs"
              >
                {loading ? "Authenticating..." : "Sign In"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
