'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { IssueRequest } from '@/types/request';
import { CATEGORY_LABELS, SOURCE_LABELS, AI_CATEGORY_LABELS } from '@/constants/enums';
import { timeAgo, truncate } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import PriorityBadge from '@/components/ui/PriorityBadge';
import SourceBadge from '@/components/ui/SourceBadge';
import AiCategoryBadge from '@/components/ui/AiCategoryBadge';
import SlaBadge from '@/components/ui/SlaBadge';
import EscalationBadge from '@/components/ui/EscalationBadge';
import { PlusCircle, Search, RefreshCw, ArrowRight, SlidersHorizontal, Sparkles } from 'lucide-react';

const STATUS_OPTIONS   = ['', 'NEW', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const PRIORITY_OPTIONS = ['', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'PENDING_REVIEW'];
const CATEGORY_OPTIONS = ['', ...Object.keys(CATEGORY_LABELS)];
const SOURCE_OPTIONS   = ['', ...Object.keys(SOURCE_LABELS)];

export default function RequestsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Loading…</div>}>
      <RequestsContent />
    </Suspense>
  );
}

function RequestsContent() {
  const searchParams = useSearchParams();
  const [requests, setRequests] = useState<IssueRequest[]>([]);
  const [loading, setLoading]   = useState(true);

  const [search,          setSearch]          = useState('');
  const [filterStatus,    setFilterStatus]    = useState(searchParams.get('status')   || '');
  const [filterPriority,  setFilterPriority]  = useState(searchParams.get('priority') || '');
  const [filterCategory,  setFilterCategory]  = useState(searchParams.get('category') || '');
  const [filterSource,    setFilterSource]    = useState(searchParams.get('source')   || '');

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getRequests();
      setRequests(
        data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (filterStatus   && r.status   !== filterStatus)   return false;
      if (filterPriority && r.priority !== filterPriority) return false;
      if (filterCategory && r.category !== filterCategory) return false;
      if (filterSource   && r.source   !== filterSource)   return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !r.title.toLowerCase().includes(q) &&
          !r.description.toLowerCase().includes(q) &&
          !(r.location ?? '').toLowerCase().includes(q) &&
          !(r.aiSummary ?? '').toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [requests, filterStatus, filterPriority, filterCategory, filterSource, search]);

  const clearFilters = () => {
    setFilterStatus(''); setFilterPriority('');
    setFilterCategory(''); setFilterSource(''); setSearch('');
  };

  const hasFilters = filterStatus || filterPriority || filterCategory || filterSource || search;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">All Requests</h1>
          <p className="mt-1 text-sm text-slate-500">
            {filtered.length} of {requests.length} requests
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={load}
            className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/requests/new"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <PlusCircle className="h-4 w-4" /> New Request
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-5 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </div>

          <div className="relative min-w-48 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search title, description, AI summary…"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {[
            {
              value: filterStatus,   set: setFilterStatus,   options: STATUS_OPTIONS,
              labels: { '': 'All Statuses',   NEW: 'New', ASSIGNED: 'Assigned', IN_PROGRESS: 'In Progress', COMPLETED: 'Completed', CANCELLED: 'Cancelled' },
            },
            {
              value: filterPriority, set: setFilterPriority, options: PRIORITY_OPTIONS,
              labels: { '': 'All Priorities', CRITICAL: 'Critical', HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low', PENDING_REVIEW: 'Pending Review' },
            },
            {
              value: filterCategory, set: setFilterCategory, options: CATEGORY_OPTIONS,
              labels: { '': 'All Categories', ...CATEGORY_LABELS },
            },
            {
              value: filterSource,   set: setFilterSource,   options: SOURCE_OPTIONS,
              labels: { '': 'All Sources', ...SOURCE_LABELS },
            },
          ].map(({ value, set, options, labels }) => (
            <select
              key={Object.values(labels)[0]}
              value={value}
              onChange={e => set(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              {options.map(o => (
                <option key={o} value={o}>
                  {(labels as unknown as Record<string, string>)[o] ?? o}
                </option>
              ))}
            </select>
          ))}

          {hasFilters && (
            <button onClick={clearFilters} className="text-xs font-medium text-blue-600 hover:underline">
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <p className="font-medium">No requests match your filters</p>
            <button onClick={clearFilters} className="mt-2 text-sm text-blue-600 hover:underline">
              Clear filters
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3 text-left">Request</th>
                <th className="px-4 py-3 text-left">
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-violet-500" /> AI Category
                  </span>
                </th>
                <th className="px-4 py-3 text-left">Priority</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Source</th>
                <th className="px-4 py-3 text-left">SLA</th>
                <th className="px-4 py-3 text-left">Time</th>
                <th className="px-4 py-3 text-left">Assignee</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((r) => (
                <tr key={r.id} className={`transition-colors hover:bg-slate-50 ${
                  r.slaStatus === 'BREACHED' ? 'border-l-4 border-red-400 bg-red-50/30' :
                  r.slaStatus === 'AT_RISK'  ? 'border-l-4 border-amber-400 bg-amber-50/20' : ''
                }`}>
                  <td className="px-6 py-4">
                    <p className="max-w-xs truncate font-semibold text-slate-800">{r.title}</p>

                    {/* AI summary takes priority over raw description when available */}
                    {r.aiSummary ? (
                      <p className="mt-0.5 flex max-w-xs items-center gap-1 truncate text-xs text-violet-600">
                        <Sparkles className="h-3 w-3 shrink-0" />
                        {truncate(r.aiSummary, 60)}
                      </p>
                    ) : (
                      <p className="mt-0.5 max-w-xs truncate text-xs text-slate-400">
                        {truncate(r.description, 60)}
                      </p>
                    )}

                    {r.location && (
                      <p className="mt-0.5 text-xs text-slate-400">📍 {r.location}</p>
                    )}
                  </td>

                  {/* AI Category */}
                  <td className="px-4 py-4">
                    {r.aiCategory ? (
                      <AiCategoryBadge category={r.aiCategory} size="sm" />
                    ) : (
                      <span className="text-xs italic text-slate-300">
                        {AI_CATEGORY_LABELS[r.category] ?? r.category}
                      </span>
                    )}
                  </td>

                  {/* SLA */}
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1">
                      <SlaBadge slaStatus={r.slaStatus} slaMinutesRemaining={r.slaMinutesRemaining} size="sm" />
                      <EscalationBadge level={r.escalationLevel} size="sm" />
                    </div>
                  </td>

                  {/* Priority — show AI priority if it differs from user-set */}
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1">
                      <PriorityBadge priority={r.priority} />
                      {r.aiPriority && r.aiPriority !== r.priority && r.priority === 'PENDING_REVIEW' && (
                        <span className="flex items-center gap-1 text-[10px] text-violet-500">
                          <Sparkles className="h-2.5 w-2.5" /> AI: {r.aiPriority}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-4"><StatusBadge   status={r.status} /></td>
                  <td className="px-4 py-4"><SourceBadge   source={r.source} /></td>
                  <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-400">{timeAgo(r.timestamp)}</td>
                  <td className="px-4 py-4 text-xs text-slate-500">
                    {r.assignedTo || <span className="italic text-slate-300">Unassigned</span>}
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/requests/${r.id}`}
                      className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                    >
                      View <ArrowRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
