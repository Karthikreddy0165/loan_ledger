import { prisma } from '@/lib/prisma';
import { LoanStatus } from '@prisma/client';
import Link from 'next/link';
import { format } from 'date-fns';
import { calculateReceivedTotal } from '@/lib/calculations';

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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Closed Loans</h1>
          <p className="text-sm text-slate-500 mt-1">{loans.length} loan{loans.length !== 1 ? 's' : ''} completed</p>
        </div>
        <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm transition-colors flex items-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M9.78 4.22a.75.75 0 0 1 0 1.06L7.06 8l2.72 2.72a.75.75 0 1 1-1.06 1.06L5.47 8.53a.75.75 0 0 1 0-1.06l3.25-3.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
          </svg>
          Dashboard
        </Link>
      </div>

      {loans.length === 0 ? (
        <div className="card text-center py-12">
          <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-slate-500">
              <path d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Z" />
            </svg>
          </div>
          <p className="text-slate-500 text-sm">No closed loans yet</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Borrower</th>
                  <th>Type</th>
                  <th className="text-right">Given</th>
                  <th className="text-right">Received</th>
                  <th className="text-right">P/L</th>
                  <th>Closed On</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => {
                  const received = calculateReceivedTotal(loan.payments);
                  const given = Number(loan.loanGiven);
                  // Monthly: principal stays, all received is interest profit
                  // Daily/Weekly: profit is baked into the loan (15% upfront)
                  const pl = loan.loanType === 'MONTHLY'
                    ? received  // all received = pure interest profit
                    : received - given;
                  const typeLabel = loan.loanType === 'UNKNOWN' ? 'RECOVERY' : loan.loanType;
                  return (
                    <tr key={loan.id}>
                      <td className="font-medium text-slate-200">{loan.borrower}</td>
                      <td>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-white/[0.04] text-slate-400 border border-white/[0.06]">
                          {typeLabel}
                        </span>
                      </td>
                      <td className="text-right text-slate-300">₹{given.toLocaleString()}</td>
                      <td className="text-right text-slate-300">₹{received.toLocaleString()}</td>
                      <td className={`text-right font-semibold ${pl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {pl >= 0 ? '+' : ''}₹{pl.toLocaleString()}
                      </td>
                      <td className="text-slate-500 text-xs">{format(new Date(loan.updatedAt), 'dd MMM yyyy')}</td>
                      <td className="text-right">
                        <Link
                          href={`/loans/${loan.id}`}
                          className="text-[11px] py-1 px-2.5 rounded-lg font-medium
                                     bg-white/[0.04] text-slate-400 border border-white/[0.06]
                                     hover:bg-white/[0.08] hover:text-white transition-all duration-200"
                        >
                          View
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
