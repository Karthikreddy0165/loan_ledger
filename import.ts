import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

const toObjectId = (num: number) => num.toString(16).padStart(24, '0');

async function main() {
  console.log('Reading JSON backup...');
  const data = JSON.parse(fs.readFileSync('./loan_data_backup.json', 'utf8'));

  // Clean the DB first
  await prisma.payment.deleteMany();
  await prisma.recoveryNote.deleteMany();
  await prisma.loan.deleteMany();

  console.log('Inserting loans...');
  for (const loan of data.loans) {
    await prisma.loan.create({
      data: {
        id: toObjectId(loan.id),
        borrower: loan.borrower,
        loanType: loan.loanType,
        loanGiven: parseFloat(loan.loanGiven),
        loanDate: loan.loanDate ? new Date(loan.loanDate) : null,
        installmentCount: loan.installmentCount,
        amountPerInstallment: loan.amountPerInstallment ? parseFloat(loan.amountPerInstallment) : null,
        expectedReturnDate: loan.expectedReturnDate ? new Date(loan.expectedReturnDate) : null,
        interestAmount: loan.interestAmount ? parseFloat(loan.interestAmount) : null,
        interestDueDate: loan.interestDueDate ? new Date(loan.interestDueDate) : null,
        adjustmentReturnAmount: loan.adjustmentReturnAmount ? parseFloat(loan.adjustmentReturnAmount) : null,
        adjustmentReturnDate: loan.adjustmentReturnDate ? new Date(loan.adjustmentReturnDate) : null,
        status: loan.status,
        note: loan.note,
        createdAt: new Date(loan.createdAt),
        updatedAt: new Date(loan.updatedAt),
      }
    });
  }

  console.log('Inserting payments...');
  for (const payment of data.payments) {
    await prisma.payment.create({
      data: {
        id: toObjectId(payment.id),
        loanId: toObjectId(payment.loanId),
        amount: parseFloat(payment.amount),
        paymentDate: new Date(payment.paymentDate),
        note: payment.note,
        createdAt: new Date(payment.createdAt),
      }
    });
  }

  console.log('Inserting recovery notes...');
  for (const note of data.recoveryNotes) {
    await prisma.recoveryNote.create({
      data: {
        id: toObjectId(note.id),
        loanId: toObjectId(note.loanId),
        note: note.note,
        contactMethod: note.contactMethod,
        status: note.status,
        contactDate: new Date(note.contactDate),
        followUpDate: note.followUpDate ? new Date(note.followUpDate) : null,
        promisedAmount: note.promisedAmount ? parseFloat(note.promisedAmount) : null,
        createdAt: new Date(note.createdAt),
      }
    });
  }

  console.log('Migration to MongoDB completed successfully.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
