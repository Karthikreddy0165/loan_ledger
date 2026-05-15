'use client';

import Link from 'next/link';
import { format, differenceInDays } from 'date-fns';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoanWithPayments, CategoryStats } from '@/types/loan';
import {
  calculateReceivedTotal,
  calculateExpectedAmount,
  calculateGap,
  calculateLoanEndDate,
  calculateRemainingDays,
} from '@/lib/calculations';

interface LoanTableProps {
  loans: LoanWithPayments[];
  loanType: string;
  title: string;
  emoji: string;
  stats?: CategoryStats;
  borrowerTotals?: Record<string, number>;
  sectionStats?: {
    label: string;
    value: string;
    tone?: 'neutral' | 'positive' | 'negative';
  }[];
}

function QuickPaymentInline({ loanId }: { loanId: string }) {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/loans/${loanId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to add payment');
      }

      setAmount('');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to add payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="₹"
        className="w-20 text-right text-xs py-1.5 px-2 bg-white/[0.04] border border-white/[0.08] rounded-lg 
                   text-slate-300 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50
                   transition-all duration-200"
        disabled={isSubmitting}
      />
      <button
        type="submit"
        disabled={isSubmitting || !amount}
        className="text-[11px] py-1.5 px-2.5 rounded-lg font-medium
                   bg-emerald-500/10 text-emerald-400 border border-emerald-500/20
                   hover:bg-emerald-500/20 disabled:opacity-30 transition-all duration-200"
      >
        {isSubmitting ? '...' : 'Pay'}
      </button>
      {error && <span className="text-[10px] text-red-400">{error}</span>}
    </form>
  );
}

function EndDateBadge({ loan }: { loan: LoanWithPayments }) {
  const endDate = calculateLoanEndDate(loan);
  if (!endDate) return <span className="text-slate-600">—</span>;

  const remaining = calculateRemainingDays(loan);
  const formatted = format(endDate, 'dd MMM yy');

  if (remaining === null) {
    return <span className="text-slate-400 text-xs">{formatted}</span>;
  }

  if (remaining < 0) {
    return (
      <div className="flex flex-col items-end">
        <span className="text-xs text-slate-400">{formatted}</span>
        <span className="text-[10px] text-red-400 font-medium">{Math.abs(remaining)}d overdue</span>
      </div>
    );
  }

  if (remaining <= 7) {
    return (
      <div className="flex flex-col items-end">
        <span className="text-xs text-slate-400">{formatted}</span>
        <span className="text-[10px] text-amber-400 font-medium">{remaining}d left</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end">
      <span className="text-xs text-slate-400">{formatted}</span>
      <span className="text-[10px] text-emerald-400/70">{remaining}d left</span>
    </div>
  );
}

export default function LoanTable({
  loans,
  loanType,
  title,
  emoji,
  stats,
  borrowerTotals,
  sectionStats,
}: LoanTableProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleExportReport = async () => {
    const jsPDFModule = await import('jspdf');
    const jsPDF = jsPDFModule.default || (jsPDFModule as any).jsPDF;
    const autoTableModule = await import('jspdf-autotable');
    const autoTable = autoTableModule.default || autoTableModule;

    const fmt = (n: number) => `Rs.${n.toLocaleString('en-IN')}`;

    const reportData = loans
      .map((loan) => {
        const gap = calculateGap(loan as any);
        const received = calculateReceivedTotal(loan.payments);
        const expected = calculateExpectedAmount(loan);
        const borrowerBalance = borrowerTotals?.[loan.borrower] || 0;
        const amountPerInst = Number(loan.amountPerInstallment || 0);
        const missedInst = amountPerInst > 0 ? Math.ceil(gap / amountPerInst) : 0;
        const endDate = calculateLoanEndDate(loan);
        const remainingDays = calculateRemainingDays(loan);

        let status = 'On Track';
        if (remainingDays !== null && remainingDays < 0) {
          status = `Overdue (${Math.abs(remainingDays)}d)`;
        } else if (gap > 0) {
          status = 'Behind';
        }

        return {
          name: loan.borrower,
          given: Number(loan.loanGiven),
          balance: borrowerBalance,
          expected,
          received,
          gap,
          missed: missedInst,
          endDate: endDate ? format(endDate, 'dd MMM yy') : '-',
          status,
          isOverdue: remainingDays !== null && remainingDays < 0,
          hasGap: gap > 0,
        };
      })
      .sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        return b.gap - a.gap;
      });

    if (reportData.length === 0) {
      alert('No loans in this section.');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape' });
    const today = format(new Date(), 'dd MMM yyyy');

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`${title} - Follow-up Report`, 14, 18);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120);
    doc.text(`Generated on ${today}`, 14, 25);

    // Summary
    const totalGap = reportData.reduce((s, r) => s + r.gap, 0);
    const overdueCount = reportData.filter((r) => r.isOverdue).length;
    const behindCount = reportData.filter((r) => r.hasGap && !r.isOverdue).length;
    doc.setTextColor(60);
    doc.setFontSize(9);
    doc.text(
      `Total Loans: ${reportData.length}  |  Total Gap: ${fmt(totalGap)}  |  Overdue: ${overdueCount}  |  Behind: ${behindCount}`,
      14, 31
    );

    // Table
    (autoTable as any)(doc, {
      startY: 36,
      head: [['#', 'Borrower', 'Given', 'Cust Bal.', 'Expected', 'Received', 'Gap', 'Missed', 'End Date', 'Status']],
      body: reportData.map((r, i) => [
        i + 1,
        r.name,
        fmt(r.given),
        fmt(r.balance),
        fmt(r.expected),
        fmt(r.received),
        fmt(r.gap),
        r.missed,
        r.endDate,
        r.status,
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 10 },
        2: { halign: 'right' as const },
        3: { halign: 'right' as const },
        4: { halign: 'right' as const },
        5: { halign: 'right' as const },
        6: { halign: 'right' as const, fontStyle: 'bold' as const },
        7: { halign: 'center' as const },
      },
      didParseCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 9) {
          const val = String(data.cell.raw || '');
          if (val.startsWith('Overdue')) {
            data.cell.styles.textColor = [220, 38, 38];
            data.cell.styles.fontStyle = 'bold';
          } else if (val === 'Behind') {
            data.cell.styles.textColor = [217, 119, 6];
          } else {
            data.cell.styles.textColor = [22, 163, 74];
          }
        }
        if (data.section === 'body' && data.column.index === 6) {
          const row = reportData[data.row.index];
          if (row && row.gap > 0) {
            data.cell.styles.textColor = [220, 38, 38];
          }
        }
      },
    });

    doc.save(`${title.replace(/\s+/g, '_')}_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  if (loans.length === 0) {
    return (
      <div className="card mt-6 opacity-60">
        <div className="flex items-center gap-3">
          <span className="text-xl">{emoji}</span>
          <h2 className="text-lg font-semibold text-slate-300">{title}</h2>
        </div>
        <p className="text-slate-600 italic mt-3 text-sm">No records</p>
      </div>
    );
  }

  return (
    <div className="card mt-6 animate-fade-in-up">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-2 group"
          >
            <span className="text-xl">{emoji}</span>
            <h2 className="text-lg font-semibold text-slate-200 group-hover:text-white transition-colors">
              {title}
            </h2>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'
                }`}
            >
              <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </button>
          <span className="text-[11px] rounded-full bg-white/[0.06] px-2.5 py-1 text-slate-500 font-medium border border-white/[0.06]">
            {loans.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportReport}
            className="text-[11px] bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]
                       font-medium py-1.5 px-3 rounded-lg border border-white/[0.06] 
                       transition-all duration-200 flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h2.879a1.5 1.5 0 0 1 1.06.44l1.122 1.12A1.5 1.5 0 0 0 9.62 4H12.5A1.5 1.5 0 0 1 14 5.5v1.401a2.986 2.986 0 0 0-4-1.036A2.99 2.99 0 0 0 8 9c0 .898.396 1.703 1.022 2.253a2.99 2.99 0 0 0-.022.747H3.5A1.5 1.5 0 0 1 2 10.5v-7Z" />
              <path d="M11 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-3 2a3 3 0 1 1 6 0 3 3 0 0 1-6 0Z" />
            </svg>
            PDF Report
          </button>
        </div>
      </div>

      {/* Section Stats */}
      {!isCollapsed && sectionStats && sectionStats.length > 0 && (
        <div className="flex flex-wrap gap-x-5 gap-y-1 mb-4 pb-4 border-b border-white/[0.05]">
          {sectionStats.map((item) => (
            <span
              key={item.label}
              className="text-[11px]"
            >
              <span className="text-slate-500">{item.label}</span>{' '}
              <span
                className={
                  item.tone === 'positive'
                    ? 'font-semibold text-emerald-400'
                    : item.tone === 'negative'
                      ? 'font-semibold text-rose-400'
                      : 'font-semibold text-slate-300'
                }
              >
                {item.value}
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Table & Mobile Cards */}
      {!isCollapsed && (
        <div className="flex flex-col gap-4">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto -mx-6 px-6">
            <table className="data-table w-full">
            <thead>
              <tr>
                <th>Borrower</th>
                <th className="text-right">Given</th>
                {borrowerTotals && (
                  <th className="text-right hidden xl:table-cell">Cust Balance</th>
                )}
                {loanType === 'daily' || loanType === 'weekly' ? (
                  <>
                    <th className="text-right hidden lg:table-cell">Inst.</th>
                    <th className="text-right">Expected</th>
                    <th className="text-right">Received</th>
                    <th className="text-right">Gap</th>
                    <th className="text-right hidden xl:table-cell">Loan Date</th>
                    <th className="text-right">End Date</th>
                  </>
                ) : loanType === 'monthly' ? (
                  <>
                    <th className="text-right">Interest</th>
                    <th className="text-right hidden xl:table-cell">Loan Date</th>
                    <th className="text-right hidden xl:table-cell">Due Date</th>
                    <th className="text-right">Received</th>
                  </>
                ) : loanType === 'unknown' ? (
                  <>
                    <th className="text-right hidden xl:table-cell">Loan Date</th>
                    <th className="text-right">End Date</th>
                    <th className="text-right">Received</th>
                  </>
                ) : (
                  <>
                    <th className="text-right">Return Amt</th>
                    <th className="text-right hidden xl:table-cell">Loan Date</th>
                    <th className="text-right">End Date</th>
                    <th className="text-right">Received</th>
                  </>
                )}
                <th className="text-right hidden lg:table-cell">Last Payment</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => {
                const received = calculateReceivedTotal(loan.payments);
                const expected = calculateExpectedAmount(loan);
                const gap = calculateGap(loan);
                const borrowerBalance = borrowerTotals?.[loan.borrower];
                const lastPayment = loan.payments.length
                  ? loan.payments.reduce(
                    (latest, p) =>
                      new Date(p.paymentDate) > new Date(latest.paymentDate) ? p : latest,
                    loan.payments[0]
                  )
                  : null;
                const progress = Number(loan.loanGiven) > 0
                  ? Math.min((received / Number(loan.loanGiven)) * 100, 100)
                  : 0;

                return (
                  <tr key={loan.id}>
                    <td>
                      <div className="flex flex-col">
                        <Link
                          href={`/loans/${loan.id}`}
                          className="text-blue-400 hover:text-blue-300 font-medium transition-colors text-sm"
                        >
                          {loan.borrower}
                        </Link>
                        {/* Mini progress bar */}
                        <div className="w-16 h-1 bg-white/[0.06] rounded-full mt-1.5">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${progress >= 100
                                ? 'bg-emerald-500'
                                : progress >= 50
                                  ? 'bg-blue-500'
                                  : 'bg-amber-500'
                              }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="text-right text-slate-300">
                      ₹{Number(loan.loanGiven).toLocaleString()}
                    </td>
                    {borrowerTotals && (
                      <td className="text-right font-semibold text-slate-400 hidden xl:table-cell">
                        ₹{(borrowerBalance ?? 0).toLocaleString()}
                      </td>
                    )}
                    {loanType === 'daily' || loanType === 'weekly' ? (
                      <>
                        <td className="text-right hidden lg:table-cell text-slate-400">
                          ₹{loan.amountPerInstallment ? Number(loan.amountPerInstallment).toLocaleString() : '-'}
                        </td>
                        <td className="text-right text-slate-400">
                          ₹{expected.toLocaleString()}
                        </td>
                        <td className="text-right text-slate-300">
                          ₹{received.toLocaleString()}
                        </td>
                        <td className={`text-right font-semibold ${gap > 0 ? 'text-rose-400' : 'text-emerald-400'
                          }`}>
                          ₹{gap.toLocaleString()}
                        </td>
                        <td className="text-right hidden xl:table-cell text-slate-500 text-xs">
                          {loan.loanDate ? format(new Date(loan.loanDate), 'dd MMM yy') : '-'}
                        </td>
                        <td className="text-right">
                          <EndDateBadge loan={loan} />
                        </td>
                      </>
                    ) : loanType === 'monthly' ? (
                      <>
                        <td className="text-right text-slate-300">
                          ₹{loan.interestAmount ? Number(loan.interestAmount).toLocaleString() : '-'}
                        </td>
                        <td className="text-right hidden xl:table-cell text-slate-500 text-xs">
                          {loan.loanDate ? format(new Date(loan.loanDate), 'dd MMM yy') : '-'}
                        </td>
                        <td className="text-right hidden xl:table-cell text-slate-500 text-xs">
                          {loan.interestDueDate ? format(new Date(loan.interestDueDate), 'dd MMM yy') : '-'}
                        </td>
                        <td className="text-right text-slate-300">
                          ₹{received.toLocaleString()}
                        </td>
                      </>
                    ) : loanType === 'unknown' ? (
                      <>
                        <td className="text-right hidden xl:table-cell text-slate-500 text-xs">
                          {loan.loanDate ? format(new Date(loan.loanDate), 'dd MMM yy') : '-'}
                        </td>
                        <td className="text-right">
                          <EndDateBadge loan={loan} />
                        </td>
                        <td className="text-right text-slate-300">
                          ₹{received.toLocaleString()}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="text-right text-slate-300">
                          ₹{loan.adjustmentReturnAmount ? Number(loan.adjustmentReturnAmount).toLocaleString() : '-'}
                        </td>
                        <td className="text-right hidden xl:table-cell text-slate-500 text-xs">
                          {loan.loanDate ? format(new Date(loan.loanDate), 'dd MMM yy') : '-'}
                        </td>
                        <td className="text-right">
                          <EndDateBadge loan={loan} />
                        </td>
                        <td className="text-right text-slate-300">
                          ₹{received.toLocaleString()}
                        </td>
                      </>
                    )}
                    <td className="text-right text-slate-500 text-xs hidden lg:table-cell">
                      {lastPayment
                        ? format(new Date(lastPayment.paymentDate), 'dd MMM yy')
                        : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="text-right">
                      <div className="flex flex-col items-end gap-2">
                        <Link
                          href={`/loans/${loan.id}`}
                          className="text-[11px] py-1 px-2.5 rounded-lg font-medium
                                     bg-white/[0.04] text-slate-400 border border-white/[0.06]
                                     hover:bg-white/[0.08] hover:text-white transition-all duration-200"
                        >
                          View
                        </Link>
                        <QuickPaymentInline loanId={loan.id} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden flex flex-col gap-4 -mx-2">
            {loans.map((loan) => {
              const received = calculateReceivedTotal(loan.payments);
              const expected = calculateExpectedAmount(loan);
              const gap = calculateGap(loan);
              const borrowerBalance = borrowerTotals?.[loan.borrower];
              const progress = Number(loan.loanGiven) > 0
                ? Math.min((received / Number(loan.loanGiven)) * 100, 100)
                : 0;

              return (
                <div key={loan.id} className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <Link href={`/loans/${loan.id}`} className="text-blue-400 hover:text-blue-300 font-semibold text-base">
                        {loan.borrower}
                      </Link>
                      <div className="w-16 h-1 bg-white/[0.06] rounded-full mt-2">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${progress >= 100 ? 'bg-emerald-500' : progress >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <EndDateBadge loan={loan} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm mt-1">
                    <div>
                      <span className="text-slate-500 text-xs block mb-0.5">Given</span>
                      <span className="font-medium text-slate-200">₹{Number(loan.loanGiven).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs block mb-0.5">Expected</span>
                      <span className="font-medium text-slate-200">₹{expected.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs block mb-0.5">Received</span>
                      <span className="font-medium text-slate-300">₹{received.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs block mb-0.5">Gap</span>
                      <span className={`font-semibold ${gap > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        ₹{gap.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/[0.05]">
                    <div className="flex flex-col gap-2">
                      <QuickPaymentInline loanId={loan.id} />
                    </div>
                    <Link
                      href={`/loans/${loan.id}`}
                      className="text-[11px] py-1.5 px-3 rounded-lg font-medium bg-white/[0.04] text-slate-400 border border-white/[0.06] hover:bg-white/[0.08] hover:text-white transition-all duration-200"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
