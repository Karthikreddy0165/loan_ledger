"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoanType, LoanStatus } from "@prisma/client";
import { addDays, addWeeks, format } from "date-fns";

export default function LoanForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    borrower: "",
    loanType: "DAILY" as LoanType,
    loanGiven: "",
    loanDate: format(new Date(), "yyyy-MM-dd"),
    installmentCount: "",
    amountPerInstallment: "",
    expectedReturnDate: "",
    interestAmount: "",
    interestDueDate: "",
    adjustmentReturnAmount: "",
    adjustmentReturnDate: "",
    note: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/loans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            loanGiven: parseFloat(form.loanGiven),
            installmentCount: form.installmentCount ? parseInt(form.installmentCount) : null,
            amountPerInstallment: form.amountPerInstallment ? parseFloat(form.amountPerInstallment) : null,
            interestAmount: form.interestAmount ? parseFloat(form.interestAmount) : null,
            adjustmentReturnAmount: form.adjustmentReturnAmount ? parseFloat(form.adjustmentReturnAmount) : null,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create loan");
        }

        router.push("/");
        router.refresh();
      } catch (err: any) {
        setError(err.message);
      }
    });
  };

  return (
    <div className="card max-w-2xl mx-auto shadow-xl border-white/[0.05] bg-[#0f172a]/50 backdrop-blur-md">
      <form onSubmit={handleSubmit} className="space-y-6 p-2">
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="label text-slate-300">Borrower Name</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">👤</span>
              <input
                name="borrower"
                type="text"
                className="input pl-10"
                placeholder="Enter borrower name"
                value={form.borrower}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="label text-slate-300">Loan Type</label>
              <select
                name="loanType"
                className="input"
                value={form.loanType}
                onChange={handleChange}
                required
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly (Interest)</option>
                <option value="ADJUSTMENT">Adjustment</option>
                <option value="UNKNOWN">Recovery</option>
              </select>
            </div>
            <div>
              <label className="label text-slate-300">Loan Amount (₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                <input
                  name="loanGiven"
                  type="number"
                  min="0"
                  className="input pl-8"
                  placeholder="0.00"
                  value={form.loanGiven}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="label text-slate-300">Start Date</label>
              <input
                name="loanDate"
                type="date"
                className="input"
                value={form.loanDate}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="label text-slate-300">Expected End Date</label>
              <input
                name="expectedReturnDate"
                type="date"
                className="input text-slate-400"
                value={form.expectedReturnDate}
                onChange={handleChange}
              />
            </div>
          </div>

          {(form.loanType === "DAILY" || form.loanType === "WEEKLY") && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-white/[0.02] rounded-xl border border-white/[0.05] animate-in fade-in slide-in-from-top-2 duration-300">
              <div>
                <label className="label text-slate-300">Installments</label>
                <input
                  name="installmentCount"
                  type="number"
                  min="0"
                  className="input"
                  placeholder="e.g. 100"
                  value={form.installmentCount}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="label text-slate-300">₹ Per Installment</label>
                <input
                  name="amountPerInstallment"
                  type="number"
                  min="0"
                  className="input"
                  placeholder="0.00"
                  value={form.amountPerInstallment}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          {form.loanType === "MONTHLY" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-blue-500/5 rounded-xl border border-blue-500/10 animate-in fade-in slide-in-from-top-2 duration-300">
              <div>
                <label className="label text-slate-300">Monthly Interest (₹)</label>
                <input
                  name="interestAmount"
                  type="number"
                  min="0"
                  className="input border-blue-500/20 focus:border-blue-500"
                  placeholder="0.00"
                  value={form.interestAmount}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="label text-slate-300">First Due Date</label>
                <input
                  name="interestDueDate"
                  type="date"
                  className="input border-blue-500/20 focus:border-blue-500"
                  value={form.interestDueDate}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          {form.loanType === "ADJUSTMENT" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10 animate-in fade-in slide-in-from-top-2 duration-300">
              <div>
                <label className="label text-slate-300">Adjustment Return (₹)</label>
                <input
                  name="adjustmentReturnAmount"
                  type="number"
                  min="0"
                  className="input border-emerald-500/20 focus:border-emerald-500"
                  placeholder="0.00"
                  value={form.adjustmentReturnAmount}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="label text-slate-300">Return Date</label>
                <input
                  name="adjustmentReturnDate"
                  type="date"
                  className="input border-emerald-500/20 focus:border-emerald-500"
                  value={form.adjustmentReturnDate}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          <div>
            <label className="label text-slate-300">Note</label>
            <textarea
              name="note"
              rows={3}
              className="input resize-none"
              placeholder="Add any specific details here..."
              value={form.note}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-white/[0.05]">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="px-6 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-8 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isPending ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              "Create Loan Entry"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
