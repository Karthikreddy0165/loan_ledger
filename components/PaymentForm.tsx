'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Lock, PlusCircle, AlertCircle } from 'lucide-react';

interface PaymentFormProps {
  loanId: string;
  onSuccess?: () => void;
}

export default function PaymentForm({ loanId, onSuccess }: PaymentFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const isDemo = Boolean(session?.user?.isDemo || session?.user?.email?.toLowerCase() === 'test@example.com');

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (isDemo) {
    return (
      <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-xs">
          <Lock className="w-3.5 h-3.5" />
          <span>Demo Access (View Only)</span>
        </div>
        <p className="text-xs text-slate-500">
          Payment recording is disabled in recruiter demo mode to protect live portfolio ledgers.
        </p>
      </div>
    );
  }

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
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to add payment');
      }

      setAmount('');
      setNote('');
      router.refresh();
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="label">Payment Amount (₹) *</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input flex-1"
            placeholder="e.g. 500"
            required
            disabled={isSubmitting}
          />
          <button
            type="button"
            className="btn-secondary text-xs px-2.5 py-1"
            onClick={() => setAmount('100')}
            disabled={isSubmitting}
          >
            +100
          </button>
          <button
            type="button"
            className="btn-secondary text-xs px-2.5 py-1"
            onClick={() => setAmount('500')}
            disabled={isSubmitting}
          >
            +500
          </button>
          <button
            type="button"
            className="btn-secondary text-xs px-2.5 py-1"
            onClick={() => setAmount('1000')}
            disabled={isSubmitting}
          >
            +1000
          </button>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          Timestamped to today automatically.
        </p>
      </div>

      <div>
        <label className="label">Note (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="input"
          placeholder="Cash handover, UPI reference, or remarks"
          rows={2}
          disabled={isSubmitting}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !amount}
        className="btn-primary w-full disabled:opacity-50 text-xs"
      >
        <PlusCircle className="w-4 h-4" />
        <span>{isSubmitting ? 'Recording...' : 'Record Payment'}</span>
      </button>
    </form>
  );
}
