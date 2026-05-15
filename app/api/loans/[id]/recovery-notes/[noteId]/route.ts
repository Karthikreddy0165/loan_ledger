import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; noteId: string } }
) {
  try {
    await prisma.recoveryNote.delete({
      where: { id: params.noteId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting recovery note:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to delete recovery note' },
      { status: 500 }
    );
  }
}
