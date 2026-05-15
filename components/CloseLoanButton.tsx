'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CloseLoanButton({
  loanId,
  isFullyPaid,
}: {
  loanId: string;
  isFullyPaid: boolean;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

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
        throw new Error('Failed to close loan');
      }

      router.push('/');
      router.refresh();
    } catch (error) {
      alert('Failed to close loan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClose}
      disabled={isLoading}
      className="btn-danger text-sm disabled:opacity-50"
    >
      {isLoading ? 'Closing...' : 'Close Loan'}
    </button>
  );
}
