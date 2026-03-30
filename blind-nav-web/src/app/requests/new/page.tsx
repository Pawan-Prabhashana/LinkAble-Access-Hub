'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { CATEGORY_LABELS, REQUEST_CATEGORY, REQUEST_PRIORITY, PRIORITY_LABELS } from '@/constants/enums';
import { ArrowLeft, Send, ClipboardPlus } from 'lucide-react';

const SOURCES = [
  { value: 'officer_manual_entry', label: 'Manual Entry (Officer)' },
  { value: 'mobile_app',           label: 'Mobile App' },
  { value: 'assisted_call',        label: 'Assisted Call' },
  { value: 'mobile_voice_report',  label: 'Mobile Voice Report' },
];

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

  const [form, setForm] = useState({
    title:       '',
    description: '',
    category:    REQUEST_CATEGORY.ACCESSIBILITY_SUPPORT,
    priority:    'PENDING_REVIEW',
    location:    '',
    reportedBy:  '',
    source:      'officer_manual_entry',
  });

  const set = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

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
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Classification</h2>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Category" required>
                  <select
                    value={form.category}
                    onChange={e => set('category', e.target.value)}
                    className={inputCls}
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
                    className={inputCls}
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

            {/* Submit */}
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

            <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-400 ring-1 ring-slate-100">
              <p className="font-semibold text-slate-500 mb-1">What happens next?</p>
              <p>The request is created with status <strong>NEW</strong> and will appear on the dashboard. Use the detail view to assign and progress it through the workflow.</p>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}
