import { Loan, Payment, LoanType } from '@prisma/client';
import { differenceInDays, differenceInMonths, addDays, addWeeks, startOfDay } from 'date-fns';

export type LoanWithPayments = Loan & { payments: Payment[] };

const PROFIT_RATE = 0.15;
const NET_RATE = 0.85;

export function calculateNetGivenAmount(loan: Loan): number {
  if (loan.loanType === LoanType.DAILY || loan.loanType === LoanType.WEEKLY) {
    return Number(loan.loanGiven) * NET_RATE;
  }
  return Number(loan.loanGiven);
}

export function calculateReceivedTotal(payments: Payment[]): number {
  return payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
}

function capExpectedAmount(expected: number, loan: Loan): number {
  const max = Number(loan.loanGiven);
  if (Number.isNaN(max)) return expected;
  return Math.min(expected, max);
}

function capInstallments(installmentsDue: number, installmentCount: number | null | undefined): number {
  if (installmentCount === null || installmentCount === undefined) return installmentsDue;
  if (installmentCount <= 0) return 0;
  return Math.min(installmentsDue, installmentCount);
}

function getMonthlyBaseDate(loan: Loan): Date | null {
  if (loan.interestDueDate) return new Date(loan.interestDueDate);
  if (loan.loanDate) return new Date(loan.loanDate);
  return null;
}

/**
 * Calculate the loan end date based on loan type and parameters.
 * For daily loans: loanDate + installmentCount days
 * For weekly loans: loanDate + installmentCount weeks
 * For monthly loans: uses interestDueDate or expectedReturnDate
 * For adjustment: uses adjustmentReturnDate or expectedReturnDate
 */
export function calculateLoanEndDate(loan: Loan): Date | null {
  if (loan.expectedReturnDate) {
    return new Date(loan.expectedReturnDate);
  }

  switch (loan.loanType) {
    case LoanType.DAILY:
      if (loan.loanDate && loan.installmentCount) {
        return addDays(new Date(loan.loanDate), loan.installmentCount);
      }
      return null;

    case LoanType.WEEKLY:
      if (loan.loanDate && loan.installmentCount) {
        return addWeeks(new Date(loan.loanDate), loan.installmentCount);
      }
      return null;

    case LoanType.MONTHLY:
      if (loan.interestDueDate) return new Date(loan.interestDueDate);
      return null;

    case LoanType.ADJUSTMENT:
      if (loan.adjustmentReturnDate) return new Date(loan.adjustmentReturnDate);
      return null;

    case LoanType.UNKNOWN:
    default:
      return null;
  }
}

/**
 * Calculate remaining days until loan end date.
 * Returns null if no end date, 0 if due today, negative if overdue, positive if remaining.
 */
export function calculateRemainingDays(loan: Loan, asOfDate: Date = new Date()): number | null {
  const endDate = calculateLoanEndDate(loan);
  if (!endDate) return null;
  const targetEnd = startOfDay(endDate);
  const targetAsOf = startOfDay(asOfDate);
  return differenceInDays(targetEnd, targetAsOf);
}

/**
 * Calculate remaining installments for daily/weekly loans.
 */
export function calculateRemainingInstallments(loan: Loan, asOfDate: Date = new Date()): number | null {
  if (loan.loanType !== LoanType.DAILY && loan.loanType !== LoanType.WEEKLY) return null;
  if (!loan.installmentCount || !loan.loanDate) return null;

  const loanDate = new Date(loan.loanDate);
  const daysPassed = Math.max(0, differenceInDays(asOfDate, loanDate));

  if (loan.loanType === LoanType.DAILY) {
    const installmentsDone = Math.min(daysPassed, loan.installmentCount);
    return Math.max(0, loan.installmentCount - installmentsDone);
  } else {
    const weeksPassed = Math.floor(daysPassed / 7);
    const installmentsDone = Math.min(weeksPassed, loan.installmentCount);
    return Math.max(0, loan.installmentCount - installmentsDone);
  }
}

export function calculateExpectedAmount(loan: Loan, asOfDate: Date = new Date()): number {
  switch (loan.loanType) {
    case LoanType.DAILY:
      if (!loan.loanDate || !loan.amountPerInstallment) return 0;
      {
        const loanDate = new Date(loan.loanDate);
        const daysPassed = Math.max(0, differenceInDays(asOfDate, loanDate));
        const installmentsDue = capInstallments(daysPassed, loan.installmentCount);
        const expected = installmentsDue * Number(loan.amountPerInstallment);
        return capExpectedAmount(expected, loan);
      }
    case LoanType.WEEKLY:
      if (!loan.loanDate || !loan.amountPerInstallment) return 0;
      {
        const loanDate = new Date(loan.loanDate);
        const daysPassed = Math.max(0, differenceInDays(asOfDate, loanDate));
        const weeksPassed = Math.floor(daysPassed / 7);
        const installmentsDue = capInstallments(weeksPassed, loan.installmentCount);
        const expected = installmentsDue * Number(loan.amountPerInstallment);
        return capExpectedAmount(expected, loan);
      }
    case LoanType.MONTHLY:
      if (!loan.interestAmount) return 0;
      {
        const baseDate = getMonthlyBaseDate(loan);
        if (!baseDate) return 0;
        const monthsPassed = Math.max(0, differenceInMonths(asOfDate, baseDate));
        return monthsPassed * Number(loan.interestAmount);
      }
    case LoanType.ADJUSTMENT:
      if (loan.adjustmentReturnAmount) {
        return Number(loan.adjustmentReturnAmount);
      }
      return Number(loan.loanGiven);
    case LoanType.UNKNOWN:
      return Number(loan.loanGiven);
    default:
      return 0;
  }
}

export function calculateProfitExpected(loan: Loan, asOfDate: Date = new Date()): number {
  switch (loan.loanType) {
    case LoanType.DAILY:
    case LoanType.WEEKLY:
      return Number(loan.loanGiven) * PROFIT_RATE;
    case LoanType.MONTHLY: {
      if (!loan.interestAmount) return 0;
      const baseDate = getMonthlyBaseDate(loan);
      if (!baseDate) return 0;
      const monthsPassed = Math.max(0, differenceInMonths(asOfDate, baseDate));
      return monthsPassed * Number(loan.interestAmount);
    }
    case LoanType.ADJUSTMENT: {
      if (!loan.adjustmentReturnAmount) return 0;
      return Number(loan.adjustmentReturnAmount) - Number(loan.loanGiven);
    }
    case LoanType.UNKNOWN:
    default:
      return 0;
  }
}

export function calculateGap(loan: LoanWithPayments, asOfDate: Date = new Date()): number {
  const expected = calculateExpectedAmount(loan, asOfDate);
  const received = calculateReceivedTotal(loan.payments);
  const rawGap = expected - received;
  if (loan.status === 'CLOSED') {
    return 0;
  }
  return rawGap;
}

export function isLoanOverdue(loan: Loan, asOfDate: Date = new Date()): boolean {
  const endDate = calculateLoanEndDate(loan);
  if (!endDate) return false;
  return startOfDay(endDate) < startOfDay(asOfDate);
}

export function getLoanProgress(loan: LoanWithPayments): number {
  if (loan.status === 'CLOSED') return 100;

  const received = calculateReceivedTotal(loan.payments);

  if (loan.loanType === LoanType.MONTHLY) {
    const expected = calculateExpectedAmount(loan);
    if (expected === 0) return 0;
    return Math.min((received / expected) * 100, 100);
  }

  const total = Number(loan.loanGiven);
  if (total === 0) return 0;
  return Math.min((received / total) * 100, 100);
}

export function getMonthlyProfitReceived(loan: LoanWithPayments): number {
  if (loan.loanType !== LoanType.MONTHLY) return 0;
  return calculateReceivedTotal(loan.payments);
}

export function getLoanHealthStatus(loan: LoanWithPayments, asOfDate: Date = new Date()): {
  status: 'on-track' | 'behind' | 'overdue' | 'completed' | 'recovery' | 'unknown';
  label: string;
  color: string;
} {
  if (loan.status === 'CLOSED') {
    return { status: 'completed', label: 'Fully Paid', color: 'emerald' };
  }

  if (loan.loanType === LoanType.MONTHLY) {
    const gap = calculateGap(loan, asOfDate);
    if (gap > 0) {
      return { status: 'behind', label: 'Interest Due', color: 'amber' };
    }
    return { status: 'on-track', label: 'Interest Paid', color: 'emerald' };
  }

  if (loan.loanType === LoanType.UNKNOWN) {
    const received = calculateReceivedTotal(loan.payments);
    if (received >= Number(loan.loanGiven)) {
      return { status: 'completed', label: 'Fully Paid', color: 'emerald' };
    }
    return { status: 'recovery', label: 'In Recovery', color: 'slate' };
  }

  const received = calculateReceivedTotal(loan.payments);
  if (received >= Number(loan.loanGiven)) {
    return { status: 'completed', label: 'Fully Paid', color: 'emerald' };
  }

  const endDate = calculateLoanEndDate(loan);
  if (endDate && startOfDay(endDate) < startOfDay(asOfDate)) {
    return { status: 'overdue', label: 'Overdue', color: 'red' };
  }

  const gap = calculateGap(loan, asOfDate);
  if (gap > 0) {
    return { status: 'behind', label: 'Behind', color: 'amber' };
  }

  if (gap <= 0) {
    return { status: 'on-track', label: 'On Track', color: 'emerald' };
  }

  return { status: 'recovery', label: 'In Recovery', color: 'slate' };
}
