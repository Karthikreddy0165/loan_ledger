import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import Link from 'next/link';
import {
  calculateReceivedTotal,
  calculateExpectedAmount,
  calculateGap,
  calculateLoanEndDate,
  calculateRemainingDays,
  calculateRemainingInstallments,
  getLoanHealthStatus,
  getLoanProgress,
} from '@/lib/calculations';
import PaymentForm from '@/components/PaymentForm';
import CloseLoanButton from '@/components/CloseLoanButton';
import RecoveryTracker from '@/components/RecoveryTracker';
import { LoanType } from '@prisma/client';

async function getLoan(id: string) {
  const loan = await prisma.loan.findUnique({
    where: { id },
    include: {
      payments: {
        orderBy: { paymentDate: 'desc' },
      },
      recoveryNotes: {
        orderBy: { contactDate: 'desc' },
      },
    },
  });

  if (!loan) return null;
  return loan;
}

export const dynamic = 'force-dynamic';

export default async function LoanDetail(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const loan = await getLoan(params.id);

  if (!loan) {
    notFound();
  }

  const received = calculateReceivedTotal(loan.payments);
  const expected = calculateExpectedAmount(loan);
  const gap = calculateGap(loan);
  const progress = getLoanProgress(loan);
  const isFullyPaid = received >= Number(loan.loanGiven);
  const balance = Math.max(0, Number(loan.loanGiven) - received);
  const loanTypeLabel =
    loan.loanType === LoanType.UNKNOWN ? 'RECOVERY' : loan.loanType;
  const endDate = calculateLoanEndDate(loan);
  const remainingDays = calculateRemainingDays(loan);
  const remainingInstallments = calculateRemainingInstallments(loan);
  const health = getLoanHealthStatus(loan);

  return (
    <div>
      <div className="mb-6">
        <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm transition-colors flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M9.78 4.22a.75.75 0 0 1 0 1.06L7.06 8l2.72 2.72a.75.75 0 1 1-1.06 1.06L5.47 8.53a.75.75 0 0 1 0-1.06l3.25-3.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
          </svg>
          Back to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Loan Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white">{loan.borrower}</h1>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                    loan.status === 'OPEN'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-white/[0.06] text-slate-400 border border-white/[0.08]'
                  }`}>
                    {loan.status}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                    health.color === 'emerald'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : health.color === 'amber'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : health.color === 'red'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : 'bg-white/[0.06] text-slate-400 border border-white/[0.08]'
                  }`}>
                    {health.label}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/loans/${loan.id}/edit`} className="btn-secondary text-sm">
                  Edit
                </Link>
                {loan.status === 'OPEN' && <CloseLoanButton loanId={loan.id} isFullyPaid={isFullyPaid} />}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Loan Type</p>
                <p className="text-lg font-semibold text-slate-200 mt-1">{loanTypeLabel}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Loan Amount</p>
                <p className="text-lg font-semibold text-white mt-1">₹{Number(loan.loanGiven).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Loan Date</p>
                <p className="text-lg font-semibold text-slate-200 mt-1">
                  {loan.loanDate ? format(new Date(loan.loanDate), 'dd MMM yyyy') : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">End Date</p>
                <p className={`text-lg font-semibold mt-1 ${
                  remainingDays !== null && remainingDays < 0 ? 'text-rose-400' : 'text-slate-200'
                }`}>
                  {endDate ? format(endDate, 'dd MMM yyyy') : '-'}
                </p>
                {remainingDays !== null && (
                  <p className={`text-xs mt-0.5 ${
                    remainingDays < 0
                      ? 'text-rose-400'
                      : remainingDays <= 7
                        ? 'text-amber-400'
                        : 'text-emerald-400/70'
                  }`}>
                    {remainingDays < 0
                      ? `${Math.abs(remainingDays)} days overdue`
                      : remainingDays === 0
                        ? 'Due today'
                        : `${remainingDays} days remaining`}
                  </p>
                )}
              </div>
              {(loan.loanType === 'DAILY' || loan.loanType === 'WEEKLY') && (
                <>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Installment Amt</p>
                    <p className="text-lg font-semibold text-slate-200 mt-1">
                      ₹{loan.amountPerInstallment ? Number(loan.amountPerInstallment).toLocaleString() : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Installments</p>
                    <p className="text-lg font-semibold text-slate-200 mt-1">
                      {loan.installmentCount || '-'}
                      {remainingInstallments !== null && (
                        <span className="text-sm text-slate-500 ml-1">
                          ({remainingInstallments} left)
                        </span>
                      )}
                    </p>
                  </div>
                </>
              )}
              {loan.loanType === 'MONTHLY' && (
                <>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Interest Amount</p>
                    <p className="text-lg font-semibold text-slate-200 mt-1">
                      ₹{loan.interestAmount ? Number(loan.interestAmount).toLocaleString() : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Interest Due Date</p>
                    <p className="text-lg font-semibold text-slate-200 mt-1">
                      {loan.interestDueDate ? format(new Date(loan.interestDueDate), 'dd MMM yyyy') : '-'}
                    </p>
                  </div>
                </>
              )}
              {loan.loanType === 'ADJUSTMENT' && loan.adjustmentReturnAmount && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Return Amount</p>
                  <p className="text-lg font-semibold text-slate-200 mt-1">₹{Number(loan.adjustmentReturnAmount).toLocaleString()}</p>
                </div>
              )}
            </div>

            {loan.note && (
              <div className="mt-5 p-3 bg-amber-500/5 rounded-xl border border-amber-500/10">
                <p className="text-sm text-slate-300">
                  <span className="font-medium text-amber-400">Note:</span> {loan.note}
                </p>
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-200 mb-4">Payment Progress</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Received: <span className="text-slate-200 font-medium">₹{received.toLocaleString()}</span></span>
                  <span className={`font-semibold ${
                    progress >= 100 ? 'text-emerald-400' : progress >= 50 ? 'text-blue-400' : 'text-amber-400'
                  }`}>{progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-white/[0.06] rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      progress >= 100
                        ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                        : progress >= 50
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
                          : 'bg-gradient-to-r from-amber-500 to-orange-400'
                    }`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>
              
              {(loan.loanType === 'DAILY' || loan.loanType === 'WEEKLY') && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-white/[0.05]">
                  <div>
                    <p className="text-xs text-slate-500">Expected Till Now</p>
                    <p className="text-xl font-bold text-slate-200 mt-1">₹{expected.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Received</p>
                    <p className="text-xl font-bold text-emerald-400 mt-1">₹{received.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Gap</p>
                    <p className={`text-xl font-bold mt-1 ${gap > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      ₹{gap.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Balance</p>
                    <p className="text-xl font-bold text-slate-200 mt-1">
                      ₹{balance.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment History */}
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-200 mb-4">Payment History</h2>
            {loan.payments.length === 0 ? (
              <p className="text-slate-600 italic text-sm">No payments recorded yet</p>
            ) : (
              <div className="space-y-1">
                {loan.payments.map((payment, index) => (
                  <div
                    key={payment.id}
                    className="flex justify-between items-center py-3 px-3 rounded-lg hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <span className="text-emerald-400 text-xs font-bold">₹</span>
                      </div>
                      <div>
                        <p className="font-medium text-slate-200">₹{Number(payment.amount).toLocaleString()}</p>
                        <p className="text-xs text-slate-500">
                          {format(new Date(payment.paymentDate), 'dd MMM yyyy')}
                        </p>
                      </div>
                    </div>
                    {payment.note && (
                      <p className="text-xs text-slate-500 max-w-[200px] truncate">{payment.note}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recovery Tracker — shown for all loan types */}
          {loan.status === 'OPEN' && (
            <RecoveryTracker loanId={loan.id} />
          )}
        </div>

        {/* Add Payment Form */}
        {loan.status === 'OPEN' && (
          <div className="lg:col-span-1">
            <div className="card sticky top-20">
              <h2 className="text-lg font-semibold text-slate-200 mb-4">Record Payment</h2>
              <PaymentForm loanId={loan.id} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
