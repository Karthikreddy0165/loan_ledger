'use client';

import React, { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import { LoanWithPayments } from '@/types/loan';
import { LoanType } from '@prisma/client';
import {
  calculateExpectedAmount,
  calculateGap,
  calculateReceivedTotal,
  calculateLoanEndDate,
} from '@/lib/calculations';
import { format, differenceInDays } from 'date-fns';

interface ExportDefaultersProps {
  loans: LoanWithPayments[];
}

interface DefaulterInfo {
  loan: LoanWithPayments;
  borrower: string;
  loanType: LoanType;
  loanGiven: number;
  expected: number;
  received: number;
  gap: number;
  amountPerInst: number;
  missedInst: number;
  startDate: string;
  endDate: string;
  paidPercentage: number;
  totalBalance: number;
  daysAfterClosure: number;
}

export default function ExportDefaulters({ loans }: ExportDefaultersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  
  // Card ref for capturing
  const cardRef = useRef<HTMLDivElement>(null);
  const [activeCardData, setActiveCardData] = useState<DefaulterInfo | null>(null);

  // 1. Identify defaulters who missed >= 5 installments
  const defaulters: DefaulterInfo[] = [];

  loans.forEach((loan) => {
    if (loan.status !== 'OPEN') return;

    const gap = calculateGap(loan);
    if (gap <= 0) return;

    let amountPerInst = 0;
    let threshold = 0;

    if (loan.loanType === LoanType.DAILY) {
      amountPerInst = Number(loan.amountPerInstallment || 0);
      threshold = 5; // more than 4 days
    } else if (loan.loanType === LoanType.WEEKLY) {
      amountPerInst = Number(loan.amountPerInstallment || 0);
      threshold = 3; // more than 2 weeks
    }

    if (amountPerInst <= 0 || threshold === 0) return;

    const missedInst = Math.ceil(gap / amountPerInst);
    
    if (missedInst >= threshold) {
      const received = calculateReceivedTotal(loan.payments);
      const expected = calculateExpectedAmount(loan);
      const loanGiven = Number(loan.loanGiven);
      const paidPercentage = loanGiven > 0 ? Math.min((received / loanGiven) * 100, 100) : 0;
      
      const endDateObj = calculateLoanEndDate(loan);
      const startDate = loan.loanDate ? format(new Date(loan.loanDate), 'dd MMM yyyy') : '—';
      const endDate = endDateObj ? format(endDateObj, 'dd MMM yyyy') : '—';

      const totalBalance = Math.max(0, loanGiven - received);
      const daysAfterClosure = endDateObj ? differenceInDays(new Date(), endDateObj) : 0;

      defaulters.push({
        loan,
        borrower: loan.borrower,
        loanType: loan.loanType,
        loanGiven,
        expected,
        received,
        gap,
        amountPerInst,
        missedInst,
        startDate,
        endDate,
        paidPercentage,
        totalBalance,
        daysAfterClosure,
      });
    }
  });

  // Open modal & initialize selected state
  const handleOpen = () => {
    const initial: Record<string, boolean> = {};
    defaulters.forEach((d) => {
      initial[d.loan.id] = true;
    });
    setSelectedIds(initial);
    setIsOpen(true);
  };

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Select all or deselect all
  const isAllSelected = defaulters.length > 0 && defaulters.every((d) => selectedIds[d.loan.id]);
  const toggleSelectAll = () => {
    const next: Record<string, boolean> = {};
    defaulters.forEach((d) => {
      next[d.loan.id] = !isAllSelected;
    });
    setSelectedIds(next);
  };

  const selectedCount = defaulters.filter((d) => selectedIds[d.loan.id]).length;

  // Render & download PNG for each selected defaulter
  const handleDownload = async () => {
    const selectedDefaulters = defaulters.filter((d) => selectedIds[d.loan.id]);
    if (selectedDefaulters.length === 0) return;

    setIsGenerating(true);
    
    // Process one by one
    for (let i = 0; i < selectedDefaulters.length; i++) {
      const def = selectedDefaulters[i];
      setProgressMsg(`Preparing card for ${def.borrower} (${i + 1}/${selectedDefaulters.length})...`);
      
      // Set active data so it renders in the DOM card ref
      setActiveCardData(def);
      
      // Give React a small tick to render the card
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (cardRef.current) {
        setProgressMsg(`Generating image for ${def.borrower}...`);
        try {
          // Add a minor delay to make sure styles/fonts apply
          await new Promise((resolve) => setTimeout(resolve, 150));
          
          const dataUrl = await toPng(cardRef.current, {
            quality: 0.95,
            pixelRatio: 2, // High resolution
            cacheBust: true,
          });

          // Trigger download
          const link = document.createElement('a');
          const cleanName = def.borrower.replace(/[^a-zA-Z0-9]/g, '_');
          link.download = `${cleanName}_Missed_${def.missedInst}_Installments.png`;
          link.href = dataUrl;
          link.click();
        } catch (error) {
          console.error(`Failed to generate image for ${def.borrower}:`, error);
        }
      }
    }

    setIsGenerating(false);
    setActiveCardData(null);
    setProgressMsg('');
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/30 transition-all duration-200 text-sm font-semibold rounded-xl shadow-lg shadow-rose-950/10 cursor-pointer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4.5 h-4.5">
          <path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 0 1 3.25 3h13.5A2.25 2.25 0 0 1 19 5.25v9.5A2.25 2.25 0 0 1 16.75 17H3.25A2.25 2.25 0 0 1 1 14.75v-9.5Zm3 .75a.75.75 0 0 0 0 1.5h12a.75.75 0 0 0 0-1.5H4Zm0 3.5a.75.75 0 0 0 0 1.5h8a.75.75 0 0 0 0-1.5H4Zm0 3.5a.75.75 0 0 0 0 1.5h5a.75.75 0 0 0 0-1.5H4Z" clipRule="evenodd" />
        </svg>
        Defaulter Cards
        {defaulters.length > 0 && (
          <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">
            {defaulters.length}
          </span>
        )}
      </button>

      {/* Main Selection Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#111626] border border-white/[0.08] rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl animate-fade-in-up">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/[0.06] flex justify-between items-center bg-[#0d111d] rounded-t-2xl">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <span className="text-xl">🖼️</span> Defaulter Cards Export
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Generates status cards as PNG screenshots to share on WhatsApp
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                disabled={isGenerating}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto flex-1 bg-[#111626]">
              {defaulters.length === 0 ? (
                <div className="text-center py-12 text-slate-500 italic text-sm">
                  No borrowers found matching the missed installments criteria (Daily 5+ days, Weekly 3+ weeks).
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Select All Option */}
                  <div className="flex justify-between items-center bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl mb-2">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        disabled={isGenerating}
                        className="w-4 h-4 rounded border-white/[0.1] bg-white/[0.04] text-rose-500 focus:ring-rose-500"
                      />
                      <span className="text-sm font-semibold text-slate-300">
                        {isAllSelected ? 'Deselect All' : 'Select All'}
                      </span>
                    </label>
                    <span className="text-xs text-slate-400 font-medium">
                      Selected: {selectedCount} of {defaulters.length}
                    </span>
                  </div>

                  {/* List of Defaulters */}
                  <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                    {defaulters.map((def) => (
                      <div
                        key={def.loan.id}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                          selectedIds[def.loan.id]
                            ? 'bg-rose-500/[0.03] border-rose-500/20'
                            : 'bg-white/[0.01] border-white/[0.05]'
                        }`}
                      >
                        <label className="flex items-center gap-3.5 flex-1 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={!!selectedIds[def.loan.id]}
                            onChange={() => toggleSelect(def.loan.id)}
                            disabled={isGenerating}
                            className="w-4 h-4 rounded border-white/[0.1] bg-white/[0.04] text-rose-500 focus:ring-rose-500/50"
                          />
                          <div>
                            <span className="font-semibold text-sm text-slate-200 block">
                              {def.borrower}
                            </span>
                            <span className="text-[11px] text-slate-400 capitalize block mt-0.5">
                              {def.loanType.toLowerCase()} loan · ₹{def.loanGiven.toLocaleString()}
                            </span>
                          </div>
                        </label>
                        <div className="text-right">
                          <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/10 mb-1">
                            {def.missedInst} Missed
                          </span>
                          <span className="text-xs font-semibold text-slate-300 block">
                            Bal: ₹{def.totalBalance.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Gap: ₹{def.gap.toLocaleString()}
                          </span>
                          {def.daysAfterClosure > 0 && (
                            <span className="text-[10px] text-amber-500 font-semibold block mt-0.5">
                              {def.daysAfterClosure}d past closure
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-white/[0.06] bg-[#0d111d] flex flex-col sm:flex-row gap-3 justify-end items-center rounded-b-2xl">
              {isGenerating && (
                <div className="text-rose-400 text-xs font-medium flex items-center gap-2 mr-auto">
                  <svg className="animate-spin h-4 w-4 text-rose-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>{progressMsg}</span>
                </div>
              )}
              <div className="flex gap-2.5 w-full sm:w-auto">
                <button
                  onClick={() => setIsOpen(false)}
                  disabled={isGenerating}
                  className="w-1/2 sm:w-auto px-5 py-2.5 rounded-xl border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.04] text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDownload}
                  disabled={isGenerating || selectedCount === 0}
                  className="w-1/2 sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-rose-950/20 flex justify-center items-center gap-2 cursor-pointer"
                >
                  Download {selectedCount} Cards
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Render offscreen card markup for screenshot capture */}
      {activeCardData && (
        <div
          style={{
            position: 'absolute',
            top: '-9999px',
            left: '-9999px',
            width: '450px',
            height: 'auto',
            overflow: 'hidden',
          }}
        >
          <div
            ref={cardRef}
            className="bg-[#0b0f19] text-white p-7 rounded-none border-2 border-white/[0.08] shadow-2xl relative w-[450px]"
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              boxSizing: 'border-box',
            }}
          >
            {/* Elegant Header Accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-red-500 to-amber-500" />
            
            {/* Status Alert Banner */}
            <div className="flex justify-between items-center mb-5 mt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-rose-500 text-sm">⚠️</span>
                <span className="text-rose-500 font-extrabold text-[11px] uppercase tracking-wider">
                  Dues Overdue Alert
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">
                As of {format(new Date(), 'dd MMM yyyy')}
              </span>
            </div>

            {/* Borrower Details */}
            <div className="mb-6 pb-5 border-b border-white/[0.06]">
              <h2 className="text-[26px] font-black tracking-tight text-white mb-1.5 leading-tight">
                {activeCardData.borrower}
              </h2>
              <p className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span className="capitalize">{activeCardData.loanType.toLowerCase()} Loan</span> · Given ₹{activeCardData.loanGiven.toLocaleString()}
              </p>
            </div>

            {/* Overdue Callout Block */}
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mb-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider block mb-0.5">
                  Overdue Gap
                </span>
                <span className="text-2xl font-black text-rose-400">
                  ₹{activeCardData.gap.toLocaleString()}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-0.5">
                  Status
                </span>
                <span className="text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-md inline-block mt-0.5">
                  {activeCardData.missedInst} {activeCardData.loanType === LoanType.DAILY ? 'Days' : activeCardData.loanType === LoanType.WEEKLY ? 'Weeks' : 'Payments'} Missed
                </span>
              </div>
            </div>

            {/* Stat Rows */}
            <div className="space-y-3.5 mb-6 text-sm">
              <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                <span className="text-slate-400 text-xs font-medium">Installment Amount</span>
                <span className="text-slate-200 font-bold">
                  ₹{activeCardData.amountPerInst.toLocaleString()} / {activeCardData.loanType === LoanType.DAILY ? 'day' : activeCardData.loanType === LoanType.WEEKLY ? 'week' : 'month'}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                <span className="text-slate-400 text-xs font-medium">Expected Till Date</span>
                <span className="text-slate-200 font-bold">₹{activeCardData.expected.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                <span className="text-slate-400 text-xs font-medium">Received Amount</span>
                <span className="text-slate-200 font-bold">₹{activeCardData.received.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                <span className="text-slate-400 text-xs font-medium">Total Balance</span>
                <span className="text-rose-400 font-extrabold">₹{activeCardData.totalBalance.toLocaleString()}</span>
              </div>
              {activeCardData.daysAfterClosure > 0 && (
                <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                  <span className="text-slate-400 text-xs font-medium">Days After Loan Closure</span>
                  <span className="text-amber-400 font-extrabold">{activeCardData.daysAfterClosure} Days Past</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs font-medium">Loan Period</span>
                <span className="text-slate-300 text-xs font-semibold">
                  {activeCardData.startDate} to {activeCardData.endDate}
                </span>
              </div>
            </div>

            {/* Collection Progress */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  Payment Collection Progress
                </span>
                <span className="text-xs font-extrabold text-slate-300">
                  {activeCardData.paidPercentage.toFixed(0)}%
                </span>
              </div>
              <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden border border-white/[0.02]">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    activeCardData.paidPercentage >= 100
                      ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                      : activeCardData.paidPercentage >= 50
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-400'
                      : 'bg-gradient-to-r from-rose-500 to-red-400'
                  }`}
                  style={{ width: `${activeCardData.paidPercentage}%` }}
                />
              </div>
            </div>

            {/* Footer Sign-off */}
            <div className="border-t border-white/[0.06] pt-4 mt-6 text-center">
              <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                Loan Ledger Automated Report
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
