import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { paymentSchema } from '@/lib/validations';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isDemoSession } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';

export async function PATCH(
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
        { error: 'Demo account is in view-only mode. Editing payments is disabled.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = paymentSchema.partial().parse(body);
    const userId = (session.user as any).id;

    const payment = await prisma.payment.update({
      where: { id: params.id },
      data: {
        ...(validated.amount !== undefined && { amount: validated.amount }),
        ...(validated.paymentDate !== undefined && {
          paymentDate: validated.paymentDate ? new Date(validated.paymentDate) : new Date(),
        }),
        ...(validated.note !== undefined && { note: validated.note }),
      },
    });

    await createAuditLog({
      userId,
      action: 'UPDATE',
      entity: 'Payment',
      entityId: payment.id,
      details: validated,
    });

    return NextResponse.json(payment);
  } catch (error: any) {
    console.error('Error updating payment:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to update payment' },
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

    if (isDemoSession(session)) {
      return NextResponse.json(
        { error: 'Demo account is in view-only mode. Deleting payments is disabled.' },
        { status: 403 }
      );
    }

    const userId = (session.user as any).id;

    await prisma.payment.delete({
      where: { id: params.id },
    });

    await createAuditLog({
      userId,
      action: 'DELETE',
      entity: 'Payment',
      entityId: params.id,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting payment:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to delete payment' },
      { status: 500 }
    );
  }
}
