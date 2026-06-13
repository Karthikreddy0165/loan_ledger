"use client";

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
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
      <Navbar session={session} />
      {isLoginPage ? (
        <div className="min-h-screen flex items-center justify-center w-full transition-colors duration-300">
          {children}
        </div>
      ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-300">
          {children}
        </main>
      )}
    </>
  );
}
