import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { format } from "date-fns";

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
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Activity Logs</h1>
        <p className="text-slate-500 text-sm mt-1.5">
          Track who created, updated, or deleted entries in the system.
        </p>
      </div>

      <div className="card overflow-hidden bg-[#0f172a]/50 backdrop-blur-md border-white/[0.05]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Time</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">User</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Action</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Entity</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400 font-medium">
                    {format(new Date(log.createdAt), "MMM d, h:mm a")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs font-bold text-white">{log.user.name}</div>
                    <div className="text-[10px] text-slate-500">{log.user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                      log.action === 'CREATE' ? 'bg-emerald-500/10 text-emerald-400' :
                      log.action === 'UPDATE' ? 'bg-blue-500/10 text-blue-400' :
                      'bg-rose-500/10 text-rose-400'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-300 font-semibold">
                    {log.entity}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">
                    {log.details || "-"}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-600 text-sm">
                    No activity logs found yet.
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
