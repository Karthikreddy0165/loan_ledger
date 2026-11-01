import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isDemoSession } from '@/lib/permissions';
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
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  IndianRupee,
  Edit,
  Lock,
  CreditCard
} from 'lucide-react';

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

  const session = await getServerSession(authOptions);
  const isDemo = isDemoSession(session);

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        {isDemo && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1">
            <Lock className="w-3.5 h-3.5" />
            View-Only Mode
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {loan.borrower}
                  </h1>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    loan.status === 'OPEN'
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}>
                    {loan.status}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    health.color === 'emerald'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50'
                      : health.color === 'amber'
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50'
                        : health.color === 'red'
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}>
                    {health.label}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/loans/${loan.id}/edit`}
                  className="btn-secondary text-xs flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isDemo ? 'View' : 'Edit'}</span>
                </Link>
                {loan.status === 'OPEN' && (
                  <CloseLoanButton loanId={loan.id} isFullyPaid={isFullyPaid} />
                )}
              </div>
            </div>

            {/* Account Specs Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              <div>
                <p className="label">Loan Type</p>
                <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{loanTypeLabel}</p>
              </div>
              <div>
                <p className="label">Loan Amount</p>
                <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">₹{Number(loan.loanGiven).toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="label">Loan Date</p>
                <p className="text-base font-medium text-slate-700 dark:text-slate-300 mt-0.5">
                  {loan.loanDate ? format(new Date(loan.loanDate), 'dd MMM yyyy') : '-'}
                </p>
              </div>
              <div>
                <p className="label">End Date</p>
                <p className={`text-base font-bold mt-0.5 ${
                  remainingDays !== null && remainingDays < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                }`}>
                  {endDate ? format(endDate, 'dd MMM yyyy') : '-'}
                </p>
                {remainingDays !== null && (
                  <p className={`text-[11px] mt-0.5 font-medium ${
                    remainingDays < 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : remainingDays <= 7
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-emerald-600 dark:text-emerald-400'
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
                    <p className="label">Installment Amount</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      ₹{loan.amountPerInstallment ? Number(loan.amountPerInstallment).toLocaleString('en-IN') : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="label">Installments</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {loan.installmentCount || '-'}
                      {remainingInstallments !== null && (
                        <span className="text-xs text-slate-500 font-normal ml-1.5">
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
                    <p className="label">Interest Amount</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      ₹{loan.interestAmount ? Number(loan.interestAmount).toLocaleString('en-IN') : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="label">Interest Due Date</p>
                    <p className="text-base font-medium text-slate-700 dark:text-slate-300 mt-0.5">
                      {loan.interestDueDate ? format(new Date(loan.interestDueDate), 'dd MMM yyyy') : '-'}
                    </p>
                  </div>
                </>
              )}

              {loan.loanType === 'ADJUSTMENT' && loan.adjustmentReturnAmount && (
                <div>
                  <p className="label">Return Amount</p>
                  <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    ₹{Number(loan.adjustmentReturnAmount).toLocaleString('en-IN')}
                  </p>
                </div>
              )}
            </div>

            {loan.note && (
              <div className="mt-5 p-3.5 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/40 text-xs">
                <p className="text-amber-900 dark:text-amber-300">
                  <span className="font-bold">Note:</span> {loan.note}
                </p>
              </div>
            )}
          </div>

          {/* Payment Progress */}
          <div className="card">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Payment Progress</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    Received: <span className="text-slate-900 dark:text-white font-bold">₹{received.toLocaleString('en-IN')}</span>
                  </span>
                  <span className={`font-bold ${
                    progress >= 100 ? 'text-emerald-600 dark:text-emerald-400' : progress >= 50 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'
                  }`}>{progress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      progress >= 100
                        ? 'bg-emerald-500'
                        : progress >= 50
                          ? 'bg-blue-600'
                          : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-[11px] text-slate-500 font-semibold uppercase">Expected Till Now</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">₹{expected.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 font-semibold uppercase">Received</p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">₹{received.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 font-semibold uppercase">Gap</p>
                  <p className="mt-1">
                    {gap > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-base font-bold font-mono bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
                        ₹{gap.toLocaleString('en-IN')}
                      </span>
                    ) : (
                      <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        On Track
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500 font-semibold uppercase">Balance</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                    ₹{balance.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="card">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Payment History</h2>
            {loan.payments.length === 0 ? (
              <p className="text-slate-500 italic text-xs">No payments recorded yet</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {loan.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex justify-between items-center py-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100">
                          ₹{Number(payment.amount).toLocaleString('en-IN')}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {format(new Date(payment.paymentDate), 'dd MMM yyyy')}
                        </p>
                      </div>
                    </div>
                    {payment.note && (
                      <p className="text-slate-500 text-xs italic max-w-[200px] truncate">{payment.note}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recovery Tracker */}
          {loan.status === 'OPEN' && (
            <RecoveryTracker loanId={loan.id} />
          )}
        </div>

        {/* Action Sidebar */}
        {loan.status === 'OPEN' && (
          <div className="lg:col-span-1">
            <div className="card sticky top-20">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Record Payment</h2>
              <PaymentForm loanId={loan.id} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
