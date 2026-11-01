'use client';

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { useTheme } from './ThemeProvider';
import { Card } from '@/components/ui/card';
import { InfoTooltip } from '@/components/ui/tooltip';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';

export interface ProductMetric {
  type: string;
  label: string;
  count: number;
  totalGiven: number;
  totalReceived: number;
  totalExpected: number;
  totalGap: number;
}

const PALETTE = [
  { stroke: '#2563eb', fill: '#3b82f6', label: 'Daily' },
  { stroke: '#059669', fill: '#10b981', label: 'Weekly' },
  { stroke: '#d97706', fill: '#f59e0b', label: 'Monthly' },
  { stroke: '#7c3aed', fill: '#8b5cf6', label: 'Adjustment' },
  { stroke: '#e11d48', fill: '#f43f5e', label: 'Recovery' },
];

export default function AnalyticsCharts({
  distributionData,
  trendData,
  productMetrics = [],
}: {
  distributionData: { name: string; value: number }[];
  trendData: { date: string; amount: number }[];
  productMetrics?: ProductMetric[];
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const totalPortfolio = useMemo(() => {
    return (distributionData || []).reduce((acc, curr) => acc + (curr.value || 0), 0);
  }, [distributionData]);

  const { trendTotal, trendAvg } = useMemo(() => {
    const list = trendData || [];
    const sum = list.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const avg = list.length > 0 ? Math.round(sum / list.length) : 0;
    return { trendTotal: sum, trendAvg: avg };
  }, [trendData]);

  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDark ? '#1e293b' : '#e2e8f0';
  const tooltipText = isDark ? '#f8fafc' : '#0f172a';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const axisColor = isDark ? '#64748b' : '#94a3b8';

  return (
    <div className="space-y-4 mb-6">
      {/* 2-Column Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* 30-Day Collection Trend */}
        <Card className="lg:col-span-7 p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Collections (Last 30 Days)
                </h3>
                <InfoTooltip content="Cash collected from borrowers day-by-day over the last 30 calendar days." />
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-slate-500 font-sans">
                  30d Total: <strong className="font-mono text-slate-800 dark:text-slate-200">₹{trendTotal.toLocaleString('en-IN')}</strong>
                </span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span className="text-slate-500 font-sans">
                  Daily Avg: <strong className="font-mono text-emerald-600 dark:text-emerald-400">₹{trendAvg.toLocaleString('en-IN')}</strong>
                </span>
              </div>
            </div>

            <div className="h-[230px] w-full pt-3">
              {trendData && trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="collectionGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={isDark ? 0.35 : 0.25} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke={axisColor}
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      dy={5}
                    />
                    <YAxis
                      stroke={axisColor}
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `₹${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: tooltipBg,
                        borderColor: tooltipBorder,
                        borderRadius: '8px',
                        color: tooltipText,
                        fontSize: '11px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        padding: '8px 12px',
                      }}
                      formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Collected']}
                      labelStyle={{ fontWeight: 600, marginBottom: '2px', color: tooltipText }}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#collectionGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No collections recorded in the last 30 days
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Portfolio Distribution */}
        <Card className="lg:col-span-5 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Loan Distribution
                </h3>
                <InfoTooltip content="How your total money lent is spread across different loan types." />
              </div>
              <span className="text-xs font-mono font-semibold text-slate-500">
                Total: ₹{totalPortfolio.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center pt-2">
              <div className="sm:col-span-6 h-[190px] w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {distributionData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length].fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: tooltipBg,
                        borderColor: tooltipBorder,
                        borderRadius: '8px',
                        color: tooltipText,
                        fontSize: '11px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        padding: '6px 10px',
                      }}
                      formatter={(val: any, name: any) => [
                        `₹${Number(val).toLocaleString('en-IN')}`,
                        name?.toString().toUpperCase() === 'UNKNOWN' ? 'Recovery' : name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Active</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {distributionData.length} Types
                  </span>
                </div>
              </div>

              {/* Distribution Legend List */}
              <div className="sm:col-span-6 space-y-2 text-xs">
                {distributionData.map((d, index) => {
                  const color = PALETTE[index % PALETTE.length].fill;
                  const percent = totalPortfolio > 0 ? ((d.value / totalPortfolio) * 100).toFixed(0) : '0';
                  const displayName =
                    d.name.toUpperCase() === 'UNKNOWN'
                      ? 'Recovery'
                      : d.name.charAt(0).toUpperCase() + d.name.slice(1).toLowerCase();
                  return (
                    <div key={d.name} className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: color }} />
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {displayName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <span>₹{(d.value / 1000).toFixed(0)}k</span>
                        <span className="text-slate-400 text-[10px]">({percent}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Clean Comparison Matrix Table (Layman Friendly) */}
      {productMetrics.length > 0 && (
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-2">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Performance by Loan Type
              </h3>
              <InfoTooltip content="Summary of money lent, recovered, and missing payments for each loan type." />
            </div>
            <span className="text-xs text-slate-500">
              {productMetrics.reduce((sum, p) => sum + p.count, 0)} total open loans
            </span>
          </div>

          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loan Type</TableHead>
                  <TableHead className="text-right">Open Loans</TableHead>
                  <TableHead className="text-right">Total Lent</TableHead>
                  <TableHead className="text-right">Collected</TableHead>
                  <TableHead className="text-right">Recovery Rate</TableHead>
                  <TableHead className="text-right">Missing Gap</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productMetrics.map((pm, index) => {
                  const color = PALETTE[index % PALETTE.length].fill;
                  const rate = pm.totalGiven > 0 ? (pm.totalReceived / pm.totalGiven) * 100 : 0;
                  return (
                    <TableRow key={pm.type}>
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-xs" style={{ backgroundColor: color }} />
                          <span>{pm.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-slate-600 dark:text-slate-400">
                        {pm.count}
                      </TableCell>
                      <TableCell className="text-right font-mono text-slate-900 dark:text-slate-100 font-medium">
                        ₹{pm.totalGiven.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                        ₹{pm.totalReceived.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        <span className={rate >= 75 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-600 dark:text-slate-400'}>
                          {rate.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {pm.totalGap > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 shadow-xs">
                            ₹{pm.totalGap.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold">On Track</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
