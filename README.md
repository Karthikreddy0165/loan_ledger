# Loan Ledger

A professional, real-time micro-lending and payment tracking system designed to manage borrower ledgers, schedules, and interest metrics. Built to manage portfolio calculations for private money lending operations.

## Features

- **Dashboard Insights**: Overview of total loans, outstanding balances, expected collection rates, and follow-up gaps.
- **Interest Engines**: Programmed support for Daily, Weekly, and Monthly (Interest-Only) lending models.
- **Defaulter & Overdue Alerts**: Highlights inactive accounts and missing installments.
- **Recovery Auditing**: Custom notes trail to track borrower follow-ups.
- **Exporting**: Generate defaulter sheets and PDF/Excel records for team sharing.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Database**: MongoDB (via Prisma ORM)
- **Authentication**: NextAuth.js (Credentials Provider)
- **Styling**: Tailwind CSS

## Getting Started

1. Clone the repository and configure environment variables in `.env`:
   ```env
   MONGODB_URI="your-mongodb-connection-string"
   NEXTAUTH_SECRET="your-nextauth-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```
2. Run database migrations:
   ```bash
   npx prisma db push
   ```
3. Boot up the local server:
   ```bash
   npm run dev
   ```
