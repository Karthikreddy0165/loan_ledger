'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import {
  Search,
  Plus,
  X,
  Phone,
  User,
  MessageSquare,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Lock,
  Calendar,
  IndianRupee
} from 'lucide-react';

interface RecoveryNote {
  id: string;
  loanId: string;
  note: string;
  contactMethod: string;
  status: string;
  contactDate: string;
  followUpDate: string | null;
  promisedAmount: number | null;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  PROMISED:    { label: 'Promised',    color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800/50' },
  NO_RESPONSE: { label: 'No Response', color: 'text-slate-700 dark:text-slate-400',   bg: 'bg-slate-100 dark:bg-slate-800/60',   border: 'border-slate-200 dark:border-slate-700/60' },
  PARTIAL:     { label: 'Partial',     color: 'text-amber-800 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-950/40',   border: 'border-amber-200 dark:border-amber-800/50' },
  DENIED:      { label: 'Denied',      color: 'text-rose-700 dark:text-rose-400',    bg: 'bg-rose-50 dark:bg-rose-950/40',    border: 'border-rose-200 dark:border-rose-800/50' },
  FOLLOW_UP:   { label: 'Follow Up',   color: 'text-blue-700 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-950/40',    border: 'border-blue-200 dark:border-blue-800/50' },
  RESOLVED:    { label: 'Resolved',    color: 'text-green-700 dark:text-green-400',   bg: 'bg-green-50 dark:bg-green-950/40',   border: 'border-green-200 dark:border-green-800/50' },
};

const CONTACT_CONFIG: Record<string, { label: string; icon: any }> = {
  PHONE:   { label: 'Phone Call', icon: Phone },
  VISIT:   { label: 'In-Person Visit', icon: User },
  MESSAGE: { label: 'Message / SMS', icon: MessageSquare },
  OTHER:   { label: 'Other', icon: FileText },
};

export default function RecoveryTracker({ loanId }: { loanId: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const isDemo = Boolean(session?.user?.isDemo || session?.user?.email?.toLowerCase() === 'test@example.com');

  const [notes, setNotes] = useState<RecoveryNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [noteText, setNoteText] = useState('');
  const [contactMethod, setContactMethod] = useState('PHONE');
  const [status, setStatus] = useState('FOLLOW_UP');
  const [contactDate, setContactDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [followUpDate, setFollowUpDate] = useState('');
  const [promisedAmount, setPromisedAmount] = useState('');

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch(`/api/loans/${loanId}/recovery-notes`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data);
      }
    } catch (err) {
      console.error('Failed to fetch recovery notes:', err);
    } finally {
      setIsLoading(false);
    }
  }, [loanId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemo) {
      setError('Adding recovery notes is disabled in demo mode.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const body: any = {
        note: noteText,
        contactMethod,
        status,
        contactDate,
      };
      if (followUpDate) body.followUpDate = followUpDate;
      if (promisedAmount) body.promisedAmount = parseFloat(promisedAmount);

      const res = await fetch(`/api/loans/${loanId}/recovery-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to add note');
      }

      setNoteText('');
      setContactMethod('PHONE');
      setStatus('FOLLOW_UP');
      setContactDate(format(new Date(), 'yyyy-MM-dd'));
      setFollowUpDate('');
      setPromisedAmount('');
      setIsFormOpen(false);

      await fetchNotes();
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to add note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (isDemo) {
      alert('Deleting recovery notes is disabled in demo mode.');
      return;
    }
    if (!confirm('Delete this tracking note?')) return;
    setDeletingId(noteId);
    try {
      const res = await fetch(`/api/loans/${loanId}/recovery-notes/${noteId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchNotes();
        router.refresh();
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const upcomingFollowUps = notes.filter(
    (n) => n.followUpDate && new Date(n.followUpDate) >= new Date() && n.status !== 'RESOLVED'
  );
  const overdueFollowUps = notes.filter(
    (n) => n.followUpDate && new Date(n.followUpDate) < new Date() && n.status !== 'RESOLVED'
  );

  return (
    <div className="card mt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Recovery & Contact Log</h2>
            <p className="text-xs text-slate-500">
              {notes.length} log{notes.length !== 1 ? 's' : ''} recorded
              {overdueFollowUps.length > 0 && (
                <span className="text-rose-600 dark:text-rose-400 ml-2 font-medium">
                  • {overdueFollowUps.length} overdue follow-up{overdueFollowUps.length !== 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
        </div>

        {isDemo ? (
          <span className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/60 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Read Only</span>
          </span>
        ) : (
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer"
          >
            {isFormOpen ? (
              <>
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Log Activity</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Follow-up alerts */}
      {overdueFollowUps.length > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 text-xs">
          <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-bold mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Overdue Follow-ups</span>
          </div>
          <div className="space-y-1.5">
            {overdueFollowUps.map((n) => (
              <div key={n.id} className="flex items-center justify-between">
                <span className="text-slate-700 dark:text-slate-300 truncate max-w-[240px]">{n.note}</span>
                <span className="text-rose-600 dark:text-rose-400 font-semibold">
                  {format(new Date(n.followUpDate!), 'dd MMM yyyy')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {upcomingFollowUps.length > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 text-xs">
          <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-bold mb-2">
            <Clock className="w-4 h-4" />
            <span>Upcoming Scheduled Touches</span>
          </div>
          <div className="space-y-1.5">
            {upcomingFollowUps.map((n) => (
              <div key={n.id} className="flex items-center justify-between">
                <span className="text-slate-700 dark:text-slate-300 truncate max-w-[240px]">{n.note}</span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold">
                  {format(new Date(n.followUpDate!), 'dd MMM yyyy')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Note Form */}
      {isFormOpen && !isDemo && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3.5">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Contact Date</label>
              <input
                type="date"
                value={contactDate}
                onChange={(e) => setContactDate(e.target.value)}
                className="input text-xs"
                required
              />
            </div>
            <div>
              <label className="label">Channel</label>
              <select
                value={contactMethod}
                onChange={(e) => setContactMethod(e.target.value)}
                className="input text-xs"
              >
                {Object.entries(CONTACT_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Outcome Status</label>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatus(key)}
                  className={`text-xs py-1.5 px-2.5 rounded-lg font-semibold border transition-colors cursor-pointer ${
                    status === key
                      ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Call / Visit Notes *</label>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="e.g. Discussed repayment plan; borrower committed to deposit ₹5,000 next Monday..."
              className="input text-xs"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Follow-up Date</label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="input text-xs"
              />
            </div>
            <div>
              <label className="label">Promised Amount (₹)</label>
              <input
                type="number"
                value={promisedAmount}
                onChange={(e) => setPromisedAmount(e.target.value)}
                className="input text-xs"
                placeholder="₹"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !noteText}
            className="btn-primary w-full text-xs"
          >
            {isSubmitting ? 'Saving Note...' : 'Save Recovery Note'}
          </button>
        </form>
      )}

      {/* Timeline */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
          <p className="text-slate-500 text-xs">No recovery contact notes logged yet</p>
        </div>
      ) : (
        <div className="space-y-3 mt-2">
          {notes.map((note) => {
            const statusCfg = STATUS_CONFIG[note.status] || STATUS_CONFIG.FOLLOW_UP;
            const contactCfg = CONTACT_CONFIG[note.contactMethod] || CONTACT_CONFIG.OTHER;
            const ContactIcon = contactCfg.icon;
            const isOverdue = note.followUpDate && new Date(note.followUpDate) < new Date() && note.status !== 'RESOLVED';

            return (
              <div
                key={note.id}
                className="p-3.5 rounded-xl bg-slate-50/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {format(new Date(note.contactDate), 'dd MMM yyyy')}
                    </span>
                    <span className={`text-[10px] py-0.5 px-2 rounded-md font-semibold ${statusCfg.bg} ${statusCfg.color} border ${statusCfg.border}`}>
                      {statusCfg.label}
                    </span>
                    <span className="text-[10px] py-0.5 px-2 rounded-md bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1 font-medium">
                      <ContactIcon className="w-3 h-3 text-slate-400" />
                      {contactCfg.label}
                    </span>
                  </div>

                  {!isDemo && (
                    <button
                      onClick={() => handleDelete(note.id)}
                      disabled={deletingId === note.id}
                      className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-md transition-colors cursor-pointer"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                  {note.note}
                </p>

                {(note.promisedAmount || note.followUpDate) && (
                  <div className="flex items-center gap-4 text-[11px] pt-1 border-t border-slate-200/60 dark:border-slate-800/60 flex-wrap">
                    {note.promisedAmount && (
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold inline-flex items-center gap-1">
                        <IndianRupee className="w-3 h-3" />
                        Promised: ₹{Number(note.promisedAmount).toLocaleString('en-IN')}
                      </span>
                    )}
                    {note.followUpDate && (
                      <span className={`font-medium inline-flex items-center gap-1 ${
                        isOverdue ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-blue-600 dark:text-blue-400'
                      }`}>
                        <Calendar className="w-3 h-3" />
                        {isOverdue ? 'Overdue follow-up: ' : 'Follow up: '}
                        {format(new Date(note.followUpDate), 'dd MMM yyyy')}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
