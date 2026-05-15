import { Loan, Payment, LoanType, LoanStatus } from '@prisma/client';

export type { Loan, Payment, LoanType, LoanStatus };

export interface LoanWithPayments extends Loan {
  payments: Payment[];
}

export interface RecoveryNoteType {
  id: string;
  loanId: string;
  note: string;
  contactMethod: string;
  status: string;
  contactDate: Date;
  followUpDate: Date | null;
  promisedAmount: number | null;
  createdAt: Date;
}

export interface LoanWithCalculations extends LoanWithPayments {
  receivedTotal: number;
  expectedAmount: number;
  gap: number;
  progress: number;
}

export interface DashboardStats {
  totalLoansGiven: number;
  totalReceived: number;
  totalReceivedOnOpen: number;
  totalOutstanding: number;
  openLoansCount: number;
  closedLoansCount: number;
}

export interface CategoryStats {
  totalGiven: number;
  totalReceived: number;
  totalExpected: number;
  totalGap: number;
}

