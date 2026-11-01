import { prisma } from '@/lib/prisma';
import { LoanType } from '@prisma/client';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { addDays, addWeeks } from 'date-fns';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isDemoSession } from '@/lib/permissions';
import { ArrowLeft, Lock, AlertCircle, Save } from 'lucide-react';

async function getLoan(id: string) {
  const loan = await prisma.loan.findUnique({
    where: { id },
  });
  if (!loan) return null;
  return loan;
}

async function updateLoan(id: string, formData: FormData) {
  'use server';

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login');
  }

  if (isDemoSession(session)) {
    redirect(`/loans/${id}?error=demo_readonly`);
  }

  const borrower = String(formData.get('borrower') || '').trim();
  const loanType = String(formData.get('loanType') || 'DAILY') as LoanType;
  const loanGiven = Number(formData.get('loanGiven') || 0);
  const loanDateRaw = formData.get('loanDate') as string | null;
  const installmentCountRaw = formData.get('installmentCount') as string | null;
  const amountPerInstallmentRaw = formData.get('amountPerInstallment') as string | null;
  const expectedReturnDateRaw = formData.get('expectedReturnDate') as string | null;
  const interestAmountRaw = formData.get('interestAmount') as string | null;
  const interestDueDateRaw = formData.get('interestDueDate') as string | null;
  const adjustmentReturnAmountRaw = formData.get('adjustmentReturnAmount') as string | null;
  const adjustmentReturnDateRaw = formData.get('adjustmentReturnDate') as string | null;
  const noteRaw = formData.get('note') as string | null;

  if (!borrower || !loanGiven || isNaN(loanGiven)) {
    throw new Error('Borrower and loan amount are required');
  }

  const loanDate = loanDateRaw ? new Date(loanDateRaw) : null;
  const expectedReturnDate =
    expectedReturnDateRaw
      ? new Date(expectedReturnDateRaw)
      : loanDate && installmentCountRaw
        ? loanType === 'DAILY'
          ? addDays(loanDate, Number(installmentCountRaw))
          : loanType === 'WEEKLY'
            ? addWeeks(loanDate, Number(installmentCountRaw))
            : null
        : null;

  await prisma.loan.update({
    where: { id },
    data: {
      borrower,
      loanType,
      loanGiven,
      loanDate,
      installmentCount: installmentCountRaw ? Number(installmentCountRaw) : null,
      amountPerInstallment: amountPerInstallmentRaw ? Number(amountPerInstallmentRaw) : null,
      expectedReturnDate,
      interestAmount: interestAmountRaw ? Number(interestAmountRaw) : null,
      interestDueDate: interestDueDateRaw ? new Date(interestDueDateRaw) : null,
      adjustmentReturnAmount: adjustmentReturnAmountRaw ? Number(adjustmentReturnAmountRaw) : null,
      adjustmentReturnDate: adjustmentReturnDateRaw ? new Date(adjustmentReturnDateRaw) : null,
      note: noteRaw && noteRaw.trim() ? noteRaw.trim() : null,
      updatedById: (session.user as any).id,
    },
  });

  redirect(`/loans/${id}`);
}

export default async function EditLoanPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;
  const loan = await getLoan(id);

  if (!loan) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  const isDemo = isDemoSession(session);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Edit Loan Parameters</h1>
          <p className="text-slate-500 text-xs mt-1">
            Reconfigure terms for {loan.borrower}
          </p>
        </div>
        <Link
          href={`/loans/${loan.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>
      </div>

      {isDemo && (
        <div className="p-3.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-slate-500 shrink-0" />
          <p className="text-slate-600 dark:text-slate-400">
            View-Only Mode: You can view loan parameters, but saving changes is disabled for the test account.
          </p>
        </div>
      )}

      <div className="card">
        <form action={updateLoan.bind(null, loan.id)} className="space-y-4">
          <div>
            <label className="label">Borrower Name *</label>
            <input
              name="borrower"
              type="text"
              className="input"
              required
              defaultValue={loan.borrower}
              disabled={isDemo}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Loan Type *</label>
              <select
                name="loanType"
                className="input"
                defaultValue={loan.loanType}
                required
                disabled={isDemo}
              >
                <option value="DAILY">Daily Micro-Loan</option>
                <option value="WEEKLY">Weekly Loan</option>
                <option value="MONTHLY">Monthly (Interest)</option>
                <option value="ADJUSTMENT">Adjustment / Fixed Return</option>
                <option value="UNKNOWN">Recovery</option>
              </select>
            </div>
            <div>
              <label className="label">Loan Amount (₹) *</label>
              <input
                name="loanGiven"
                type="number"
                min="0"
                className="input"
                required
                defaultValue={Number(loan.loanGiven)}
                disabled={isDemo}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Disbursal Date</label>
              <input
                name="loanDate"
                type="date"
                className="input"
                defaultValue={
                  loan.loanDate
                    ? new Date(loan.loanDate).toISOString().split('T')[0]
                    : ''
                }
                disabled={isDemo}
              />
            </div>
            <div>
              <label className="label">Expected Maturity Date</label>
              <input
                name="expectedReturnDate"
                type="date"
                className="input"
                defaultValue={
                  loan.expectedReturnDate
                    ? new Date(loan.expectedReturnDate).toISOString().split('T')[0]
                    : ''
                }
                disabled={isDemo}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Installment Count (Daily / Weekly)</label>
              <input
                name="installmentCount"
                type="number"
                min="0"
                className="input"
                defaultValue={loan.installmentCount ?? ''}
                disabled={isDemo}
              />
            </div>
            <div>
              <label className="label">Amount Per Installment (₹)</label>
              <input
                name="amountPerInstallment"
                type="number"
                min="0"
                className="input"
                defaultValue={loan.amountPerInstallment ? Number(loan.amountPerInstallment) : ''}
                disabled={isDemo}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Interest Amount (Monthly)</label>
              <input
                name="interestAmount"
                type="number"
                min="0"
                className="input"
                defaultValue={loan.interestAmount ? Number(loan.interestAmount) : ''}
                disabled={isDemo}
              />
            </div>
            <div>
              <label className="label">Interest Due Date</label>
              <input
                name="interestDueDate"
                type="date"
                className="input"
                defaultValue={
                  loan.interestDueDate
                    ? new Date(loan.interestDueDate).toISOString().split('T')[0]
                    : ''
                }
                disabled={isDemo}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Adjustment Return Amount</label>
              <input
                name="adjustmentReturnAmount"
                type="number"
                min="0"
                className="input"
                defaultValue={
                  loan.adjustmentReturnAmount ? Number(loan.adjustmentReturnAmount) : ''
                }
                disabled={isDemo}
              />
            </div>
            <div>
              <label className="label">Adjustment Return Date</label>
              <input
                name="adjustmentReturnDate"
                type="date"
                className="input"
                defaultValue={
                  loan.adjustmentReturnDate
                    ? new Date(loan.adjustmentReturnDate).toISOString().split('T')[0]
                    : ''
                }
                disabled={isDemo}
              />
            </div>
          </div>

          <div>
            <label className="label">Underwriting Remarks</label>
            <textarea
              name="note"
              rows={3}
              className="input"
              defaultValue={loan.note ?? ''}
              disabled={isDemo}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Link href={`/loans/${loan.id}`} className="btn-secondary">
              Back to Account
            </Link>
            {!isDemo && (
              <button type="submit" className="btn-primary">
                <Save className="w-4 h-4" />
                <span>Save Loan Changes</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
