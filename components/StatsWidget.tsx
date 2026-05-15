import { DashboardStats } from '@/types/loan';

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
      value: `₹${totalLoansGiven.toLocaleString()}`,
      sub: 'Principal out in the market',
      accent: 'from-blue-400 to-cyan-400',
      iconBg: 'bg-blue-500/10',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-blue-400">
          <path fillRule="evenodd" d="M1 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4Zm12 4a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM4 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm13-1a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM1.75 14.5a.75.75 0 0 0 0 1.5c4.417 0 8.693.603 12.749 1.73 1.111.309 2.251-.512 2.251-1.696v-.784a.75.75 0 0 0-1.5 0v.784a.272.272 0 0 1-.35.25A49.043 49.043 0 0 0 1.75 14.5Z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      label: 'Received',
      value: `₹${totalReceived.toLocaleString()}`,
      sub: 'Cash already collected',
      accent: 'from-emerald-400 to-green-400',
      iconBg: 'bg-emerald-500/10',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-emerald-400">
          <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      label: 'Outstanding',
      value: `₹${totalOutstanding.toLocaleString()}`,
      sub: 'Still to be collected',
      accent: 'from-amber-400 to-orange-400',
      iconBg: 'bg-amber-500/10',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-amber-400">
          <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.732 6.232a2.5 2.5 0 0 1 3.536 0 .75.75 0 1 0 1.06-1.06A4 4 0 0 0 6.5 8v.165c0 .364.034.728.1 1.085h-.35a.75.75 0 0 0 0 1.5h.737a5.25 5.25 0 0 0 3.791 1.5h.263a.75.75 0 0 0 0-1.5h-.263a3.75 3.75 0 0 1-2.477-.933H10a.75.75 0 0 0 0-1.5H7.263a3.063 3.063 0 0 1-.013-.317V8a2.5 2.5 0 0 1 1.482-2.268Z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      label: 'Collection Rate',
      value: `${collectionRate.toFixed(1)}%`,
      sub: 'Received vs open principal',
      accent: 'from-indigo-400 to-violet-400',
      iconBg: 'bg-indigo-500/10',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-indigo-400">
          <path d="M15.5 2A1.5 1.5 0 0 0 14 3.5v13a1.5 1.5 0 0 0 3 0v-13A1.5 1.5 0 0 0 15.5 2ZM10 7a1.5 1.5 0 0 0-3 0v9.5a1.5 1.5 0 0 0 3 0V7ZM5.5 12A1.5 1.5 0 0 0 4 13.5v3a1.5 1.5 0 0 0 3 0v-3A1.5 1.5 0 0 0 5.5 12Z" />
        </svg>
      ),
    },
    {
      label: 'Open Loans',
      value: `${openLoansCount}`,
      sub: 'Currently active',
      accent: 'from-cyan-400 to-blue-400',
      iconBg: 'bg-cyan-500/10',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-cyan-400">
          <path d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm2.25 8.5a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z" />
        </svg>
      ),
    },
    {
      label: 'Closed',
      value: `${closedLoansCount}`,
      sub: 'Completed history',
      accent: 'from-slate-400 to-gray-400',
      iconBg: 'bg-slate-500/10',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-slate-400">
          <path fillRule="evenodd" d="M6 4.75A.75.75 0 0 1 6.75 4h10.5a.75.75 0 0 1 0 1.5H6.75A.75.75 0 0 1 6 4.75ZM6 10a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H6.75A.75.75 0 0 1 6 10Zm0 5.25a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 0 1.5H6.75a.75.75 0 0 1-.75-.75ZM1.99 4.75a1 1 0 0 1 1-1h.01a1 1 0 0 1 0 2h-.01a1 1 0 0 1-1-1ZM2.99 9a1 1 0 1 0 0 2h.01a1 1 0 1 0 0-2h-.01ZM1.99 15.25a1 1 0 0 1 1-1h.01a1 1 0 0 1 0 2h-.01a1 1 0 0 1-1-1Z" clipRule="evenodd" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-8">
      {statItems.map((item, index) => (
        <div
          key={item.label}
          className="stat-card group hover:bg-white/[0.06] transition-all duration-300"
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={`${item.iconBg} p-2 rounded-lg`}>
              {item.icon}
            </div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {item.label}
            </p>
          </div>
          <p className={`text-2xl font-bold bg-gradient-to-r ${item.accent} bg-clip-text text-transparent`}>
            {item.value}
          </p>
          <p className="mt-1.5 text-[11px] text-slate-500">{item.sub}</p>
        </div>
      ))}
    </div>
  );
}
