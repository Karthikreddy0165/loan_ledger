"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { LoanType } from "@prisma/client";
import { format } from "date-fns";
import { User, IndianRupee, Calendar, PlusCircle, Lock, AlertCircle, ArrowLeft } from "lucide-react";

export default function LoanForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const isDemo = Boolean(session?.user?.isDemo || session?.user?.email?.toLowerCase() === "test@example.com");

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
    if (isDemo) {
      setError("Creating new loans is disabled in demo mode.");
      return;
    }

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
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to create loan");
        }

        router.push("/");
        router.refresh();
      } catch (err: any) {
        setError(err.message || "Failed to create loan");
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Originate New Loan
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Configure terms, disbursement schedule, and return commitments
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </button>
      </div>

      {isDemo && (
        <div className="p-3.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-slate-500 shrink-0" />
          <p className="text-slate-600 dark:text-slate-400">
            View-Only Mode: Creating new loans is disabled for the test account.
          </p>
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="label">Borrower Full Name *</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                name="borrower"
                type="text"
                className="input pl-9"
                placeholder="e.g. Rahul Sharma"
                value={form.borrower}
                onChange={handleChange}
                required
                disabled={isDemo}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Loan Product Model *</label>
              <select
                name="loanType"
                className="input"
                value={form.loanType}
                onChange={handleChange}
                required
                disabled={isDemo}
              >
                <option value="DAILY">Daily Micro-Loan</option>
                <option value="WEEKLY">Weekly Loan</option>
                <option value="MONTHLY">Monthly Interest</option>
                <option value="ADJUSTMENT">Fixed Return Adjustment</option>
                <option value="UNKNOWN">Recovery</option>
              </select>
            </div>
            <div>
              <label className="label">Disbursal Amount (₹) *</label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  name="loanGiven"
                  type="number"
                  min="0"
                  className="input pl-9"
                  placeholder="e.g. 20000"
                  value={form.loanGiven}
                  onChange={handleChange}
                  required
                  disabled={isDemo}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Start / Disbursal Date</label>
              <input
                name="loanDate"
                type="date"
                className="input"
                value={form.loanDate}
                onChange={handleChange}
                disabled={isDemo}
              />
            </div>
            <div>
              <label className="label">Expected Maturity Date</label>
              <input
                name="expectedReturnDate"
                type="date"
                className="input"
                value={form.expectedReturnDate}
                onChange={handleChange}
                disabled={isDemo}
              />
            </div>
          </div>

          {(form.loanType === "DAILY" || form.loanType === "WEEKLY") && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <label className="label">Installment Count</label>
                <input
                  name="installmentCount"
                  type="number"
                  min="0"
                  className="input"
                  placeholder="e.g. 100"
                  value={form.installmentCount}
                  onChange={handleChange}
                  disabled={isDemo}
                />
              </div>
              <div>
                <label className="label">Amount Per Installment (₹)</label>
                <input
                  name="amountPerInstallment"
                  type="number"
                  min="0"
                  className="input"
                  placeholder="e.g. 200"
                  value={form.amountPerInstallment}
                  onChange={handleChange}
                  disabled={isDemo}
                />
              </div>
            </div>
          )}

          {form.loanType === "MONTHLY" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800/40">
              <div>
                <label className="label">Monthly Interest Amount (₹)</label>
                <input
                  name="interestAmount"
                  type="number"
                  min="0"
                  className="input"
                  placeholder="e.g. 1500"
                  value={form.interestAmount}
                  onChange={handleChange}
                  disabled={isDemo}
                />
              </div>
              <div>
                <label className="label">First Interest Due Date</label>
                <input
                  name="interestDueDate"
                  type="date"
                  className="input"
                  value={form.interestDueDate}
                  onChange={handleChange}
                  disabled={isDemo}
                />
              </div>
            </div>
          )}

          {form.loanType === "ADJUSTMENT" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800/40">
              <div>
                <label className="label">Total Return Amount (₹)</label>
                <input
                  name="adjustmentReturnAmount"
                  type="number"
                  min="0"
                  className="input"
                  placeholder="e.g. 25000"
                  value={form.adjustmentReturnAmount}
                  onChange={handleChange}
                  disabled={isDemo}
                />
              </div>
              <div>
                <label className="label">Settlement Date</label>
                <input
                  name="adjustmentReturnDate"
                  type="date"
                  className="input"
                  value={form.adjustmentReturnDate}
                  onChange={handleChange}
                  disabled={isDemo}
                />
              </div>
            </div>
          )}

          <div>
            <label className="label">Underwriting Remarks & Guarantor Details</label>
            <textarea
              name="note"
              rows={3}
              className="input resize-none"
              placeholder="e.g. Shop owner at Market Rd, reference from Ramesh..."
              value={form.note}
              onChange={handleChange}
              disabled={isDemo}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="btn-secondary"
            >
              Cancel
            </button>
            {!isDemo && (
              <button
                type="submit"
                disabled={isPending}
                className="btn-primary"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{isPending ? "Creating Record..." : "Disburse Loan"}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
