"use client";

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import DemoBanner from './DemoBanner';
import { Session } from 'next-auth';

interface LayoutShellProps {
  children: React.ReactNode;
  session: Session | null;
}

export default function LayoutShell({ children, session }: LayoutShellProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <>
      {!isLoginPage && <DemoBanner />}
      <Navbar session={session} />
      {isLoginPage ? (
        <div className="min-h-screen flex items-center justify-center w-full">
          {children}
        </div>
      ) : (
        <main className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6">
          {children}
        </main>
      )}
    </>
  );
}
