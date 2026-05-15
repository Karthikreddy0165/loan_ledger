import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Verify the request if a secret is configured
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const webhookUrl = process.env.BACKUP_WEBHOOK_URL;
    if (!webhookUrl) {
      return NextResponse.json({ error: 'BACKUP_WEBHOOK_URL not configured' }, { status: 500 });
    }

    console.log('Fetching database records for backup...');
    
    // Fetch all data
    const [loans, payments, recoveryNotes] = await Promise.all([
      prisma.loan.findMany(),
      prisma.payment.findMany(),
      prisma.recoveryNote.findMany(),
    ]);

    const backupData = {
      timestamp: new Date().toISOString(),
      project: 'loan_ledger',
      loans,
      payments,
      recoveryNotes,
    };

    console.log('Sending backup to Google Apps Script Webhook...');

    // Send to Google Apps Script Webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backupData),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed with status ${response.status}`);
    }

    const result = await response.json();
    
    if (result.error) {
      throw new Error(`Webhook returned error: ${result.error}`);
    }

    console.log('Backup successful!');
    return NextResponse.json({ success: true, message: 'Backup sent to Google Drive' });

  } catch (error: any) {
    console.error('Backup error:', error);
    return NextResponse.json({ error: 'Failed to complete backup', details: error.message }, { status: 500 });
  }
}
