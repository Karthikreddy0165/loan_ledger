import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import LoanForm from "@/components/LoanForm";

export default async function NewLoanPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login?callbackUrl=/loans/new");
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Create New Loan
          </h1>
          <p className="text-slate-500 text-sm mt-1.5 font-medium">
            Fill in the details to register a new lending transaction
          </p>
        </div>
        <Link 
          href="/" 
          className="group text-slate-400 hover:text-white text-sm transition-all flex items-center gap-2 px-4 py-2 bg-white/[0.03] rounded-lg border border-white/[0.05]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 group-hover:-translate-x-1 transition-transform">
            <path fillRule="evenodd" d="M9.78 4.22a.75.75 0 0 1 0 1.06L7.06 8l2.72 2.72a.75.75 0 1 1-1.06 1.06L5.47 8.53a.75.75 0 0 1 0-1.06l3.25-3.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
          </svg>
          Dashboard
        </Link>
      </div>

      <LoanForm />
    </div>
  );
}
