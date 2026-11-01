import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isDemoSession } from '@/lib/permissions';
import { createAuditLog } from '@/lib/audit';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; noteId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (isDemoSession(session)) {
      return NextResponse.json(
        { error: 'Demo account is in view-only mode. Deleting notes is disabled.' },
        { status: 403 }
      );
    }

    const userId = (session.user as any).id;

    await prisma.recoveryNote.delete({
      where: { id: params.noteId },
    });

    await createAuditLog({
      userId,
      action: 'DELETE',
      entity: 'RecoveryNote',
      entityId: params.noteId,
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
