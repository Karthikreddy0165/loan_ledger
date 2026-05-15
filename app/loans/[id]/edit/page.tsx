import { prisma } from '@/lib/prisma';
import { LoanType } from '@prisma/client';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { addDays, addWeeks } from 'date-fns';

async function getLoan(id: string) {
  const loan = await prisma.loan.findUnique({
    where: { id },
  });
  if (!loan) return null;
  return loan;
}

async function updateLoan(id: string, formData: FormData) {
  'use server';

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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Edit Loan</h1>
          <p className="text-slate-500 text-xs mt-1">
            Update details for {loan.borrower}
          </p>
        </div>
        <Link href={`/loans/${loan.id}`} className="text-blue-400 hover:text-blue-300 text-sm transition-colors flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M9.78 4.22a.75.75 0 0 1 0 1.06L7.06 8l2.72 2.72a.75.75 0 1 1-1.06 1.06L5.47 8.53a.75.75 0 0 1 0-1.06l3.25-3.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
          </svg>
          Back to Loan
        </Link>
      </div>

      <div className="card max-w-2xl">
        <form action={updateLoan.bind(null, loan.id)} className="space-y-5">
          <div>
            <label className="label">Borrower *</label>
            <input
              name="borrower"
              type="text"
              className="input"
              required
              defaultValue={loan.borrower}
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
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly (Interest)</option>
                <option value="ADJUSTMENT">Adjustment / Recovery</option>
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
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Loan Date</label>
              <input
                name="loanDate"
                type="date"
                className="input"
                defaultValue={
                  loan.loanDate
                    ? new Date(loan.loanDate).toISOString().split('T')[0]
                    : ''
                }
              />
            </div>
            <div>
              <label className="label">Expected Return Date</label>
              <input
                name="expectedReturnDate"
                type="date"
                className="input"
                defaultValue={
                  loan.expectedReturnDate
                    ? new Date(loan.expectedReturnDate).toISOString().split('T')[0]
                    : ''
                }
              />
              <p className="text-[10px] text-slate-600 mt-1">Auto-calculated from installments if left empty</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Installment Count</label>
              <input
                name="installmentCount"
                type="number"
                min="0"
                className="input"
                defaultValue={loan.installmentCount ?? ''}
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
              />
            </div>
          </div>

          <div>
            <label className="label">Note</label>
            <textarea
              name="note"
              rows={3}
              className="input"
              defaultValue={loan.note ?? ''}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-white/[0.05]">
            <Link href={`/loans/${loan.id}`} className="btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
