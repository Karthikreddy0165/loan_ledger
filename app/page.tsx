import { prisma } from '@/lib/prisma';
import StatsWidget from '@/components/StatsWidget';
import LoanTable from '@/components/LoanTable';
import AnalyticsCharts from '@/components/AnalyticsCharts';
import ExportDefaulters from '@/components/ExportDefaulters';
import { LoanStatus, LoanType } from '@prisma/client';
import { LoanWithPayments, CategoryStats } from '@/types/loan';
import {
  calculateReceivedTotal,
  calculateExpectedAmount,
  calculateGap,
  calculateNetGivenAmount,
  calculateProfitExpected,
} from '@/lib/calculations';
import { subDays, startOfDay, format, differenceInDays } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InfoTooltip } from '@/components/ui/tooltip';
import { AlertCircle } from 'lucide-react';

async function getDashboardData() {
  const [openLoans, openLoanAgg, allPaymentsAgg, openPaymentsAgg, openLoansCount, closedLoansCount, overdueFollowUps] =
    await Promise.all([
      prisma.loan.findMany({
        where: { status: LoanStatus.OPEN },
        include: { payments: true },
        orderBy: { loanDate: 'desc' },
      }),
      prisma.loan.aggregate({
        where: { status: LoanStatus.OPEN },
        _sum: { loanGiven: true },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { loan: { status: LoanStatus.OPEN } },
        _sum: { amount: true },
      }),
      prisma.loan.count({ where: { status: LoanStatus.OPEN } }),
      prisma.loan.count({ where: { status: LoanStatus.CLOSED } }),
      prisma.recoveryNote.count({
        where: {
          followUpDate: { lt: new Date() },
          status: { not: 'RESOLVED' },
          loan: { status: LoanStatus.OPEN },
        },
      }),
    ]);

  const totalLoansGiven = Number(openLoanAgg._sum.loanGiven ?? 0);
  const totalReceived = Number(allPaymentsAgg._sum.amount ?? 0);
  const totalReceivedOnOpen = Number(openPaymentsAgg._sum.amount ?? 0);
  const totalOutstanding = totalLoansGiven - totalReceivedOnOpen;

  // Distribution data
  const distribution = await prisma.loan.groupBy({
    by: ['loanType'],
    where: { status: LoanStatus.OPEN },
    _sum: { loanGiven: true },
  });

  const distributionData = distribution.map((d) => ({
    name: d.loanType === 'UNKNOWN' ? 'Recovery' : d.loanType.charAt(0) + d.loanType.slice(1).toLowerCase(),
    value: Number(d._sum.loanGiven || 0),
  }));

  // Trend data (last 30 days)
  const thirtyDaysAgo = startOfDay(subDays(new Date(), 30));
  const recentPayments = await prisma.payment.findMany({
    where: {
      paymentDate: { gte: thirtyDaysAgo },
    },
    select: {
      amount: true,
      paymentDate: true,
    },
    orderBy: { paymentDate: 'asc' },
  });

  const trendMap = new Map();
  recentPayments.forEach((p) => {
    const dateStr = format(new Date(p.paymentDate), 'MMM d');
    trendMap.set(dateStr, (trendMap.get(dateStr) || 0) + p.amount);
  });

  const trendData = Array.from(trendMap.entries()).map(([date, amount]) => ({
    date,
    amount,
  }));

  return {
    loans: openLoans as LoanWithPayments[],
    stats: {
      totalLoansGiven,
      totalReceived,
      totalReceivedOnOpen,
      totalOutstanding,
      openLoansCount,
      closedLoansCount,
    },
    overdueFollowUps,
    distributionData,
    trendData,
  };
}

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const { loans: rawLoans, stats, overdueFollowUps, distributionData, trendData } = await getDashboardData();
  const today = new Date();

  const loans = JSON.parse(JSON.stringify(rawLoans)) as LoanWithPayments[];

  const dailyLoans = loans.filter((l) => l.loanType === LoanType.DAILY);
  const weeklyLoans = loans.filter((l) => l.loanType === LoanType.WEEKLY);
  const monthlyLoans = loans.filter((l) => l.loanType === LoanType.MONTHLY);
  const adjustmentLoans = loans.filter((l) => l.loanType === LoanType.ADJUSTMENT);
  const unknownLoans = loans.filter((l) => l.loanType === LoanType.UNKNOWN);

  const buildCategoryStats = (items: LoanWithPayments[]): CategoryStats => {
    const totalGiven = items.reduce((sum, loan) => sum + Number(loan.loanGiven), 0);
    const totalReceived = items.reduce(
      (sum, loan) => sum + calculateReceivedTotal(loan.payments),
      0
    );
    const totalExpected = items.reduce(
      (sum, loan) => sum + calculateExpectedAmount(loan),
      0
    );
    const totalGap = items.reduce(
      (sum, loan) => sum + Math.max(0, calculateGap(loan)),
      0
    );
    return { totalGiven, totalReceived, totalExpected, totalGap };
  };

  const dailyStats = buildCategoryStats(dailyLoans);
  const weeklyStats = buildCategoryStats(weeklyLoans);
  const monthlyStats = buildCategoryStats(monthlyLoans);
  const adjustmentStats = buildCategoryStats(adjustmentLoans);
  const unknownStats = buildCategoryStats(unknownLoans);

  const buildSectionStats = (items: LoanWithPayments[], type: LoanType) => {
    const totalGiven = items.reduce((sum, loan) => sum + Number(loan.loanGiven), 0);
    const totalReceived = items.reduce(
      (sum, loan) => sum + calculateReceivedTotal(loan.payments),
      0
    );
    const totalExpected = items.reduce(
      (sum, loan) => sum + calculateExpectedAmount(loan),
      0
    );
    const totalGap = items.reduce((sum, loan) => sum + Math.max(0, calculateGap(loan)), 0);
    const totalNetGiven = items.reduce(
      (sum, loan) => sum + calculateNetGivenAmount(loan),
      0
    );
    const totalProfitExpected = items.reduce(
      (sum, loan) => sum + calculateProfitExpected(loan, today),
      0
    );
    const totalOutstanding = Math.max(0, totalGiven - totalReceived);
    const collectionRate = totalGiven ? (totalReceived / totalGiven) * 100 : 0;

    if (type === LoanType.DAILY || type === LoanType.WEEKLY) {
      return [
        { label: 'Lent', value: `₹${totalGiven.toLocaleString('en-IN')}` },
        { label: 'Net Given', value: `₹${totalNetGiven.toLocaleString('en-IN')}` },
        { label: 'Expected Profit', value: `₹${totalProfitExpected.toLocaleString('en-IN')}`, tone: 'positive' as const },
        { label: 'Expected', value: `₹${totalExpected.toLocaleString('en-IN')}` },
        { label: 'Missing Gap', value: `₹${totalGap.toLocaleString('en-IN')}`, tone: totalGap > 0 ? ('negative' as const) : ('positive' as const) },
        { label: 'Collected', value: `${collectionRate.toFixed(1)}%` },
      ];
    }

    if (type === LoanType.MONTHLY) {
      return [
        { label: 'Lent', value: `₹${totalGiven.toLocaleString('en-IN')}` },
        { label: 'Monthly Interest', value: `₹${totalExpected.toLocaleString('en-IN')}`, tone: 'positive' as const },
        { label: 'Received', value: `₹${totalReceived.toLocaleString('en-IN')}` },
        { label: 'Pending Balance', value: `₹${totalOutstanding.toLocaleString('en-IN')}`, tone: totalOutstanding > 0 ? ('negative' as const) : ('positive' as const) },
      ];
    }

    if (type === LoanType.ADJUSTMENT) {
      return [
        { label: 'Lent', value: `₹${totalGiven.toLocaleString('en-IN')}` },
        { label: 'Return Due', value: `₹${totalExpected.toLocaleString('en-IN')}` },
        { label: 'Profit', value: `₹${totalProfitExpected.toLocaleString('en-IN')}`, tone: totalProfitExpected >= 0 ? ('positive' as const) : ('negative' as const) },
        { label: 'Received', value: `₹${totalReceived.toLocaleString('en-IN')}` },
      ];
    }

    // RECOVERY
    return [
      { label: 'Lent', value: `₹${totalGiven.toLocaleString('en-IN')}` },
      { label: 'Received', value: `₹${totalReceived.toLocaleString('en-IN')}` },
      { label: 'Missing Gap', value: `₹${totalGap.toLocaleString('en-IN')}`, tone: totalGap > 0 ? ('negative' as const) : ('positive' as const) },
    ];
  };

  const borrowerTotals = loans.reduce<Record<string, number>>((acc, loan) => {
    const received = calculateReceivedTotal(loan.payments);
    const balance = Math.max(0, Number(loan.loanGiven) - received);
    acc[loan.borrower] = (acc[loan.borrower] || 0) + balance;
    return acc;
  }, {});

  const totalExpectedOpen = loans.reduce(
    (sum, loan) => sum + calculateExpectedAmount(loan),
    0
  );
  const totalGapOpen = loans.reduce((sum, loan) => sum + Math.max(0, calculateGap(loan)), 0);
  const totalProfitExpectedOpen = loans.reduce(
    (sum, loan) => sum + calculateProfitExpected(loan, today),
    0
  );

  const dormantLoans = loans.filter((loan) => {
    if (loan.status !== LoanStatus.OPEN) return false;
    const lastPayment = loan.payments.length
      ? loan.payments.reduce(
          (latest, p) =>
            new Date(p.paymentDate) > new Date(latest.paymentDate) ? p : latest,
          loan.payments[0]
        )
      : null;
    const referenceDate = lastPayment?.paymentDate ?? loan.loanDate;
    if (!referenceDate) return false;
    return differenceInDays(today, new Date(referenceDate)) >= 30;
  });

  const productMetrics = [
    { type: 'DAILY', label: 'Daily Loans', count: dailyLoans.length, ...dailyStats },
    { type: 'WEEKLY', label: 'Weekly Loans', count: weeklyLoans.length, ...weeklyStats },
    { type: 'MONTHLY', label: 'Monthly Loans', count: monthlyLoans.length, ...monthlyStats },
    { type: 'ADJUSTMENT', label: 'Adjustments', count: adjustmentLoans.length, ...adjustmentStats },
    { type: 'UNKNOWN', label: 'Recovery', count: unknownLoans.length, ...unknownStats },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Loan Ledger
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-0.5">
            Track money lent, daily collections, and follow up on pending dues
          </p>
        </div>
        <ExportDefaulters loans={loans} />
      </div>

      {/* Top 6 Stats Overview */}
      <StatsWidget stats={stats} />

      {/* Visual Analytics */}
      <AnalyticsCharts
        distributionData={distributionData || []}
        trendData={trendData || []}
        productMetrics={productMetrics}
      />

      {/* Secondary Insight Cards (Simple Layman Terms) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Expected So Far
              </span>
              <InfoTooltip content="Total installment money borrowers should have paid by today according to their loan terms." />
            </div>
            <p className="text-xl font-bold font-mono text-slate-900 dark:text-white">
              ₹{totalExpectedOpen.toLocaleString('en-IN')}
            </p>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Scheduled installments to date
          </p>
        </Card>

        <Card className={`p-4 flex flex-col justify-between transition-colors ${
          totalGapOpen > 0
            ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20'
            : ''
        }`}>
          <div>
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${
                totalGapOpen > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'
              }`}>
                Follow-up Gap
              </span>
              <InfoTooltip content="Money missed: Expected amount minus what was actually received so far." />
            </div>
            <p className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
              ₹{totalGapOpen.toLocaleString('en-IN')}
            </p>
          </div>
          <p className={`mt-2 text-[11px] font-medium ${
            totalGapOpen > 0 ? 'text-rose-600/90 dark:text-rose-400/90' : 'text-slate-500 dark:text-slate-400'
          }`}>
            Overdue amount to follow up on
          </p>
        </Card>

        <Card className="p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Expected Profit
              </span>
              <InfoTooltip content="Total interest or profit you expect to make on all currently running loans." />
            </div>
            <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              ₹{totalProfitExpectedOpen.toLocaleString('en-IN')}
            </p>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            Based on active interest & fees
          </p>
        </Card>

        <Card className={`p-4 flex flex-col justify-between transition-colors ${
          dormantLoans.length > 0
            ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20'
            : ''
        }`}>
          <div>
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${
                dormantLoans.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'
              }`}>
                No Payment (30+ Days)
              </span>
              <InfoTooltip content="Borrowers who haven't made any payment in the last 30 days." />
            </div>
            <p className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
              {dormantLoans.length}
            </p>
          </div>
          <p className={`mt-2 text-[11px] font-medium ${
            dormantLoans.length > 0 ? 'text-rose-600/90 dark:text-rose-400/90' : 'text-slate-500 dark:text-slate-400'
          }`}>
            Borrowers with no recent activity
          </p>
        </Card>

        {overdueFollowUps > 0 && (
          <div className="col-span-2 md:col-span-4 p-3.5 rounded-xl border border-rose-300 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span className="text-xs font-semibold text-rose-950 dark:text-rose-200">
                Follow-up Notice: {overdueFollowUps} overdue follow-up notes need attention
              </span>
            </div>
            <Badge variant="destructive">Action Needed</Badge>
          </div>
        )}
      </div>

      {/* Loan Tables by Category */}
      <LoanTable
        loans={dailyLoans}
        loanType="daily"
        title="Daily Loans"
        stats={dailyStats}
        borrowerTotals={borrowerTotals}
        sectionStats={buildSectionStats(dailyLoans, LoanType.DAILY)}
      />
      <LoanTable
        loans={weeklyLoans}
        loanType="weekly"
        title="Weekly Loans"
        stats={weeklyStats}
        borrowerTotals={borrowerTotals}
        sectionStats={buildSectionStats(weeklyLoans, LoanType.WEEKLY)}
      />
      <LoanTable
        loans={monthlyLoans}
        loanType="monthly"
        title="Monthly Loans"
        stats={monthlyStats}
        borrowerTotals={borrowerTotals}
        sectionStats={buildSectionStats(monthlyLoans, LoanType.MONTHLY)}
      />
      <LoanTable
        loans={adjustmentLoans}
        loanType="adjustment"
        title="Adjustments"
        stats={adjustmentStats}
        borrowerTotals={borrowerTotals}
        sectionStats={buildSectionStats(adjustmentLoans, LoanType.ADJUSTMENT)}
      />
      <LoanTable
        loans={unknownLoans}
        loanType="unknown"
        title="Recovery"
        stats={unknownStats}
        borrowerTotals={borrowerTotals}
        sectionStats={buildSectionStats(unknownLoans, LoanType.UNKNOWN)}
      />
    </div>
  );
}
