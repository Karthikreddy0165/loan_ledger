import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LoanStatus } from '@prisma/client';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const loan = await prisma.loan.update({
      where: { id: params.id },
      data: {
        status: LoanStatus.CLOSED,
      },
      include: {
        payments: true,
      },
    });

    return NextResponse.json(loan);
  } catch (error: any) {
    console.error('Error closing loan:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to close loan' },
      { status: 500 }
    );
  }
}
