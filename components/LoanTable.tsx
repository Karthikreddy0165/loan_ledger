'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { LoanWithPayments, CategoryStats } from '@/types/loan';
import {
  calculateReceivedTotal,
  calculateExpectedAmount,
  calculateGap,
  calculateLoanEndDate,
  calculateRemainingDays,
} from '@/lib/calculations';
import {
  FileDown,
  ChevronDown,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';

interface LoanTableProps {
  loans: LoanWithPayments[];
  loanType: string;
  title: string;
  emoji?: string;
  stats?: CategoryStats;
  borrowerTotals?: Record<string, number>;
  sectionStats?: {
    label: string;
    value: string;
    tone?: 'neutral' | 'positive' | 'negative';
  }[];
}

function QuickPaymentInline({ loanId, isDemo }: { loanId: string; isDemo: boolean }) {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (isDemo) {
    return (
      <div className="flex items-center gap-1.5" title="Payment recording is disabled in demo mode">
        <span className="text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700/60 flex items-center gap-1">
          <Lock className="w-2.5 h-2.5 text-slate-400" />
          View Only
        </span>
      </div>
    );
  }

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
      setError(err.message);
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
        className="w-18 text-right text-xs py-1 px-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md 
                   text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500
                   font-mono transition-all"
        disabled={isSubmitting}
      />
      <button
        type="submit"
        disabled={isSubmitting || !amount}
        className="text-[11px] py-1 px-2 rounded-md font-semibold
                   bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 transition-colors cursor-pointer"
      >
        {isSubmitting ? '...' : 'Pay'}
      </button>
      {error && <span className="text-[10px] text-rose-500">{error}</span>}
    </form>
  );
}

function EndDateBadge({ loan }: { loan: LoanWithPayments }) {
  const endDate = calculateLoanEndDate(loan);
  if (!endDate) return <span className="text-slate-400 font-mono">—</span>;

  const remaining = calculateRemainingDays(loan);
  const formatted = format(endDate, 'dd MMM yy');

  if (remaining === null) {
    return <span className="text-slate-600 dark:text-slate-400 text-xs font-mono">{formatted}</span>;
  }

  if (remaining < 0) {
    return (
      <div className="flex flex-col items-end">
        <span className="text-xs text-rose-600 dark:text-rose-400 font-mono font-semibold">{formatted}</span>
        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 font-mono mt-0.5">
          {Math.abs(remaining)}d overdue
        </span>
      </div>
    );
  }

  if (remaining === 0) {
    return (
      <div className="flex flex-col items-end">
        <span className="text-xs text-amber-600 dark:text-amber-400 font-mono font-semibold">{formatted}</span>
        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 font-mono mt-0.5">
          Due Today
        </span>
      </div>
    );
  }

  if (remaining <= 7) {
    return (
      <div className="flex flex-col items-end">
        <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">{formatted}</span>
        <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 font-mono">{remaining}d left</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end">
      <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">{formatted}</span>
      <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400/80 font-mono">{remaining}d left</span>
    </div>
  );
}

export default function LoanTable({
  loans,
  loanType,
  title,
  borrowerTotals,
  sectionStats,
}: LoanTableProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: session } = useSession();
  const isDemo = Boolean(session?.user?.isDemo || session?.user?.email?.toLowerCase() === 'test@example.com');

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
        const missedInst = amountPerInst > 0 ? Math.max(0, Math.ceil(gap / amountPerInst)) : 0;
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
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`${title} - Portfolio Statement`, 14, 18);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${today} · Active Loans: ${reportData.length}`, 14, 25);

    // Summary KPIs
    const totalGiven = reportData.reduce((s, r) => s + r.given, 0);
    const totalExpected = reportData.reduce((s, r) => s + r.expected, 0);
    const totalReceived = reportData.reduce((s, r) => s + r.received, 0);
    const totalGap = reportData.reduce((s, r) => s + r.gap, 0);
    const overdueCount = reportData.filter((r) => r.isOverdue).length;

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 29, 269, 14, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);

    const summaryLine =
      `Total Given: ${fmt(totalGiven)}   |   ` +
      `Expected: ${fmt(totalExpected)}   |   ` +
      `Received: ${fmt(totalReceived)}   |   ` +
      `Gap: ${fmt(totalGap)}   |   ` +
      `Overdue: ${overdueCount}`;
    doc.text(summaryLine, 18, 38);
    doc.setTextColor(0, 0, 0);

    const tableHeaders = [
      '#',
      'Borrower Name',
      'Given',
      'Total Balance',
      'Expected',
      'Received',
      'Gap',
      'Missed Inst',
      'End Date',
      'Status',
    ];

    const tableRows = reportData.map((row, idx) => [
      idx + 1,
      row.name,
      fmt(row.given),
      fmt(row.balance),
      fmt(row.expected),
      fmt(row.received),
      row.gap > 0 ? fmt(row.gap) : '-',
      row.missed > 0 ? `${row.missed} missed` : '-',
      row.endDate,
      row.status,
    ]);

    autoTable(doc, {
      head: [tableHeaders],
      body: tableRows,
      startY: 48,
      theme: 'grid',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: 255,
        fontSize: 8.5,
        fontStyle: 'bold',
        halign: 'left',
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { cellWidth: 42, fontStyle: 'bold' },
        2: { halign: 'right', cellWidth: 26 },
        3: { halign: 'right', cellWidth: 28 },
        4: { halign: 'right', cellWidth: 26 },
        5: { halign: 'right', cellWidth: 26 },
        6: { halign: 'right', cellWidth: 24, fontStyle: 'bold', textColor: [225, 29, 72] },
        7: { halign: 'center', cellWidth: 24 },
        8: { halign: 'center', cellWidth: 26 },
        9: { halign: 'center', cellWidth: 37, fontStyle: 'bold' },
      },
      didParseCell(data: any) {
        if (data.section === 'body') {
          const row = reportData[data.row.index];
          if (row) {
            if (row.isOverdue) {
              data.cell.styles.fillColor = [255, 241, 242];
            } else if (row.hasGap) {
              data.cell.styles.fillColor = [254, 252, 232];
            }
          }
        }
      },
      margin: { left: 14, right: 14 },
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Loan Ledger · Confidential Statement · Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 8,
        { align: 'center' }
      );
    }

    doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}_portfolio_${today.replace(/\s+/g, '_')}.pdf`);
  };

  if (loans.length === 0) {
    return (
      <Card className="p-4 mt-6 border-dashed">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</h2>
          <Badge variant="outline" className="text-slate-400 font-mono">0 accounts</Badge>
        </div>
        <p className="text-slate-400 text-xs mt-1">No active loans in this category.</p>
      </Card>
    );
  }

  return (
    <Card className="mt-6 p-4 sm:p-5">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-2 group cursor-pointer text-left"
          >
            <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {title}
            </h2>
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
            )}
          </button>
          <Badge variant="secondary" className="font-mono text-[10px]">
            {loans.length} {loans.length === 1 ? 'account' : 'accounts'}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleExportReport}
            variant="outline"
            size="sm"
            className="text-xs"
            title="Download PDF Ledger Report"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-500" />
            <span>Export PDF</span>
          </Button>
        </div>
      </div>

      {/* Section Stats */}
      {!isCollapsed && sectionStats && sectionStats.length > 0 && (
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800 text-xs font-mono">
          {sectionStats.map((item) => (
            <span key={item.label} className="inline-flex items-center gap-1.5">
              <span className="text-slate-500 font-sans text-[11px] font-medium">{item.label}:</span>
              <span
                className={
                  item.tone === 'positive'
                    ? 'font-bold text-emerald-600 dark:text-emerald-400'
                    : item.tone === 'negative'
                      ? 'font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800/50'
                      : 'font-bold text-slate-800 dark:text-slate-200'
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
        <div className="w-full">
          {/* Desktop Table - Full Width without Horizontal Overflow */}
          <div className="hidden md:block w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Borrower</TableHead>
                  <TableHead className="text-right">Lent</TableHead>
                  {borrowerTotals && (
                    <TableHead className="text-right hidden xl:table-cell">Total Balance</TableHead>
                  )}
                  {loanType === 'daily' || loanType === 'weekly' ? (
                    <>
                      <TableHead className="text-right hidden lg:table-cell">Installment</TableHead>
                      <TableHead className="text-right">Expected</TableHead>
                      <TableHead className="text-right">Received</TableHead>
                      <TableHead className="text-right">Gap</TableHead>
                      <TableHead className="text-right hidden xl:table-cell">Start Date</TableHead>
                      <TableHead className="text-right">End Date</TableHead>
                    </>
                  ) : loanType === 'monthly' ? (
                    <>
                      <TableHead className="text-right">Monthly Interest</TableHead>
                      <TableHead className="text-right hidden xl:table-cell">Loan Date</TableHead>
                      <TableHead className="text-right hidden xl:table-cell">Due Date</TableHead>
                      <TableHead className="text-right">Received</TableHead>
                    </>
                  ) : loanType === 'unknown' ? (
                    <>
                      <TableHead className="text-right hidden xl:table-cell">Loan Date</TableHead>
                      <TableHead className="text-right">End Date</TableHead>
                      <TableHead className="text-right">Received</TableHead>
                      <TableHead className="text-right">Gap</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead className="text-right">Return Amt</TableHead>
                      <TableHead className="text-right hidden xl:table-cell">Loan Date</TableHead>
                      <TableHead className="text-right">End Date</TableHead>
                      <TableHead className="text-right">Received</TableHead>
                    </>
                  )}
                  <TableHead className="text-right hidden lg:table-cell">Last Paid</TableHead>
                  <TableHead className="text-right w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
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
                    <TableRow key={loan.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <Link
                            href={`/loans/${loan.id}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline font-semibold text-xs"
                          >
                            {loan.borrower}
                          </Link>
                          {/* Progress bar */}
                          <div className="w-16 h-1 bg-slate-200 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                progress >= 100
                                  ? 'bg-emerald-500'
                                  : progress >= 50
                                    ? 'bg-blue-500'
                                    : 'bg-amber-500'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium text-slate-900 dark:text-slate-100">
                        ₹{Number(loan.loanGiven).toLocaleString('en-IN')}
                      </TableCell>
                      {borrowerTotals && (
                        <TableCell className="text-right font-mono text-slate-500 hidden xl:table-cell">
                          ₹{(borrowerBalance ?? 0).toLocaleString('en-IN')}
                        </TableCell>
                      )}
                      {loanType === 'daily' || loanType === 'weekly' ? (
                        <>
                          <TableCell className="text-right font-mono hidden lg:table-cell text-slate-600 dark:text-slate-400">
                            ₹{loan.amountPerInstallment ? Number(loan.amountPerInstallment).toLocaleString('en-IN') : '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono text-slate-600 dark:text-slate-400">
                            ₹{expected.toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium text-slate-900 dark:text-slate-100">
                            ₹{received.toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {gap > 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 shadow-xs">
                                ₹{gap.toLocaleString('en-IN')}
                              </span>
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold font-mono">
                                On Track
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right hidden xl:table-cell text-slate-500 font-mono text-xs">
                            {loan.loanDate ? format(new Date(loan.loanDate), 'dd MMM yy') : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <EndDateBadge loan={loan} />
                          </TableCell>
                        </>
                      ) : loanType === 'monthly' ? (
                        <>
                          <TableCell className="text-right font-mono font-medium text-slate-900 dark:text-slate-100">
                            ₹{loan.interestAmount ? Number(loan.interestAmount).toLocaleString('en-IN') : '-'}
                          </TableCell>
                          <TableCell className="text-right hidden xl:table-cell text-slate-500 font-mono text-xs">
                            {loan.loanDate ? format(new Date(loan.loanDate), 'dd MMM yy') : '-'}
                          </TableCell>
                          <TableCell className="text-right hidden xl:table-cell text-slate-500 font-mono text-xs">
                            {loan.interestDueDate ? format(new Date(loan.interestDueDate), 'dd MMM yy') : '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium text-slate-900 dark:text-slate-100">
                            ₹{received.toLocaleString('en-IN')}
                          </TableCell>
                        </>
                      ) : loanType === 'unknown' ? (
                        <>
                          <TableCell className="text-right hidden xl:table-cell text-slate-500 font-mono text-xs">
                            {loan.loanDate ? format(new Date(loan.loanDate), 'dd MMM yy') : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <EndDateBadge loan={loan} />
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium text-slate-900 dark:text-slate-100">
                            ₹{received.toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {gap > 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 shadow-xs">
                                ₹{gap.toLocaleString('en-IN')}
                              </span>
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold font-mono">
                                Fully Paid
                              </span>
                            )}
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="text-right font-mono font-medium text-slate-900 dark:text-slate-100">
                            ₹{loan.adjustmentReturnAmount ? Number(loan.adjustmentReturnAmount).toLocaleString('en-IN') : '-'}
                          </TableCell>
                          <TableCell className="text-right hidden xl:table-cell text-slate-500 font-mono text-xs">
                            {loan.loanDate ? format(new Date(loan.loanDate), 'dd MMM yy') : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <EndDateBadge loan={loan} />
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium text-slate-900 dark:text-slate-100">
                            ₹{received.toLocaleString('en-IN')}
                          </TableCell>
                        </>
                      )}
                      <TableCell className="text-right text-slate-500 font-mono text-xs hidden lg:table-cell">
                        {lastPayment
                          ? format(new Date(lastPayment.paymentDate), 'dd MMM yy')
                          : <span className="text-slate-400">—</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <QuickPaymentInline loanId={loan.id} isDemo={isDemo} />
                          <Link
                            href={`/loans/${loan.id}`}
                            className="text-[11px] font-medium py-1 px-2 rounded-md border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            Details
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden flex flex-col gap-3 mt-2">
            {loans.map((loan) => {
              const received = calculateReceivedTotal(loan.payments);
              const expected = calculateExpectedAmount(loan);
              const gap = calculateGap(loan);
              const progress = Number(loan.loanGiven) > 0
                ? Math.min((received / Number(loan.loanGiven)) * 100, 100)
                : 0;

              return (
                <div key={loan.id} className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <Link href={`/loans/${loan.id}`} className="text-blue-600 dark:text-blue-400 font-bold text-sm hover:underline">
                        {loan.borrower}
                      </Link>
                      <div className="w-16 h-1 bg-slate-200 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${progress >= 100 ? 'bg-emerald-500' : progress >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <EndDateBadge loan={loan} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                    <div>
                      <span className="text-slate-500 text-[11px] block">Lent</span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">₹{Number(loan.loanGiven).toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Expected</span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">₹{expected.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Received</span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">₹{received.toLocaleString('en-IN')}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">Gap</span>
                      {gap > 0 ? (
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-xs font-bold font-mono bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
                          ₹{gap.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold font-mono">
                          On Track
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-200 dark:border-slate-800">
                    <QuickPaymentInline loanId={loan.id} isDemo={isDemo} />
                    <Link
                      href={`/loans/${loan.id}`}
                      className="text-xs font-medium py-1 px-2.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-colors"
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
    </Card>
  );
}
