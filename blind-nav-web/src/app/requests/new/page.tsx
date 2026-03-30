'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { CATEGORY_LABELS, REQUEST_CATEGORY, REQUEST_PRIORITY, PRIORITY_LABELS } from '@/constants/enums';
import { ArrowLeft, Send, ClipboardPlus, Sparkles, RefreshCw, Zap, CheckCircle2 } from 'lucide-react';

const SOURCES = [
  { value: 'officer_manual_entry', label: 'Manual Entry (Officer)' },
  { value: 'mobile_app',           label: 'Mobile App' },
  { value: 'assisted_call',        label: 'Assisted Call' },
  { value: 'mobile_voice_report',  label: 'Mobile Voice Report' },
];

const AI_CATEGORY_MAP: Record<string, string> = {
  PHYSICAL_OBSTRUCTION:          'PHYSICAL_OBSTRUCTION',
  ACCESSIBILITY_EQUIPMENT_ISSUE: 'ACCESSIBILITY_EQUIPMENT_ISSUE',
  NAVIGATION_ASSISTANCE:         'NAVIGATION_ASSISTANCE',
  UNSAFE_ENVIRONMENT:            'UNSAFE_ENVIRONMENT',
  FACILITY_ACCESS_ISSUE:         'FACILITY_ACCESS_ISSUE',
  EMERGENCY_SUPPORT:             'EMERGENCY_SUPPORT',
};

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-semibold text-slate-700">
        {label}{required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
      {children}
    </div>
  );
}

const inputCls = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400';

export default function NewRequestPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI draft assistant state
  const [rawText,   setRawText]   = useState('');
  const [drafting,  setDrafting]  = useState(false);
  const [draftDone, setDraftDone] = useState(false);

  const [form, setForm] = useState<{
    title: string; description: string; category: string; priority: string;
    location: string; reportedBy: string; source: string;
  }>({
    title:       '',
    description: '',
    category:    REQUEST_CATEGORY.ACCESSIBILITY_SUPPORT as string,
    priority:    'PENDING_REVIEW',
    location:    '',
    reportedBy:  '',
    source:      'officer_manual_entry',
  });

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  // ── AI Draft Assistant ──────────────────────────────────────────────────────
  const handleDraftFromText = async () => {
    if (!rawText.trim()) return;
    setDrafting(true);
    setDraftDone(false);
    try {
      const result = await api.analyzeText(rawText, '', '');
      // Auto-fill form from AI predictions
      const cat = AI_CATEGORY_MAP[result.predictedCategory] ?? form.category;
      const pri = ['CRITICAL','HIGH','MEDIUM','LOW'].includes(result.predictedPriority)
        ? result.predictedPriority
        : 'PENDING_REVIEW';
      const summary = result.aiSummary || rawText.slice(0, 120);
      setForm(f => ({
        ...f,
        title:       summary.length > 80 ? summary.slice(0, 80) + '…' : summary,
        description: rawText,
        category:    cat,
        priority:    pri,
      }));
      setDraftDone(true);
    } catch {
      // fallback: just copy raw text
      setForm(f => ({
        ...f,
        title:       rawText.slice(0, 80),
        description: rawText,
      }));
      setDraftDone(true);
    } finally {
      setDrafting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setError('Title and description are required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const created = await api.createRequest(form);
      router.push(`/requests/${created.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission failed. Is the backend running?');
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/requests" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" /> Back to requests
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
            <ClipboardPlus className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">New Request</h1>
            <p className="text-sm text-slate-500">Manual intake — officer or helpdesk operator</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* ── Main form ── */}
          <div className="space-y-5 lg:col-span-2">

            {/* ── AI Draft Assistant ── */}
            <div className="rounded-xl bg-gradient-to-br from-violet-50 via-white to-white p-5 ring-1 ring-violet-100">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100">
                  <Sparkles className="h-3.5 w-3.5 text-violet-600" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-violet-600">
                  AI Draft Assistant
                </span>
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-500">
                  Phase 5
                </span>
              </div>
              <p className="mb-3 text-xs text-slate-500">
                Paste or type the raw issue text — the AI will automatically classify it and fill in the form below.
              </p>
              <textarea
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                rows={3}
                placeholder="e.g. The accessible entrance on the east side of Block A is blocked by construction equipment. A wheelchair user was unable to enter. Needs urgent clearance."
                className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 placeholder:text-slate-300 resize-none"
              />
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDraftFromText}
                  disabled={!rawText.trim() || drafting}
                  className="flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {drafting
                    ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Analysing…</>
                    : <><Zap className="h-3.5 w-3.5" /> Draft from Text</>
                  }
                </button>
                {draftDone && (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-green-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Form auto-filled from AI analysis — review and submit
                  </span>
                )}
              </div>
            </div>

            {/* Request details */}
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100 space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Request Details</h2>

              <Field label="Title" required hint="Short, clear summary of the accessibility issue">
                <input
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  placeholder="e.g. Accessible entrance blocked by construction"
                  className={inputCls}
                  required
                />
              </Field>

              <Field label="Description" required hint="Full description of the issue and impact">
                <textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  rows={4}
                  placeholder="Describe what the user reported, the location context, and any immediate impact…"
                  className={`${inputCls} resize-none`}
                  required
                />
              </Field>

              <Field label="Location" hint="Building, floor, or specific area (helps responders navigate)">
                <input
                  value={form.location}
                  onChange={e => set('location', e.target.value)}
                  placeholder="e.g. Building A, Ground Floor, East Wing"
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Classification</h2>
                {draftDone && (
                  <span className="flex items-center gap-1 text-[10px] text-violet-500">
                    <Sparkles className="h-2.5 w-2.5" /> AI-suggested
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Category" required>
                  <select
                    value={form.category}
                    onChange={e => set('category', e.target.value)}
                    className={`${inputCls} ${draftDone ? 'ring-2 ring-violet-100 border-violet-300' : ''}`}
                  >
                    {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Priority">
                  <select
                    value={form.priority}
                    onChange={e => set('priority', e.target.value)}
                    className={`${inputCls} ${draftDone ? 'ring-2 ring-violet-100 border-violet-300' : ''}`}
                  >
                    {Object.entries(REQUEST_PRIORITY).map(([v]) => (
                      <option key={v} value={v}>{PRIORITY_LABELS[v]}</option>
                    ))}
                    <option value="PENDING_REVIEW">Pending Review</option>
                  </select>
                </Field>
              </div>
            </div>
          </div>

          {/* ── Sidebar panel ── */}
          <div className="space-y-5">
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Intake Info</h2>

              <Field label="Source" hint="How this request was received">
                <select
                  value={form.source}
                  onChange={e => set('source', e.target.value)}
                  className={inputCls}
                >
                  {SOURCES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </Field>

              <Field label="Reported By" hint="Name or contact of the person who reported this">
                <input
                  value={form.reportedBy}
                  onChange={e => set('reportedBy', e.target.value)}
                  placeholder="e.g. John Smith or anonymous"
                  className={inputCls}
                />
              </Field>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-4 w-4" />
              {submitting ? 'Submitting…' : 'Submit Request'}
            </button>

            <Link
              href="/requests"
              className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white py-3 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>

            <div className="rounded-xl bg-violet-50 p-4 text-xs text-violet-600 ring-1 ring-violet-100">
              <p className="font-semibold mb-1 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> AI will enrich this request
              </p>
              <p className="text-violet-500">On submission, the AI pipeline runs automatically: priority prediction, category classification, GenAI copilot recommendations, SLA target calculation, and alert generation.</p>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}
