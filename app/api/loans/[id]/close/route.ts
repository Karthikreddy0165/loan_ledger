import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LoanStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isDemoSession } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (isDemoSession(session)) {
      return NextResponse.json(
        { error: 'Demo account is in view-only mode. Closing loans is disabled.' },
        { status: 403 }
      );
    }

    const userId = (session.user as any).id;

    const loan = await prisma.loan.update({
      where: { id: params.id },
      data: {
        status: LoanStatus.CLOSED,
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
      details: { action: 'CLOSED_LOAN', borrower: loan.borrower },
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
