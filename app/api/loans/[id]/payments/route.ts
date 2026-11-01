import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { paymentSchema } from '@/lib/validations';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isDemoSession } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payments = await prisma.payment.findMany({
      where: { loanId: params.id },
      orderBy: { paymentDate: 'desc' },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

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
        { error: 'Demo account is in view-only mode. Recording payments is disabled.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = paymentSchema.parse(body);
    const userId = (session.user as any).id;

    const payment = await prisma.payment.create({
      data: {
        loanId: params.id,
        amount: validated.amount,
        paymentDate: validated.paymentDate ? new Date(validated.paymentDate) : new Date(),
        note: validated.note,
        createdById: userId,
      },
    });

    await createAuditLog({
      userId,
      action: 'CREATE',
      entity: 'Payment',
      entityId: payment.id,
      details: { loanId: params.id, amount: payment.amount },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    console.error('Error creating payment:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    if (error.code === 'P2003') {
      return NextResponse.json({ error: 'Loan not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
