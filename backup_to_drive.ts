import { PrismaClient } from '@prisma/client';
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import { google } from 'googleapis';
import * as path from 'path';

const prisma = new PrismaClient();

// Google Drive folder ID from the user's sharing link
const FOLDER_ID = '1WysFhmm-wqMijlQ9jK87rzkOileir3kf';

// Path to Google Service Account Credentials
// You must obtain a JSON key from Google Cloud Console and place it here
const KEYFILEPATH = path.join(__dirname, 'google-credentials.json');

async function backupToDrive() {
  console.log('Generating Excel backup from database...');

  const loans = await prisma.loan.findMany();
  const payments = await prisma.payment.findMany();
  const recoveryNotes = await prisma.recoveryNote.findMany();

  const wb = xlsx.utils.book_new();

  // Parse types before writing to sheet
  const loanData = loans.map(l => ({
    ...l,
    loanGiven: l.loanGiven ? Number(l.loanGiven) : null,
    amountPerInstallment: l.amountPerInstallment ? Number(l.amountPerInstallment) : null,
    interestAmount: l.interestAmount ? Number(l.interestAmount) : null,
    adjustmentReturnAmount: l.adjustmentReturnAmount ? Number(l.adjustmentReturnAmount) : null,
  }));

  const wsLoans = xlsx.utils.json_to_sheet(loanData);
  const wsPayments = xlsx.utils.json_to_sheet(payments);
  const wsRecovery = xlsx.utils.json_to_sheet(recoveryNotes);

  xlsx.utils.book_append_sheet(wb, wsLoans, 'Loans');
  xlsx.utils.book_append_sheet(wb, wsPayments, 'Payments');
  xlsx.utils.book_append_sheet(wb, wsRecovery, 'RecoveryNotes');

  const excelFileName = `loan_backup_${new Date().toISOString().split('T')[0]}.xlsx`;
  const excelPath = path.join(__dirname, excelFileName);
  
  xlsx.writeFile(wb, excelPath);
  console.log(`Saved temporary backup to ${excelPath}`);

  console.log('Uploading to Google Drive...');
  
  if (!fs.existsSync(KEYFILEPATH)) {
    console.warn('\n⚠️ WARNING: google-credentials.json not found!');
    console.warn('To upload to Google Drive automatically, you need a Google Service Account.');
    console.warn('1. Create a Service Account in Google Cloud Console.');
    console.warn('2. Download the JSON key and save it as "google-credentials.json" in this directory.');
    console.warn(`3. Share the Google Drive folder (${FOLDER_ID}) with the Service Account email address.\n`);
    return;
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });

  const drive = google.drive({ version: 'v3', auth });

  try {
    const fileMetadata = {
      name: excelFileName,
      parents: [FOLDER_ID]
    };
    const media = {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      body: fs.createReadStream(excelPath)
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id'
    });
    console.log(`Successfully uploaded to Google Drive. File ID: ${file.data.id}`);
    
    // Clean up local file
    fs.unlinkSync(excelPath);
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
  }
}

backupToDrive()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
