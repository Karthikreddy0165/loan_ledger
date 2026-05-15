'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PaymentFormProps {
  loanId: string;
  onSuccess?: () => void;
}

export default function PaymentForm({ loanId, onSuccess }: PaymentFormProps) {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/loans/${loanId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          note: note || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add payment');
      }

      setAmount('');
      setNote('');
      router.refresh();
      onSuccess?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="label">Amount *</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input flex-1"
            placeholder="Enter amount"
            required
            disabled={isSubmitting}
          />
          <button
            type="button"
            className="btn-secondary text-xs px-2 py-1"
            onClick={() => setAmount('100')}
            disabled={isSubmitting}
          >
            +100
          </button>
          <button
            type="button"
            className="btn-secondary text-xs px-2 py-1"
            onClick={() => setAmount('500')}
            disabled={isSubmitting}
          >
            +500
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Today&apos;s date is used automatically.
        </p>
      </div>

      <div>
        <label className="label">Note (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="input"
          rows={2}
          disabled={isSubmitting}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-full disabled:opacity-50"
      >
        {isSubmitting ? 'Adding...' : 'Add Payment'}
      </button>
    </form>
  );
}
