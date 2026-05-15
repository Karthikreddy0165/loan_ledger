import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recoveryNoteSchema } from '@/lib/validations';
import { ContactMethod, RecoveryStatus } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notes = await prisma.recoveryNote.findMany({
      where: { loanId: params.id },
      orderBy: { contactDate: 'desc' },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error fetching recovery notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recovery notes' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = recoveryNoteSchema.parse(body);

    const note = await prisma.recoveryNote.create({
      data: {
        loanId: params.id,
        note: validated.note,
        contactMethod: validated.contactMethod as ContactMethod,
        status: validated.status as RecoveryStatus,
        contactDate: validated.contactDate ? new Date(validated.contactDate) : new Date(),
        followUpDate: validated.followUpDate ? new Date(validated.followUpDate) : null,
        promisedAmount: validated.promisedAmount ?? null,
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error: any) {
    console.error('Error creating recovery note:', error);
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
      { error: 'Failed to create recovery note' },
      { status: 500 }
    );
  }
}
