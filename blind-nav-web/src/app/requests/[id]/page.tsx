'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { IssueRequest } from '@/types/request';
import { STATUS_TRANSITIONS, CATEGORY_LABELS, STATUS_LABELS } from '@/constants/enums';
import { formatDate, timeAgo } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import PriorityBadge from '@/components/ui/PriorityBadge';
import SourceBadge from '@/components/ui/SourceBadge';
import AiInsightsPanel from '@/components/ui/AiInsightsPanel';
import CopilotPanel from '@/components/ui/CopilotPanel';
import SlaBadge from '@/components/ui/SlaBadge';
import EscalationBadge from '@/components/ui/EscalationBadge';
import {
  ArrowLeft, MapPin, Clock, User, Mic, RefreshCw,
  CheckCircle2, ChevronRight, MessageSquarePlus, AlertTriangle,
} from 'lucide-react';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-slate-400">{label}</span>
      <span className="text-sm text-slate-800">
        {value || <span className="italic text-slate-300">—</span>}
      </span>
    </div>
  );
}

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  useRouter();

  const [request,    setRequest]    = useState<IssueRequest | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [analysing,  setAnalysing]  = useState(false);
  const [copiloting, setCopiloting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  // Update form state
  const [newStatus,   setNewStatus]   = useState('');
  const [assignee,    setAssignee]    = useState('');
  const [noteText,    setNoteText]    = useState('');
  const [noteAuthor,  setNoteAuthor]  = useState('Officer');

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getRequest(id);
      setRequest(data);
      setAssignee(data.assignedTo || '');
    } catch {
      setError('Request not found or server unavailable.');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [id]);

  const handleUpdate = async () => {
    if (!request) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api.updateRequest(id, {
        status:     newStatus  || undefined,
        assignedTo: assignee   || undefined,
        noteText:   noteText   || undefined,
        noteAuthor: noteAuthor || 'Officer',
      });
      setRequest(updated);
      setNewStatus('');
      setNoteText('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleReanalyze = async () => {
    setAnalysing(true);
    setError(null);
    try {
      const updated = await api.analyzeRequest(id);
      setRequest(updated);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'AI analysis failed');
    } finally {
      setAnalysing(false);
    }
  };

  const handleRunCopilot = async () => {
    setCopiloting(true);
    setError(null);
    try {
      const updated = await api.generateCopilot(id);
      setRequest(updated);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Copilot generation failed');
    } finally {
      setCopiloting(false);
    }
  };

  /** Accept team recommendation → prefill assignee field */
  const handleAcceptTeam = (team: string, suggested: string) => {
    const assigneeValue = suggested || team;
    setAssignee(assigneeValue);
  };

  /** Use copilot draft note → prefill note textarea */
  const handleUseInternalNote = (note: string) => {
    setNoteText(note);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Loading request…
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">{error || 'Request not found.'}</p>
        <Link href="/requests" className="mt-4 inline-block text-blue-600 hover:underline">
          ← Back to requests
        </Link>
      </div>
    );
  }

  const availableStatuses = STATUS_TRANSITIONS[request.status] ?? [];

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/requests" className="flex items-center gap-1 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" /> All Requests
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="max-w-xs truncate font-medium text-slate-800">{request.title}</span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* ── Left / centre: main info ── */}
        <div className="space-y-5 lg:col-span-2">

          {/* Title card */}
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-slate-900">{request.title}</h1>
                <p className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                  <Clock className="h-3.5 w-3.5" />
                  Created {formatDate(request.timestamp)}
                  {request.updatedAt && ` · Updated ${timeAgo(request.updatedAt)}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <PriorityBadge priority={request.priority} />
                <StatusBadge status={request.status} />
              </div>
            </div>

            <p className="text-sm leading-relaxed text-slate-700">{request.description}</p>

            {request.transcript && (
              <div className="mt-4 rounded-lg bg-slate-50 p-3">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <Mic className="h-3.5 w-3.5" /> Voice Transcript
                </p>
                <p className="text-sm italic text-slate-600">&ldquo;{request.transcript}&rdquo;</p>
              </div>
            )}
          </div>

          {/* Details grid */}
          <Section title="Request Details">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Field
                label="Category"
                value={CATEGORY_LABELS[request.category] ?? request.category}
              />
              <Field label="Source" value={<SourceBadge source={request.source} />} />
              <Field
                label="Location"
                value={request.location
                  ? <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-slate-400" />{request.location}</span>
                  : undefined}
              />
              <Field
                label="Reported By"
                value={request.reportedBy
                  ? <span className="flex items-center gap-1"><User className="h-3 w-3 text-slate-400" />{request.reportedBy}</span>
                  : undefined}
              />
              <Field
                label="Assigned To"
                value={request.assignedTo
                  ? <span className="flex items-center gap-1"><User className="h-3 w-3 text-blue-400" />{request.assignedTo}</span>
                  : undefined}
              />
              <Field
                label="Request ID"
                value={<span className="font-mono text-xs text-slate-400">{request.id.slice(0, 8)}…</span>}
              />
            </div>
          </Section>

          {/* SLA + Escalation */}
          {(request.slaStatus || request.escalationLevel) && (
            <div className={`rounded-xl p-5 shadow-sm ring-1 ${
              request.slaStatus === 'BREACHED'
                ? 'bg-red-50 ring-red-200'
                : request.slaStatus === 'AT_RISK'
                  ? 'bg-amber-50 ring-amber-200'
                  : 'bg-white ring-slate-100'
            }`}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                SLA &amp; Escalation
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                <SlaBadge slaStatus={request.slaStatus} slaMinutesRemaining={request.slaMinutesRemaining} />
                <EscalationBadge level={request.escalationLevel} />
              </div>
              {request.slaTargetAt && (
                <p className="mt-2 text-xs text-slate-400">
                  SLA target: {new Date(request.slaTargetAt).toLocaleString()}
                </p>
              )}
              {request.lastEscalationReason && (
                <p className="mt-1 rounded-md bg-orange-50 px-3 py-1.5 text-xs text-orange-700">
                  {request.lastEscalationReason}
                </p>
              )}
            </div>
          )}

          {/* AI Insights */}
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              AI Insights
            </h3>
            <AiInsightsPanel
              summary={request.aiSummary}
              aiCategory={request.aiCategory}
              aiPriority={request.aiPriority}
              tags={request.aiTags}
              confidence={request.aiConfidence}
              reason={request.aiReason}
              engine={request.aiEngine}
              analyzedAt={request.aiAnalyzedAt}
              onReanalyze={handleReanalyze}
              isAnalyzing={analysing}
            />
          </div>

          {/* Notes / history */}
          <Section title="Activity & Notes">
            {request.notes.length === 0 ? (
              <p className="text-xs italic text-slate-400">
                No notes yet. Add one using the panel on the right.
              </p>
            ) : (
              <div className="space-y-3">
                {[...request.notes].reverse().map((note) => (
                  <div key={note.id} className="flex gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                      {note.author.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 rounded-lg bg-slate-50 px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700">{note.author}</span>
                        <span className="text-xs text-slate-400">{timeAgo(note.timestamp)}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{note.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>

        {/* ── Right: action panel ── */}
        <div className="space-y-5">

          {/* ── Operations Copilot (Phase 3) ── */}
          <CopilotPanel
            copilotSummary={request.copilotSummary}
            copilotSuggestedActions={request.copilotSuggestedActions}
            copilotResolutionSteps={request.copilotResolutionSteps}
            copilotRecommendedTeam={request.copilotRecommendedTeam}
            copilotRecommendedAssignee={request.copilotRecommendedAssignee}
            copilotEscalationLevel={request.copilotEscalationLevel ?? undefined}
            copilotShouldAlert={request.copilotShouldAlert}
            copilotAlertReason={request.copilotAlertReason}
            copilotDraftInternalNote={request.copilotDraftInternalNote}
            copilotDecisionTrace={request.copilotDecisionTrace}
            copilotEngine={request.copilotEngine}
            copilotGeneratedAt={request.copilotGeneratedAt}
            onRunCopilot={handleRunCopilot}
            isRunning={copiloting}
            onAcceptTeam={handleAcceptTeam}
            onUseInternalNote={handleUseInternalNote}
          />

          {/* Status update form */}
          <Section title="Update Request">
            {error && (
              <div className="mb-3 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 ring-1 ring-red-200">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Change Status
                </label>
                {availableStatuses.length === 0 ? (
                  <p className="flex items-center gap-1.5 text-xs text-slate-400">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    No further transitions available
                  </p>
                ) : (
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">— Keep current ({STATUS_LABELS[request.status] ?? request.status}) —</option>
                    {availableStatuses.map(s => (
                      <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Assign To
                </label>
                <input
                  value={assignee}
                  onChange={e => setAssignee(e.target.value)}
                  placeholder="Officer name or ID…"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  <MessageSquarePlus className="mr-1 inline h-3.5 w-3.5" />
                  Add Note
                </label>
                <input
                  value={noteAuthor}
                  onChange={e => setNoteAuthor(e.target.value)}
                  placeholder="Author name"
                  className="mb-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
                <textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  rows={3}
                  placeholder="Add a note or update comment…"
                  className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <button
                onClick={handleUpdate}
                disabled={saving || (!newStatus && !noteText && assignee === (request.assignedTo || ''))}
                className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? 'Saving…' : 'Save Update'}
              </button>
            </div>
          </Section>

          {/* Lifecycle guide */}
          <Section title="Lifecycle Status">
            <div className="space-y-2">
              {['NEW', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED'].map((s, i) => {
                const steps = ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED'];
                const done    = steps.indexOf(request.status) > i;
                const current = request.status === s;
                return (
                  <div
                    key={s}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium ${
                      current ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                      : done   ? 'text-green-600'
                      : 'text-slate-400'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                        current ? 'bg-blue-600 text-white'
                        : done   ? 'bg-green-500 text-white'
                        : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      {done ? '✓' : i + 1}
                    </span>
                    {STATUS_LABELS[s]}
                    {current && <span className="ml-auto text-[10px] text-blue-500">Current</span>}
                  </div>
                );
              })}
            </div>
          </Section>

          <Link
            href="/requests"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" /> Back to All Requests
          </Link>
        </div>
      </div>
    </div>
  );
}
