"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Session } from 'next-auth';
import AuthButton from './AuthButton';
import ThemeToggle from './ThemeToggle';

interface NavbarProps {
  session: Session | null;
}

export default function Navbar({ session }: NavbarProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) return null;

  return (
    <nav className="sticky top-0 z-40 bg-white/70 dark:bg-[#0a0e1a]/80 backdrop-blur-xl border-b border-white/[0.06] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl">📒</span>
              <span className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent tracking-tight group-hover:from-blue-300 group-hover:to-indigo-300 transition-all duration-300">
                Loan Ledger
              </span>
            </Link>
            
            {session && (
              <div className="hidden md:flex ml-10 items-center space-x-1">
                <Link
                  href="/"
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.06] px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                >
                  Dashboard
                </Link>
                <Link
                  href="/loans/new"
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.06] px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                >
                  New Loan
                </Link>
                <Link
                  href="/loans/closed"
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.06] px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                >
                  Closed Loans
                </Link>
                <Link
                  href="/admin/audit"
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.06] px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                >
                  Activity
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <AuthButton session={session} />
            {session && (
              <Link
                href="/loans/new"
                className="btn-primary flex items-center gap-1.5 text-xs"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                </svg>
                Add Loan
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
