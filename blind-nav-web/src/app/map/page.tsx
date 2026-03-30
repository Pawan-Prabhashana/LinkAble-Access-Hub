'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';
import { IssueRequest } from '@/types/request';
import { RefreshCw, Map, Filter } from 'lucide-react';

// Load map without SSR (Leaflet requires browser globals)
const RequestMap = dynamic(() => import('@/components/map/RequestMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center rounded-xl bg-slate-100">
      <div className="text-center">
        <Map className="mx-auto mb-3 h-10 w-10 text-slate-300 animate-pulse" />
        <p className="text-sm text-slate-400">Loading map…</p>
      </div>
    </div>
  ),
});

type PriorityFilter = 'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
type StatusFilter   = 'ALL' | 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED';

const PRIORITY_EMOJI: Record<string, string> = {
  CRITICAL: '🔴', HIGH: '🟠', MEDIUM: '🟡', LOW: '🟢',
};

export default function MapPage() {
  const [requests,        setRequests]        = useState<IssueRequest[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [priorityFilter,  setPriorityFilter]  = useState<PriorityFilter>('ALL');
  const [statusFilter,    setStatusFilter]    = useState<StatusFilter>('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getRequests();
      setRequests(data);
    } catch { /* offline */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = requests.filter(r => {
    const hasCords = r.lat != null && r.lng != null;
    const pMatch = priorityFilter === 'ALL' || r.priority === priorityFilter;
    const sMatch = statusFilter   === 'ALL' || r.status   === statusFilter;
    return hasCords && pMatch && sMatch;
  });

  const mappableCount = requests.filter(r => r.lat != null).length;

  return (
    <div className="flex h-full flex-col p-8 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold text-slate-900">
            <Map className="h-6 w-6 text-slate-600" />
            Request Map
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {mappableCount} of {requests.length} requests have location coordinates
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          <Filter className="ml-2 h-3.5 w-3.5 text-slate-400" />
          {(['ALL','CRITICAL','HIGH','MEDIUM','LOW'] as PriorityFilter[]).map(p => (
            <button key={p} onClick={() => setPriorityFilter(p)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                priorityFilter === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {p !== 'ALL' && PRIORITY_EMOJI[p] + ' '}{p === 'ALL' ? 'All Priorities' : p}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          {(['ALL','NEW','ASSIGNED','IN_PROGRESS','COMPLETED'] as StatusFilter[]).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {s === 'ALL' ? 'All Statuses' : s.replace('_',' ')}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-400">
          Showing <strong className="text-slate-700">{filtered.length}</strong> requests on map
        </span>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="font-semibold">Markers:</span>
        {Object.entries(PRIORITY_EMOJI).map(([p, e]) => (
          <span key={p}>{e} {p}</span>
        ))}
        <span className="ml-4 italic text-slate-400">Click any marker for details</span>
      </div>

      {/* Map */}
      <div className="flex-1 min-h-[500px] rounded-xl overflow-hidden shadow-sm ring-1 ring-slate-200">
        {loading ? (
          <div className="flex h-full items-center justify-center bg-slate-100">
            <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <RequestMap requests={filtered} />
        )}
      </div>
    </div>
  );
}
