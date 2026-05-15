import { PrismaClient } from '@prisma/client';
import * as xlsx from 'xlsx';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching data from MySQL...');
  const loans = await prisma.loan.findMany();
  const payments = await prisma.payment.findMany();
  const recoveryNotes = await prisma.recoveryNote.findMany();

  console.log(`Found ${loans.length} loans, ${payments.length} payments, ${recoveryNotes.length} recovery notes.`);

  const wb = xlsx.utils.book_new();

  // Convert Decimals and Dates for loans
  const loanData = loans.map(l => ({
    ...l,
    loanGiven: l.loanGiven ? l.loanGiven.toString() : null,
    amountPerInstallment: l.amountPerInstallment ? l.amountPerInstallment.toString() : null,
    interestAmount: l.interestAmount ? l.interestAmount.toString() : null,
    adjustmentReturnAmount: l.adjustmentReturnAmount ? l.adjustmentReturnAmount.toString() : null,
  }));

  const paymentData = payments.map(p => ({
    ...p,
    amount: p.amount ? p.amount.toString() : null,
  }));

  const recoveryData = recoveryNotes.map(r => ({
    ...r,
    promisedAmount: r.promisedAmount ? r.promisedAmount.toString() : null,
  }));

  const wsLoans = xlsx.utils.json_to_sheet(loanData);
  const wsPayments = xlsx.utils.json_to_sheet(paymentData);
  const wsRecovery = xlsx.utils.json_to_sheet(recoveryData);

  xlsx.utils.book_append_sheet(wb, wsLoans, 'Loans');
  xlsx.utils.book_append_sheet(wb, wsPayments, 'Payments');
  xlsx.utils.book_append_sheet(wb, wsRecovery, 'RecoveryNotes');

  const excelPath = './loan_data.xlsx';
  xlsx.writeFile(wb, excelPath);
  console.log(`Data successfully exported to ${excelPath}`);

  // Also save raw JSON for easy migration
  fs.writeFileSync('./loan_data_backup.json', JSON.stringify({ loans, payments, recoveryNotes }, null, 2));
  console.log('Saved raw JSON backup for migration.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
