import type { Metadata } from 'next';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { signOut } from 'next-auth/react';
import AuthButton from '@/components/AuthButton';
import { Outfit, Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const display = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'Loan Ledger',
  description: 'Modern loan management & payment tracking dashboard',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body className="min-h-screen font-sans">
        {/* Ambient background using radial gradients instead of expensive CSS blurs */}
        <div className="fixed inset-0 -z-10 overflow-hidden bg-[#0a0e1a]">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0a0e1a]/0 to-transparent" />
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0a0e1a]/0 to-transparent" />
          <div className="absolute top-[40%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/10 via-[#0a0e1a]/0 to-transparent" />
        </div>

        <nav className="sticky top-0 z-40 bg-[#0a0e1a]/80 backdrop-blur-xl border-b border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link href="/" className="flex items-center gap-2 group">
                  <span className="text-2xl">📒</span>
                  <span className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent tracking-tight group-hover:from-blue-300 group-hover:to-indigo-300 transition-all duration-300">
                    Loan Ledger
                  </span>
                </Link>
                <div className="hidden md:flex ml-10 items-center space-x-1">
                  <Link
                    href="/"
                    className="text-slate-400 hover:text-white hover:bg-white/[0.06] px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/loans/new"
                    className="text-slate-400 hover:text-white hover:bg-white/[0.06] px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  >
                    New Loan
                  </Link>
                  <Link
                    href="/loans/closed"
                    className="text-slate-400 hover:text-white hover:bg-white/[0.06] px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  >
                    Closed Loans
                  </Link>
                  <Link
                    href="/admin/audit"
                    className="text-slate-400 hover:text-white hover:bg-white/[0.06] px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  >
                    Activity
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <AuthButton session={session} />
                <Link
                  href="/loans/new"
                  className="btn-primary flex items-center gap-1.5 text-xs"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                  </svg>
                  Add Loan
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Providers>{children}</Providers>
        </main>
      </body>
    </html>
  );
}
