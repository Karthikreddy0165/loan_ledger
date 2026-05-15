import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateLoanSchema } from '@/lib/validations';
import { LoanType, LoanStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const loan = await prisma.loan.findUnique({
      where: { id: params.id },
      include: {
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!loan) {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }

    return NextResponse.json(loan);
  } catch (error) {
    console.error('Error fetching loan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loan' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = updateLoanSchema.parse(body);

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const loan = await prisma.loan.update({
      where: { id: params.id },
      data: {
        ...(validated.borrower && { borrower: validated.borrower }),
        ...(validated.loanType && { loanType: validated.loanType as LoanType }),
        ...(validated.loanGiven !== undefined && { loanGiven: validated.loanGiven }),
        ...(validated.loanDate !== undefined && {
          loanDate: validated.loanDate ? new Date(validated.loanDate) : null,
        }),
        ...(validated.installmentCount !== undefined && { installmentCount: validated.installmentCount }),
        ...(validated.amountPerInstallment !== undefined && {
          amountPerInstallment: validated.amountPerInstallment,
        }),
        ...(validated.expectedReturnDate !== undefined && {
          expectedReturnDate: validated.expectedReturnDate ? new Date(validated.expectedReturnDate) : null,
        }),
        ...(validated.interestAmount !== undefined && { interestAmount: validated.interestAmount }),
        ...(validated.interestDueDate !== undefined && {
          interestDueDate: validated.interestDueDate ? new Date(validated.interestDueDate) : null,
        }),
        ...(validated.adjustmentReturnAmount !== undefined && {
          adjustmentReturnAmount: validated.adjustmentReturnAmount,
        }),
        ...(validated.adjustmentReturnDate !== undefined && {
          adjustmentReturnDate: validated.adjustmentReturnDate ? new Date(validated.adjustmentReturnDate) : null,
        }),
        ...(validated.status && { status: validated.status as LoanStatus }),
        ...(validated.note !== undefined && { note: validated.note }),
        updatedById: userId,
      },
      include: {
        payments: true,
      },
    });

    await createAuditLog({
      userId,
      action: 'UPDATE',
      entity: 'Loan',
      entityId: loan.id,
      details: validated,
    });

    return NextResponse.json(loan);
  } catch (error: any) {
    console.error('Error updating loan:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to update loan' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    await prisma.loan.delete({
      where: { id: params.id },
    });

    await createAuditLog({
      userId,
      action: 'DELETE',
      entity: 'Loan',
      entityId: params.id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting loan:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to delete loan' },
      { status: 500 }
    );
  }
}
