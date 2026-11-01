"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Session } from 'next-auth';
import AuthButton from './AuthButton';
import ThemeToggle from './ThemeToggle';
import {
  Wallet,
  LayoutDashboard,
  PlusCircle,
  Archive,
  Activity,
} from 'lucide-react';

interface NavbarProps {
  session: Session | null;
}

export default function Navbar({ session }: NavbarProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) return null;

  const isDemo = Boolean(session?.user?.isDemo || session?.user?.email?.toLowerCase() === "test@example.com");

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/loans/new', label: 'New Loan', icon: PlusCircle },
    { href: '/loans/closed', label: 'Closed Loans', icon: Archive },
    { href: '/admin/audit', label: 'Activity Logs', icon: Activity },
  ];

  return (
    <nav className="sticky top-0 z-40 bg-white/80 dark:bg-[#090d16]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex justify-between h-15 items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center group py-1">
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Loan Ledger
              </span>
            </Link>

            {session && (
              <div className="hidden md:flex items-center space-x-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
            <AuthButton session={session} />
            {session && !isDemo && (
              <Link
                href="/loans/new"
                className="btn-primary text-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add Loan</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
