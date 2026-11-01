import { prisma } from '@/lib/prisma';
import { LoanStatus } from '@prisma/client';
import Link from 'next/link';
import { format } from 'date-fns';
import { calculateReceivedTotal } from '@/lib/calculations';
import { Archive, ArrowLeft, CheckCircle2 } from 'lucide-react';

async function getClosedLoans() {
  return await prisma.loan.findMany({
    where: { status: LoanStatus.CLOSED },
    include: { payments: true },
    orderBy: { updatedAt: 'desc' },
  });
}

export const dynamic = 'force-dynamic';

export default async function ClosedLoans() {
  const loans = await getClosedLoans();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Settled Accounts & Archive</h1>
          <p className="text-xs text-slate-500 mt-1">
            {loans.length} completed loan{loans.length !== 1 ? 's' : ''} in historical ledger
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </Link>
      </div>

      {loans.length === 0 ? (
        <div className="card text-center py-12">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500">
            <Archive className="w-6 h-6" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">No completed loans in the archive yet</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Borrower</th>
                  <th>Product Model</th>
                  <th className="text-right">Principal</th>
                  <th className="text-right">Collected</th>
                  <th className="text-right">Realized Net</th>
                  <th>Closure Date</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => {
                  const received = calculateReceivedTotal(loan.payments);
                  const given = Number(loan.loanGiven);
                  const pl = loan.loanType === 'MONTHLY'
                    ? received
                    : received - given;
                  const typeLabel = loan.loanType === 'UNKNOWN' ? 'RECOVERY' : loan.loanType;

                  return (
                    <tr key={loan.id}>
                      <td className="font-semibold text-slate-900 dark:text-slate-100">{loan.borrower}</td>
                      <td>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {typeLabel}
                        </span>
                      </td>
                      <td className="text-right font-medium text-slate-700 dark:text-slate-300">₹{given.toLocaleString('en-IN')}</td>
                      <td className="text-right font-medium text-slate-900 dark:text-slate-100">₹{received.toLocaleString('en-IN')}</td>
                      <td className={`text-right font-bold ${pl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {pl >= 0 ? '+' : ''}₹{pl.toLocaleString('en-IN')}
                      </td>
                      <td className="text-slate-500 text-xs">{format(new Date(loan.updatedAt), 'dd MMM yyyy')}</td>
                      <td className="text-right">
                        <Link
                          href={`/loans/${loan.id}`}
                          className="btn-secondary text-xs py-1 px-2.5"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
