import { describe, it, expect } from 'vitest';
import { loanSchema, paymentSchema } from '../lib/validations';

describe('Zod Validations', () => {
  describe('loanSchema', () => {
    it('validates a correct loan object', () => {
      const validLoan = {
        borrower: 'John Doe',
        loanType: 'DAILY',
        loanGiven: 5000,
        loanDate: '2026-05-01',
        installmentCount: 50,
        amountPerInstallment: 120,
      };
      const result = loanSchema.safeParse(validLoan);
      expect(result.success).toBe(true);
    });

    it('fails when borrower name is empty', () => {
      const invalidLoan = {
        borrower: '',
        loanType: 'DAILY',
        loanGiven: 5000,
      };
      const result = loanSchema.safeParse(invalidLoan);
      expect(result.success).toBe(false);
      if (!result.success) {
        const borrowerError = result.error.issues.find(i => i.path.includes('borrower'));
        expect(borrowerError?.message).toMatch(/Borrower name is required/);
      }
    });

    it('fails when loan amount is negative', () => {
      const invalidLoan = {
        borrower: 'John',
        loanType: 'DAILY',
        loanGiven: -100,
      };
      const result = loanSchema.safeParse(invalidLoan);
      expect(result.success).toBe(false);
    });
  });

  describe('paymentSchema', () => {
    it('validates a correct payment', () => {
      const validPayment = {
        amount: 500,
        paymentDate: '2026-05-10',
      };
      const result = paymentSchema.safeParse(validPayment);
      expect(result.success).toBe(true);
    });

    it('fails on non-positive payment amount', () => {
      const result = paymentSchema.safeParse({ amount: 0 });
      expect(result.success).toBe(false);
    });
  });
});
