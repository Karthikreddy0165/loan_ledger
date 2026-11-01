'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CheckCircle2, Lock } from 'lucide-react';

export default function CloseLoanButton({
  loanId,
  isFullyPaid,
}: {
  loanId: string;
  isFullyPaid: boolean;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const isDemo = Boolean(session?.user?.isDemo || session?.user?.email?.toLowerCase() === 'test@example.com');
  const [isLoading, setIsLoading] = useState(false);

  if (isDemo) {
    return (
      <button
        disabled
        className="btn-secondary text-xs opacity-60 cursor-not-allowed flex items-center gap-1.5"
        title="Closing loans is disabled in demo mode"
      >
        <Lock className="w-3.5 h-3.5 text-slate-400" />
        <span>Close Loan (Disabled)</span>
      </button>
    );
  }

  const handleClose = async () => {
    const message = isFullyPaid
      ? 'Mark this loan as closed? This loan is fully paid.'
      : 'This loan is NOT fully paid yet. Are you sure you want to close it anyway?';

    if (!confirm(message)) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/loans/${loanId}/close`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to close loan');
      }

      router.push('/');
      router.refresh();
    } catch (error: any) {
      alert(error.message || 'Failed to close loan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClose}
      disabled={isLoading}
      className="btn-danger text-xs disabled:opacity-50 flex items-center gap-1.5"
    >
      <CheckCircle2 className="w-3.5 h-3.5" />
      <span>{isLoading ? 'Closing...' : 'Close Loan'}</span>
    </button>
  );
}
