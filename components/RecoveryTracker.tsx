'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

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

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
  PROMISED:    { label: 'Promised',    color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: '🤝' },
  NO_RESPONSE: { label: 'No Response', color: 'text-slate-400',   bg: 'bg-slate-500/10',   border: 'border-slate-500/20',   icon: '📵' },
  PARTIAL:     { label: 'Partial',     color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   icon: '⚡' },
  DENIED:      { label: 'Denied',      color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/20',    icon: '❌' },
  FOLLOW_UP:   { label: 'Follow Up',   color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    icon: '📋' },
  RESOLVED:    { label: 'Resolved',    color: 'text-green-400',   bg: 'bg-green-500/10',   border: 'border-green-500/20',   icon: '✅' },
};

const CONTACT_CONFIG: Record<string, { label: string; icon: string }> = {
  PHONE:   { label: 'Phone Call', icon: '📞' },
  VISIT:   { label: 'In-Person Visit', icon: '🚶' },
  MESSAGE: { label: 'Message', icon: '💬' },
  OTHER:   { label: 'Other', icon: '📝' },
};

export default function RecoveryTracker({ loanId }: { loanId: string }) {
  const router = useRouter();
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

      // Reset form
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

  // Upcoming follow-ups
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
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 
                          flex items-center justify-center border border-violet-500/20">
            <span className="text-lg">🔍</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-200">Recovery Tracking</h2>
            <p className="text-[11px] text-slate-500">
              {notes.length} note{notes.length !== 1 ? 's' : ''} logged
              {overdueFollowUps.length > 0 && (
                <span className="text-rose-400 ml-2 font-medium">
                  • {overdueFollowUps.length} overdue follow-up{overdueFollowUps.length !== 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="text-[12px] py-2 px-3.5 rounded-xl font-medium
                     bg-violet-500/10 text-violet-400 border border-violet-500/20
                     hover:bg-violet-500/20 transition-all duration-200 flex items-center gap-1.5"
        >
          {isFormOpen ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M3.28 3.22a.75.75 0 0 0-1.06 1.06L6.94 8l-4.72 4.72a.75.75 0 1 0 1.06 1.06L8 9.06l4.72 4.72a.75.75 0 1 0 1.06-1.06L9.06 8l4.72-4.72a.75.75 0 0 0-1.06-1.06L8 6.94 3.28 3.22Z" />
              </svg>
              Cancel
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
              </svg>
              Add Note
            </>
          )}
        </button>
      </div>

      {/* Follow-up alerts */}
      {overdueFollowUps.length > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/5 border border-rose-500/15">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-rose-400 text-sm font-semibold">⚠️ Overdue Follow-ups</span>
          </div>
          <div className="space-y-1.5">
            {overdueFollowUps.map((n) => (
              <div key={n.id} className="flex items-center justify-between text-xs">
                <span className="text-slate-400 truncate max-w-[200px]">{n.note}</span>
                <span className="text-rose-400 font-medium">
                  {format(new Date(n.followUpDate!), 'dd MMM')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {upcomingFollowUps.length > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-blue-500/5 border border-blue-500/15">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-400 text-sm font-semibold">📅 Upcoming Follow-ups</span>
          </div>
          <div className="space-y-1.5">
            {upcomingFollowUps.map((n) => (
              <div key={n.id} className="flex items-center justify-between text-xs">
                <span className="text-slate-400 truncate max-w-[200px]">{n.note}</span>
                <span className="text-blue-400 font-medium">
                  {format(new Date(n.followUpDate!), 'dd MMM')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Note Form */}
      {isFormOpen && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]
                                                  animate-fade-in-up">
          {error && (
            <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {error}
            </div>
          )}

          {/* Contact Date & Method Row */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                Contact Date
              </label>
              <input
                type="date"
                value={contactDate}
                onChange={(e) => setContactDate(e.target.value)}
                className="input text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                Contact Method
              </label>
              <select
                value={contactMethod}
                onChange={(e) => setContactMethod(e.target.value)}
                className="input text-xs"
              >
                {Object.entries(CONTACT_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.icon} {cfg.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Row */}
          <div className="mb-3">
            <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">
              Status
            </label>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatus(key)}
                  className={`text-[11px] py-1.5 px-2.5 rounded-lg font-medium border transition-all duration-200
                    ${status === key
                      ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                      : 'bg-white/[0.03] text-slate-500 border-white/[0.06] hover:bg-white/[0.06]'
                    }`}
                >
                  {cfg.icon} {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="mb-3">
            <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">
              Note *
            </label>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="What happened? What was discussed? e.g. 'Called borrower, said will pay by next week...'"
              className="input text-xs"
              rows={3}
              required
            />
          </div>

          {/* Follow-up Date & Promised Amount */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                Follow-up Date
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="input text-xs"
                placeholder="When to follow up"
              />
              <p className="text-[10px] text-slate-600 mt-1">When to check back</p>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                Promised Amount
              </label>
              <input
                type="number"
                value={promisedAmount}
                onChange={(e) => setPromisedAmount(e.target.value)}
                className="input text-xs"
                placeholder="₹ Amount promised"
              />
              <p className="text-[10px] text-slate-600 mt-1">If borrower promised to pay</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !noteText}
            className="w-full py-2.5 rounded-xl text-sm font-medium
                       bg-gradient-to-r from-violet-500 to-purple-600 text-white
                       hover:from-violet-600 hover:to-purple-700
                       disabled:opacity-40 transition-all duration-200"
            style={{ boxShadow: '0 4px 14px rgba(139, 92, 246, 0.25)' }}
          >
            {isSubmitting ? 'Saving...' : 'Save Tracking Note'}
          </button>
        </form>
      )}

      {/* Timeline */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-600 text-sm italic">No tracking notes yet</p>
          <p className="text-slate-700 text-xs mt-1">Click &quot;Add Note&quot; to start tracking recovery efforts</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[18px] top-2 bottom-2 w-px bg-gradient-to-b from-violet-500/30 via-white/[0.06] to-transparent" />

          <div className="space-y-1">
            {notes.map((note, index) => {
              const statusCfg = STATUS_CONFIG[note.status] || STATUS_CONFIG.FOLLOW_UP;
              const contactCfg = CONTACT_CONFIG[note.contactMethod] || CONTACT_CONFIG.OTHER;
              const isOverdue = note.followUpDate && new Date(note.followUpDate) < new Date() && note.status !== 'RESOLVED';

              return (
                <div
                  key={note.id}
                  className="relative pl-10 py-3 group"
                >
                  {/* Timeline dot */}
                  <div className={`absolute left-[11px] top-[18px] w-[15px] h-[15px] rounded-full border-2 
                    ${statusCfg.border} ${statusCfg.bg} flex items-center justify-center
                    transition-all duration-300 group-hover:scale-110`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${statusCfg.color.replace('text-', 'bg-')}`} />
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] 
                                  hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-200">
                    {/* Header row */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-slate-400 font-medium">
                          {format(new Date(note.contactDate), 'dd MMM yyyy')}
                        </span>
                        <span className={`text-[10px] py-0.5 px-2 rounded-md font-medium ${statusCfg.bg} ${statusCfg.color} border ${statusCfg.border}`}>
                          {statusCfg.icon} {statusCfg.label}
                        </span>
                        <span className="text-[10px] py-0.5 px-2 rounded-md bg-white/[0.04] text-slate-500 border border-white/[0.06]">
                          {contactCfg.icon} {contactCfg.label}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDelete(note.id)}
                        disabled={deletingId === note.id}
                        className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-rose-400 
                                   transition-all duration-200 p-1 rounded-lg hover:bg-rose-500/10"
                        title="Delete note"
                      >
                        {deletingId === note.id ? (
                          <div className="w-3.5 h-3.5 border border-slate-600 border-t-slate-400 rounded-full animate-spin" />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                            <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5A.75.75 0 0 1 9.95 6Z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    </div>

                    {/* Note text */}
                    <p className="text-sm text-slate-300 leading-relaxed">{note.note}</p>

                    {/* Metadata row */}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {note.promisedAmount && (
                        <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                            <path d="M1 3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3ZM2 4v4h12V4H2Z" />
                            <path d="M8 5.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2ZM3.5 5a.5.5 0 1 1 0 1 .5.5 0 0 1 0-1Zm9.5.5a.5.5 0 1 0-1 0 .5.5 0 0 0 1 0Z" />
                            <path d="M1 12.5A1.5 1.5 0 0 0 2.5 14h11a1.5 1.5 0 0 0 1.5-1.5v-1H1v1.5Z" />
                          </svg>
                          Promised ₹{Number(note.promisedAmount).toLocaleString()}
                        </span>
                      )}
                      {note.followUpDate && (
                        <span className={`text-[11px] font-medium flex items-center gap-1 ${
                          isOverdue ? 'text-rose-400' : 'text-blue-400'
                        }`}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                            <path fillRule="evenodd" d="M4 1.75a.75.75 0 0 1 1.5 0V3h5V1.75a.75.75 0 0 1 1.5 0V3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2V1.75ZM4.5 6a1 1 0 0 0-1 1v4.5a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-7Z" clipRule="evenodd" />
                          </svg>
                          {isOverdue ? 'Overdue: ' : 'Follow up: '}
                          {format(new Date(note.followUpDate), 'dd MMM yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
