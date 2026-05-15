import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { loanSchema } from '@/lib/validations';
import { LoanType, LoanStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as LoanStatus | null;
    const loanType = searchParams.get('loanType') as LoanType | null;

    const loans = await prisma.loan.findMany({
      where: {
        ...(status && { status }),
        ...(loanType && { loanType }),
      },
      include: {
        payments: true,
      },
      orderBy: [
        { status: 'asc' },
        { loanDate: 'desc' },
      ],
    });

    return NextResponse.json(loans);
  } catch (error) {
    console.error('Error fetching loans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loans' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = loanSchema.parse(body);

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const loan = await prisma.loan.create({
      data: {
        borrower: validated.borrower,
        loanType: validated.loanType as LoanType,
        loanGiven: validated.loanGiven,
        loanDate: validated.loanDate ? new Date(validated.loanDate) : null,
        installmentCount: validated.installmentCount,
        amountPerInstallment: validated.amountPerInstallment,
        expectedReturnDate: validated.expectedReturnDate ? new Date(validated.expectedReturnDate) : null,
        interestAmount: validated.interestAmount,
        interestDueDate: validated.interestDueDate ? new Date(validated.interestDueDate) : null,
        adjustmentReturnAmount: validated.adjustmentReturnAmount,
        adjustmentReturnDate: validated.adjustmentReturnDate ? new Date(validated.adjustmentReturnDate) : null,
        status: (validated.status as LoanStatus) || LoanStatus.OPEN,
        note: validated.note,
        createdById: userId,
      },
      include: {
        payments: true,
      },
    });

    await createAuditLog({
      userId,
      action: 'CREATE',
      entity: 'Loan',
      entityId: loan.id,
      details: { borrower: loan.borrower, loanGiven: loan.loanGiven },
    });

    return NextResponse.json(loan, { status: 201 });
  } catch (error: any) {
    console.error('Error creating loan:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create loan' },
      { status: 500 }
    );
  }
}
