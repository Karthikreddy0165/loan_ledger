import { prisma } from '@/lib/prisma';
import { LoanType, LoanStatus } from '@prisma/client';
import LoanTable from '@/components/LoanTable';
import StatsWidget from '@/components/StatsWidget';
import AnalyticsCharts from '@/components/AnalyticsCharts';
import { format, subDays, startOfDay } from 'date-fns';
import {
  calculateExpectedAmount,
  calculateGap,
  calculateReceivedTotal,
  calculateProfitExpected,
  calculateNetGivenAmount,
} from '@/lib/calculations';
import type { LoanWithPayments, CategoryStats } from '@/types/loan';
import { differenceInDays } from 'date-fns';

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
    _sum: { loanGiven: true }
  });

  const distributionData = distribution.map(d => ({
    name: d.loanType,
    value: Number(d._sum.loanGiven || 0)
  }));

  // Trend data (last 30 days)
  const thirtyDaysAgo = startOfDay(subDays(new Date(), 30));
  const recentPayments = await prisma.payment.findMany({
    where: {
      paymentDate: { gte: thirtyDaysAgo }
    },
    select: {
      amount: true,
      paymentDate: true
    },
    orderBy: { paymentDate: 'asc' }
  });

  const trendMap = new Map();
  recentPayments.forEach(p => {
    const dateStr = format(new Date(p.paymentDate), 'MMM d');
    trendMap.set(dateStr, (trendMap.get(dateStr) || 0) + p.amount);
  });

  const trendData = Array.from(trendMap.entries()).map(([date, amount]) => ({
    date,
    amount
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
    trendData
  };
}

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const { loans: rawLoans, stats, overdueFollowUps, distributionData, trendData } = await getDashboardData();
  const today = new Date();

  // Serialize to convert Prisma number objects to plain numbers for client components
  const loans = JSON.parse(JSON.stringify(rawLoans)) as LoanWithPayments[];

  const dailyLoans = loans.filter((l) => l.loanType === LoanType.DAILY);
  const weeklyLoans = loans.filter((l) => l.loanType === LoanType.WEEKLY);
  const monthlyLoans = loans.filter((l) => l.loanType === LoanType.MONTHLY);
  const adjustmentLoans = loans.filter((l) => l.loanType === LoanType.ADJUSTMENT);
  const unknownLoans = loans.filter((l) => l.loanType === LoanType.UNKNOWN);

  const buildCategoryStats = (items: LoanWithPayments[]): CategoryStats => {
    const totalGiven = items.reduce((sum, loan) => sum + Number(loan.loanGiven), 0);
    const totalReceived = items.reduce(
      (sum, loan) => sum + calculateReceivedTotal(loan.payments), 0
    );
    const totalExpected = items.reduce(
      (sum, loan) => sum + calculateExpectedAmount(loan), 0
    );
    const totalGap = items.reduce(
      (sum, loan) => sum + calculateGap(loan), 0
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
      (sum, loan) => sum + calculateReceivedTotal(loan.payments), 0
    );
    const totalExpected = items.reduce(
      (sum, loan) => sum + calculateExpectedAmount(loan), 0
    );
    const totalGap = items.reduce((sum, loan) => sum + calculateGap(loan), 0);
    const totalNetGiven = items.reduce(
      (sum, loan) => sum + calculateNetGivenAmount(loan), 0
    );
    const totalProfitExpected = items.reduce(
      (sum, loan) => sum + calculateProfitExpected(loan, today), 0
    );
    const totalOutstanding = Math.max(0, totalGiven - totalReceived);
    const collectionRate = totalGiven ? (totalReceived / totalGiven) * 100 : 0;

    if (type === LoanType.DAILY || type === LoanType.WEEKLY) {
      return [
        { label: 'Given', value: `₹${totalGiven.toLocaleString()}` },
        { label: 'Net Given', value: `₹${totalNetGiven.toLocaleString()}` },
        { label: 'Profit', value: `₹${totalProfitExpected.toLocaleString()}`, tone: 'positive' as const },
        { label: 'Expected', value: `₹${totalExpected.toLocaleString()}` },
        { label: 'Gap', value: `₹${totalGap.toLocaleString()}`, tone: totalGap > 0 ? ('negative' as const) : ('positive' as const) },
        { label: 'Collected', value: `${collectionRate.toFixed(1)}%` },
      ];
    }

    if (type === LoanType.MONTHLY) {
      return [
        { label: 'Given', value: `₹${totalGiven.toLocaleString()}` },
        { label: 'Interest Due', value: `₹${totalExpected.toLocaleString()}`, tone: 'positive' as const },
        { label: 'Received', value: `₹${totalReceived.toLocaleString()}` },
        { label: 'Outstanding', value: `₹${totalOutstanding.toLocaleString()}`, tone: totalOutstanding > 0 ? ('negative' as const) : ('positive' as const) },
      ];
    }

    if (type === LoanType.ADJUSTMENT) {
      return [
        { label: 'Given', value: `₹${totalGiven.toLocaleString()}` },
        { label: 'Return Due', value: `₹${totalExpected.toLocaleString()}` },
        { label: 'Profit', value: `₹${totalProfitExpected.toLocaleString()}`, tone: totalProfitExpected >= 0 ? ('positive' as const) : ('negative' as const) },
        { label: 'Received', value: `₹${totalReceived.toLocaleString()}` },
      ];
    }

    // UNKNOWN
    return [
      { label: 'Given', value: `₹${totalGiven.toLocaleString()}` },
      { label: 'Recovery', value: `₹${totalReceived.toLocaleString()}` },
      { label: 'Outstanding', value: `₹${totalOutstanding.toLocaleString()}`, tone: totalOutstanding > 0 ? ('negative' as const) : ('positive' as const) },
    ];
  };

  const borrowerTotals = loans.reduce<Record<string, number>>((acc, loan) => {
    const received = calculateReceivedTotal(loan.payments);
    const balance = Math.max(0, Number(loan.loanGiven) - received);
    acc[loan.borrower] = (acc[loan.borrower] || 0) + balance;
    return acc;
  }, {});

  const totalExpectedOpen = loans.reduce(
    (sum, loan) => sum + calculateExpectedAmount(loan), 0
  );
  const totalGapOpen = loans.reduce((sum, loan) => sum + calculateGap(loan), 0);
  const totalProfitExpectedOpen = loans.reduce(
    (sum, loan) => sum + calculateProfitExpected(loan, today), 0
  );
  const inactiveLoansCount = loans.filter((loan) => {
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
  }).length;

  // Pass charts data down
  (rawLoans as any).distributionData = distributionData;
  (rawLoans as any).trendData = trendData;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Loan Book
          </h1>
          <p className="text-slate-500 text-sm mt-1.5">
            Reality = received money · Follow-up = expected − received
          </p>
        </div>
      </div>

      {/* Top-level Stats */}
      <StatsWidget stats={stats} />

      {/* Advanced Analytics */}
      <AnalyticsCharts 
        distributionData={(rawLoans as any).distributionData || []} 
        trendData={(rawLoans as any).trendData || []} 
      />

      {/* Secondary Insight Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Expected (Open)
            </p>
          </div>
          <p className="text-2xl font-bold text-indigo-400">
            ₹{totalExpectedOpen.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Daily + Weekly schedules</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Follow-up Gap
            </p>
          </div>
          <p className="text-2xl font-bold text-rose-400">
            ₹{totalGapOpen.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Expected minus received</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Profit Potential
            </p>
          </div>
          <p className="text-2xl font-bold text-emerald-400">
            ₹{totalProfitExpectedOpen.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Based on your rules</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              No Payment 30d
            </p>
          </div>
          <p className="text-2xl font-bold text-amber-400">{inactiveLoansCount}</p>
          <p className="mt-1 text-[11px] text-slate-500">Loans with no activity</p>
        </div>
        {overdueFollowUps > 0 && (
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Overdue Follow-ups
              </p>
            </div>
            <p className="text-2xl font-bold text-violet-400">{overdueFollowUps}</p>
            <p className="mt-1 text-[11px] text-slate-500">Recovery notes need action</p>
          </div>
        )}
      </div>

      {/* Loan Tables by Category */}
      <LoanTable
        loans={dailyLoans}
        loanType="daily"
        title="Daily Loans"
        emoji="🟡"
        stats={dailyStats}
        borrowerTotals={borrowerTotals}
        sectionStats={buildSectionStats(dailyLoans, LoanType.DAILY)}
      />
      <LoanTable
        loans={weeklyLoans}
        loanType="weekly"
        title="Weekly Loans"
        emoji="🟢"
        stats={weeklyStats}
        borrowerTotals={borrowerTotals}
        sectionStats={buildSectionStats(weeklyLoans, LoanType.WEEKLY)}
      />
      <LoanTable
        loans={monthlyLoans}
        loanType="monthly"
        title="Monthly (Interest)"
        emoji="🔵"
        stats={monthlyStats}
        borrowerTotals={borrowerTotals}
        sectionStats={buildSectionStats(monthlyLoans, LoanType.MONTHLY)}
      />
      <LoanTable
        loans={adjustmentLoans}
        loanType="adjustment"
        title="Adjustments"
        emoji="⚪"
        stats={adjustmentStats}
        borrowerTotals={borrowerTotals}
        sectionStats={buildSectionStats(adjustmentLoans, LoanType.ADJUSTMENT)}
      />
      <LoanTable
        loans={unknownLoans}
        loanType="unknown"
        title="Recovery"
        emoji="🔴"
        stats={unknownStats}
        borrowerTotals={borrowerTotals}
        sectionStats={buildSectionStats(unknownLoans, LoanType.UNKNOWN)}
      />
    </div>
  );
}
