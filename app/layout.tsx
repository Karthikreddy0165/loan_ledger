import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import LayoutShell from '@/components/LayoutShell';

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Loan Ledger',
  description: 'Loan management & repayment tracking',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" className={sans.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var stored = localStorage.getItem('theme');
                if (stored === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen font-sans bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 antialiased selection:bg-blue-500/20 selection:text-blue-700 dark:selection:text-blue-300">
        <Providers>
          <LayoutShell session={session}>
            {children}
          </LayoutShell>
        </Providers>
      </body>
    </html>
  );
}
