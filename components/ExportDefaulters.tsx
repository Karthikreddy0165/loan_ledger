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
import { AlertTriangle, FileImage, X, Download, CheckSquare, Square, Loader2 } from 'lucide-react';

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
  
  const cardRef = useRef<HTMLDivElement>(null);
  const [activeCardData, setActiveCardData] = useState<DefaulterInfo | null>(null);

  // Identify defaulters who missed installments
  const defaulters: DefaulterInfo[] = [];

  loans.forEach((loan) => {
    if (loan.status !== 'OPEN') return;

    const gap = calculateGap(loan);
    if (gap <= 0) return;

    let amountPerInst = 0;
    let threshold = 0;

    if (loan.loanType === LoanType.DAILY) {
      amountPerInst = Number(loan.amountPerInstallment || 0);
      threshold = 5;
    } else if (loan.loanType === LoanType.WEEKLY) {
      amountPerInst = Number(loan.amountPerInstallment || 0);
      threshold = 3;
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
      const daysAfterClosure = endDateObj ? Math.max(0, differenceInDays(new Date(), endDateObj)) : 0;

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

  const handleOpen = () => {
    const initial: Record<string, boolean> = {};
    defaulters.forEach((d) => {
      initial[d.loan.id] = true;
    });
    setSelectedIds(initial);
    setIsOpen(true);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const isAllSelected = defaulters.length > 0 && defaulters.every((d) => selectedIds[d.loan.id]);
  const toggleSelectAll = () => {
    const next: Record<string, boolean> = {};
    defaulters.forEach((d) => {
      next[d.loan.id] = !isAllSelected;
    });
    setSelectedIds(next);
  };

  const selectedCount = defaulters.filter((d) => selectedIds[d.loan.id]).length;

  const handleDownload = async () => {
    const selectedDefaulters = defaulters.filter((d) => selectedIds[d.loan.id]);
    if (selectedDefaulters.length === 0) return;

    setIsGenerating(true);
    
    for (let i = 0; i < selectedDefaulters.length; i++) {
      const def = selectedDefaulters[i];
      setProgressMsg(`Preparing card for ${def.borrower} (${i + 1}/${selectedDefaulters.length})...`);
      
      setActiveCardData(def);
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (cardRef.current) {
        setProgressMsg(`Generating card for ${def.borrower}...`);
        try {
          await new Promise((resolve) => setTimeout(resolve, 150));
          
          const dataUrl = await toPng(cardRef.current, {
            quality: 0.95,
            pixelRatio: 2,
            cacheBust: true,
          });

          const link = document.createElement('a');
          const cleanName = def.borrower.replace(/[^a-zA-Z0-9]/g, '_');
          link.download = `${cleanName}_Defaulter_Notice.png`;
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
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors shadow-sm cursor-pointer"
      >
        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
        <span>Defaulter Cards</span>
        {defaulters.length > 0 && (
          <span className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
            {defaulters.length}
          </span>
        )}
      </button>

      {/* Main Selection Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileImage className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>Defaulter Recovery Cards</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Export high-resolution PNG notices formatted for WhatsApp follow-ups
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
                disabled={isGenerating}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto flex-1">
              {defaulters.length === 0 ? (
                <div className="text-center py-12 text-slate-500 italic text-xs">
                  No accounts meet the critical default threshold (5+ daily or 3+ weekly missed payments).
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 p-3 rounded-xl">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={toggleSelectAll}
                        disabled={isGenerating}
                        className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                      />
                      <span>{isAllSelected ? 'Deselect All' : 'Select All'}</span>
                    </label>
                    <span className="text-xs text-slate-500 font-medium">
                      Selected: {selectedCount} of {defaulters.length}
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                    {defaulters.map((def) => (
                      <div
                        key={def.loan.id}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                          selectedIds[def.loan.id]
                            ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/60'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <label className="flex items-center gap-3 flex-1 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={!!selectedIds[def.loan.id]}
                            onChange={() => toggleSelect(def.loan.id)}
                            disabled={isGenerating}
                            className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                          />
                          <div>
                            <span className="font-bold text-xs text-slate-900 dark:text-white block">
                              {def.borrower}
                            </span>
                            <span className="text-[11px] text-slate-500 capitalize block mt-0.5">
                              {def.loanType.toLowerCase()} · Given ₹{def.loanGiven.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </label>
                        <div className="text-right">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 mb-0.5">
                            {def.missedInst} Missed
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                            Bal: ₹{def.totalBalance.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold block">
                            Gap: ₹{def.gap.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3 justify-end items-center">
              {isGenerating && (
                <div className="text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2 mr-auto">
                  <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                  <span>{progressMsg}</span>
                </div>
              )}
              <div className="flex gap-2.5 w-full sm:w-auto">
                <button
                  onClick={() => setIsOpen(false)}
                  disabled={isGenerating}
                  className="btn-secondary text-xs flex-1 sm:flex-none"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDownload}
                  disabled={isGenerating || selectedCount === 0}
                  className="btn-danger text-xs flex-1 sm:flex-none flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export {selectedCount} Cards</span>
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
            className="bg-[#0b0f19] text-white p-7 rounded-none border-2 border-slate-800 shadow-2xl relative w-[450px]"
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              boxSizing: 'border-box',
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-red-500 to-amber-500" />
            
            <div className="flex justify-between items-center mb-5 mt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-rose-500 font-extrabold text-[11px] uppercase tracking-wider">
                  ⚠️ Formal Repayment Reminder
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {format(new Date(), 'dd MMM yyyy')}
              </span>
            </div>

            <div className="mb-6 pb-5 border-b border-white/10">
              <h2 className="text-[26px] font-black tracking-tight text-white mb-1 leading-tight">
                {activeCardData.borrower}
              </h2>
              <p className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span className="capitalize">{activeCardData.loanType.toLowerCase()} Loan</span> · Given ₹{activeCardData.loanGiven.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mb-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider block mb-0.5">
                  Follow-up Gap
                </span>
                <span className="text-2xl font-black text-rose-400">
                  ₹{activeCardData.gap.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-0.5">
                  Missed Installments
                </span>
                <span className="text-xs font-bold text-rose-400 bg-rose-500/20 border border-rose-500/30 px-2.5 py-1 rounded-md inline-block mt-0.5">
                  {activeCardData.missedInst} {activeCardData.loanType === LoanType.DAILY ? 'Days' : 'Weeks'} Missed
                </span>
              </div>
            </div>

            <div className="space-y-3 mb-6 text-sm">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-slate-400 text-xs font-medium">Installment Commitment</span>
                <span className="text-slate-200 font-bold">
                  ₹{activeCardData.amountPerInst.toLocaleString('en-IN')} / {activeCardData.loanType === LoanType.DAILY ? 'day' : 'week'}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-slate-400 text-xs font-medium">Scheduled Expected</span>
                <span className="text-slate-200 font-bold">₹{activeCardData.expected.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-slate-400 text-xs font-medium">Total Paid to Date</span>
                <span className="text-slate-200 font-bold">₹{activeCardData.received.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-slate-400 text-xs font-medium">Balance Remaining</span>
                <span className="text-rose-400 font-black">₹{activeCardData.totalBalance.toLocaleString('en-IN')}</span>
              </div>
              {activeCardData.daysAfterClosure > 0 && (
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-slate-400 text-xs font-medium">Days Past Maturity</span>
                  <span className="text-amber-400 font-bold">{activeCardData.daysAfterClosure} Days Overdue</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-xs font-medium">Loan Period</span>
                <span className="text-slate-300 text-xs font-medium">
                  {activeCardData.startDate} to {activeCardData.endDate}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  Payment Collection Progress
                </span>
                <span className="text-xs font-bold text-slate-300">
                  {activeCardData.paidPercentage.toFixed(0)}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    activeCardData.paidPercentage >= 100
                      ? 'bg-emerald-500'
                      : activeCardData.paidPercentage >= 50
                      ? 'bg-blue-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${activeCardData.paidPercentage}%` }}
                />
              </div>
            </div>

            <div className="border-t border-white/10 pt-3 mt-5 text-center">
              <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                Automated Ledger Record · Financial Accounting
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
