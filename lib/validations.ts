import { z } from 'zod';

export const loanSchema = z.object({
  borrower: z.string().min(1, 'Borrower name is required'),
  loanType: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'ADJUSTMENT', 'UNKNOWN']),
  loanGiven: z.number().positive('Loan amount must be positive'),
  loanDate: z.string().nullable().optional(),
  installmentCount: z.number().int().positive().nullable().optional(),
  amountPerInstallment: z.number().positive().nullable().optional(),
  expectedReturnDate: z.string().nullable().optional(),
  interestAmount: z.number().positive().nullable().optional(),
  interestDueDate: z.string().nullable().optional(),
  adjustmentReturnAmount: z.number().positive().nullable().optional(),
  adjustmentReturnDate: z.string().nullable().optional(),
  status: z.enum(['OPEN', 'CLOSED']).optional(),
  note: z.string().nullable().optional(),
});

export const paymentSchema = z.object({
  amount: z.number().positive('Payment amount must be positive'),
  paymentDate: z.string().optional(),
  note: z.string().nullable().optional(),
});

export const recoveryNoteSchema = z.object({
  note: z.string().min(1, 'Note is required'),
  contactMethod: z.enum(['PHONE', 'VISIT', 'MESSAGE', 'OTHER']).default('PHONE'),
  status: z.enum(['PROMISED', 'NO_RESPONSE', 'PARTIAL', 'DENIED', 'FOLLOW_UP', 'RESOLVED']).default('FOLLOW_UP'),
  contactDate: z.string().optional(),
  followUpDate: z.string().nullable().optional(),
  promisedAmount: z.number().positive().nullable().optional(),
});

export const updateLoanSchema = loanSchema.partial();

export type LoanInput = z.infer<typeof loanSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type RecoveryNoteInput = z.infer<typeof recoveryNoteSchema>;
export type UpdateLoanInput = z.infer<typeof updateLoanSchema>;
