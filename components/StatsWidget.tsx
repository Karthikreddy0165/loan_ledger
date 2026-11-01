'use client';

import React from 'react';
import { DashboardStats } from '@/types/loan';
import { Card } from '@/components/ui/card';
import { InfoTooltip } from '@/components/ui/tooltip';

interface StatsWidgetProps {
  stats: DashboardStats;
}

export default function StatsWidget({ stats }: StatsWidgetProps) {
  const {
    totalLoansGiven,
    totalReceived,
    totalReceivedOnOpen,
    totalOutstanding,
    openLoansCount,
    closedLoansCount,
  } = stats;

  const collectionRate = totalLoansGiven
    ? Math.min(100, (totalReceivedOnOpen / totalLoansGiven) * 100)
    : 0;

  const statItems = [
    {
      label: 'Total Lent',
      value: `₹${totalLoansGiven.toLocaleString('en-IN')}`,
      sub: 'Given out on active loans',
      info: 'Total principal money given to borrowers across all open loans.',
      valueClass: 'text-slate-900 dark:text-white',
    },
    {
      label: 'Received',
      value: `₹${totalReceived.toLocaleString('en-IN')}`,
      sub: 'Total cash collected',
      info: 'Actual cash collected from borrowers across all payments.',
      valueClass: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Pending Balance',
      value: `₹${totalOutstanding.toLocaleString('en-IN')}`,
      sub: 'Still left to collect',
      info: 'Remaining lent money that has not been received yet.',
      valueClass: 'text-amber-600 dark:text-amber-400',
    },
    {
      label: 'Recovery Rate',
      value: `${collectionRate.toFixed(1)}%`,
      sub: 'Received vs money lent',
      info: 'Percentage of lent money that has already been recovered.',
      valueClass: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Open Loans',
      value: `${openLoansCount}`,
      sub: 'Currently running',
      info: 'Number of active loans that borrowers are currently repaying.',
      valueClass: 'text-slate-900 dark:text-white',
    },
    {
      label: 'Closed Loans',
      value: `${closedLoansCount}`,
      sub: 'Fully paid off',
      info: 'Loans that have been completely settled and closed.',
      valueClass: 'text-slate-700 dark:text-slate-300',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
      {statItems.map((item) => (
        <Card
          key={item.label}
          className="p-4 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
        >
          <div>
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {item.label}
              </span>
              <InfoTooltip content={item.info} />
            </div>
            <p className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${item.valueClass}`}>
              {item.value}
            </p>
          </div>
          <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
            {item.sub}
          </p>
        </Card>
      ))}
    </div>
  );
}
