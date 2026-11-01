import { describe, it, expect } from 'vitest';
import { calculateNetGivenAmount, calculateExpectedAmount, calculateGap, getLoanHealthStatus } from '../lib/calculations';
import { LoanType } from '@prisma/client';

describe('Loan Calculations', () => {
  const baseLoan = {
    id: 'test-id',
    borrower: 'John Doe',
    loanType: LoanType.DAILY,
    loanGiven: 10000,
    loanDate: new Date('2026-05-01T00:00:00Z'),
    installmentCount: 100,
    amountPerInstallment: 120,
    expectedReturnDate: null,
    interestAmount: null,
    interestDueDate: null,
    adjustmentReturnAmount: null,
    adjustmentReturnDate: null,
    status: 'OPEN' as const,
    note: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdById: null,
    updatedById: null,
  };

  it('calculates net given amount correctly', () => {
    // 85% for DAILY/WEEKLY
    const netDaily = calculateNetGivenAmount({ ...baseLoan, loanType: LoanType.DAILY });
    expect(netDaily).toBe(8500);

    const netWeekly = calculateNetGivenAmount({ ...baseLoan, loanType: LoanType.WEEKLY });
    expect(netWeekly).toBe(8500);

    // 100% for MONTHLY/ADJUSTMENT
    const netMonthly = calculateNetGivenAmount({ ...baseLoan, loanType: LoanType.MONTHLY });
    expect(netMonthly).toBe(10000);
  });

  it('calculates expected amount for a daily loan', () => {
    // 5 days passed
    const asOfDate = new Date('2026-05-06T00:00:00Z');
    // 5 days passed -> 5 installments due -> 5 * 120 = 600
    const expected = calculateExpectedAmount(baseLoan, asOfDate);
    expect(expected).toBe(600);
  });

  it('caps the expected amount to the loan given total', () => {
    // 200 days passed (exceeds installment count of 100)
    const asOfDate = new Date('2026-11-20T00:00:00Z');
    const expected = calculateExpectedAmount(baseLoan, asOfDate);
    expect(expected).toBe(10000);
  });

  it('calculates expected amount for a monthly loan', () => {
    const monthlyLoan = {
      ...baseLoan,
      loanType: LoanType.MONTHLY,
      interestDueDate: new Date('2026-05-01T00:00:00Z'),
      interestAmount: 500,
    };
    // 2 months passed
    const asOfDate = new Date('2026-07-02T00:00:00Z');
    const expected = calculateExpectedAmount(monthlyLoan, asOfDate);
    expect(expected).toBe(1000);
  });

  it('calculates gap correctly', () => {
    const asOfDate = new Date('2026-05-06T00:00:00Z'); // 5 installments due = 600
    const loanWithPayments = {
      ...baseLoan,
      payments: [
        { id: '1', loanId: 'test-id', amount: 100, paymentDate: new Date(), note: null, createdAt: new Date(), createdById: null },
        { id: '2', loanId: 'test-id', amount: 120, paymentDate: new Date(), note: null, createdAt: new Date(), createdById: null },
      ],
    };
    // Expected: 600, Received: 220, Gap: 380
    const gap = calculateGap(loanWithPayments, asOfDate);
    expect(gap).toBe(380);
  });

  it('returns 0 gap if loan is closed', () => {
    const asOfDate = new Date('2026-05-06T00:00:00Z');
    const closedLoanWithPayments = {
      ...baseLoan,
      status: 'CLOSED' as const,
      payments: [],
    };
    const gap = calculateGap(closedLoanWithPayments, asOfDate);
    expect(gap).toBe(0);
  });

  it('determines loan health correctly', () => {
    const asOfDate = new Date('2026-05-06T00:00:00Z'); // Expected 600
    const behindLoan = { ...baseLoan, payments: [{ id: '1', loanId: 'test-id', amount: 500, paymentDate: new Date(), note: null, createdAt: new Date(), createdById: null }] };
    const onTrackLoan = { ...baseLoan, payments: [{ id: '1', loanId: 'test-id', amount: 800, paymentDate: new Date(), note: null, createdAt: new Date(), createdById: null }] };

    const behindStatus = getLoanHealthStatus(behindLoan, asOfDate);
    expect(behindStatus.status).toBe('behind');

    const onTrackStatus = getLoanHealthStatus(onTrackLoan, asOfDate);
    expect(onTrackStatus.status).toBe('on-track');
  });

  it('calculates expected amount and gap correctly for a recovery loan', () => {
    const recoveryLoan = {
      ...baseLoan,
      loanType: LoanType.UNKNOWN,
      loanGiven: 50000,
      payments: [
        { id: '1', loanId: 'test-id', amount: 10000, paymentDate: new Date(), note: null, createdAt: new Date(), createdById: null },
      ],
    };
    const expected = calculateExpectedAmount(recoveryLoan);
    expect(expected).toBe(50000);

    const gap = calculateGap(recoveryLoan);
    expect(gap).toBe(40000);
  });
});
