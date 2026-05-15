import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { paymentSchema } from '@/lib/validations';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = paymentSchema.partial().parse(body);

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
    await prisma.payment.delete({
      where: { id: params.id },
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
