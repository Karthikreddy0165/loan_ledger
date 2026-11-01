import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";
import { Activity, ArrowLeft, Shield } from "lucide-react";

async function getAuditLogs() {
  return await prisma.auditLog.findMany({
    include: {
      user: {
        select: { name: true, email: true }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 50
  });
}

export default async function AuditLogPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const logs = await getAuditLogs();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Security & Audit Journal</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 font-semibold border border-blue-200 dark:border-blue-800/40">
              Immutable Trail
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Complete compliance record of creations, status modifications, and ledger deletions.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </Link>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Operator</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Change Context</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                    {format(new Date(log.createdAt), "MMM d, yyyy · h:mm a")}
                  </td>
                  <td>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">{log.user?.name || "System"}</div>
                    <div className="text-[11px] text-slate-500">{log.user?.email || "-"}</div>
                  </td>
                  <td>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                      log.action === 'CREATE' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50' :
                      log.action === 'UPDATE' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50' :
                      'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {log.entity}
                  </td>
                  <td className="text-xs text-slate-600 dark:text-slate-400 max-w-sm truncate font-mono text-[11px]">
                    {log.details || "-"}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 text-xs">
                    No activity logs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
