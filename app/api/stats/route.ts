import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LoanStatus } from '@prisma/client';

export async function GET() {
  try {
    const [openLoanAgg, allPaymentsAgg, openPaymentsAgg, openLoansCount, closedLoansCount] =
      await Promise.all([
        prisma.loan.aggregate({
          where: { status: LoanStatus.OPEN },
          _sum: {
            loanGiven: true,
          },
        }),
        prisma.payment.aggregate({
          _sum: {
            amount: true,
          },
        }),
        prisma.payment.aggregate({
          where: {
            loan: {
              status: LoanStatus.OPEN,
            },
          },
          _sum: {
            amount: true,
          },
        }),
        prisma.loan.count({
          where: { status: LoanStatus.OPEN },
        }),
        prisma.loan.count({
          where: { status: LoanStatus.CLOSED },
        }),
      ]);

    const totalLoansGiven = Number(openLoanAgg._sum.loanGiven ?? 0); // only open loans
    const totalReceived = Number(allPaymentsAgg._sum.amount ?? 0); // all payments
    const totalReceivedOnOpen = Number(openPaymentsAgg._sum.amount ?? 0);
    const totalOutstanding = totalLoansGiven - totalReceivedOnOpen; // only open book outstanding

    return NextResponse.json({
      totalLoansGiven,
      totalReceived,
      totalOutstanding,
      openLoansCount,
      closedLoansCount,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

