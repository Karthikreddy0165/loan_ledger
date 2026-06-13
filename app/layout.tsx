import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Outfit, Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import LayoutShell from '@/components/LayoutShell';

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
    <html lang="en" className={`${sans.variable} ${display.variable} dark`} suppressHydrationWarning>
      <body className="min-h-screen font-sans bg-zinc-50 dark:bg-[#0a0e1a] text-slate-900 dark:text-slate-100 transition-colors duration-300">
        {/* Ambient background using radial gradients instead of expensive CSS blurs */}
        <div className="fixed inset-0 -z-10 overflow-hidden bg-zinc-50 dark:bg-[#0a0e1a] transition-colors duration-300">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,0,0,0.02)_0%,_transparent_70%)] dark:hidden pointer-events-none" />
          <div className="hidden dark:block">
            <div className="absolute top-[-20%] left-[-10%].w-[50%].h-[50%] rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0a0e1a]/0 to-transparent" />
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0a0e1a]/0 to-transparent" />
            <div className="absolute top-[40%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/10 via-[#0a0e1a]/0 to-transparent" />
          </div>
        </div>

        <Providers>
          <LayoutShell session={session}>
            {children}
          </LayoutShell>
        </Providers>
      </body>
    </html>
  );
}
