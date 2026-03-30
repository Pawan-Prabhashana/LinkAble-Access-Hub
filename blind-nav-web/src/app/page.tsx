'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { IssueRequest } from '@/types/request';
import { timeAgo } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import PriorityBadge from '@/components/ui/PriorityBadge';
import {
  ClipboardList, Clock, AlertTriangle, CheckCircle2,
  PlusCircle, ArrowRight, RefreshCw, Wifi, WifiOff,
} from 'lucide-react';

interface Stats {
  total: number;
  newCount: number;
  inProgress: number;
  critical: number;
}

function computeStats(requests: IssueRequest[]): Stats {
  return {
    total:      requests.length,
    newCount:   requests.filter(r => r.status === 'NEW').length,
    inProgress: requests.filter(r => r.status === 'IN_PROGRESS' || r.status === 'ASSIGNED').length,
    critical:   requests.filter(r => r.priority === 'CRITICAL' || r.priority === 'HIGH').length,
  };
}

function StatCard({
  label, value, icon: Icon, color, sub,
}: {
  label: string; value: number; icon: React.ElementType;
  color: string; sub?: string;
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className={`mt-1 text-3xl font-bold ${color}`}>{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
        </div>
        <div className={`rounded-lg p-2.5 ${color.replace('text-', 'bg-').replace('-600', '-50').replace('-700', '-50')}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [requests, setRequests] = useState<IssueRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState(true);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getRequests();
      setRequests(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      setOnline(true);
    } catch {
      setError('Could not reach backend. Is the server running?');
      setOnline(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = computeStats(requests);
  const recent = requests.slice(0, 6);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Accessibility request operations overview
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${online ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
            {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {online ? 'Backend Connected' : 'Backend Offline'}
          </span>
          <button
            onClick={load}
            className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            href="/requests/new"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            New Request
          </Link>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Requests"  value={stats.total}      icon={ClipboardList}   color="text-slate-700"  sub="All time" />
        <StatCard label="New"             value={stats.newCount}   icon={Clock}           color="text-blue-600"   sub="Awaiting action" />
        <StatCard label="In Progress"     value={stats.inProgress} icon={RefreshCw}       color="text-amber-600"  sub="Assigned + active" />
        <StatCard label="High Priority"   value={stats.critical}   icon={AlertTriangle}   color="text-red-600"    sub="Critical + High" />
      </div>

      {/* Recent requests */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Recent Requests</h2>
          <Link href="/requests" className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
            Loading requests…
          </div>
        ) : recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle2 className="mb-3 h-10 w-10 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">No requests yet</p>
            <p className="mt-1 text-xs text-slate-400">New requests from the mobile app will appear here</p>
            <Link href="/requests/new" className="mt-4 text-sm font-semibold text-blue-600 hover:underline">
              Create your first request →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {recent.map((r) => (
              <Link
                key={r.id}
                href={`/requests/${r.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{r.title}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-400">
                    {r.location ? `📍 ${r.location} · ` : ''}{timeAgo(r.timestamp)}
                  </p>
                </div>
                <div className="ml-4 flex shrink-0 items-center gap-2">
                  <PriorityBadge priority={r.priority} />
                  <StatusBadge status={r.status} />
                  <ArrowRight className="ml-1 h-3.5 w-3.5 text-slate-300" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        {[
          { label: 'Create Manual Request', desc: 'Officer intake form', href: '/requests/new', color: 'blue' },
          { label: 'View All Requests',      desc: 'Filter and search',   href: '/requests',     color: 'slate' },
          { label: 'High Priority Queue',    desc: 'Critical & High',     href: '/requests?priority=CRITICAL', color: 'red' },
        ].map(({ label, desc, href, color }) => (
          <Link
            key={href}
            href={href}
            className={`rounded-xl border-2 border-dashed p-5 text-center transition-colors hover:border-solid ${
              color === 'blue'  ? 'border-blue-200 hover:border-blue-400 hover:bg-blue-50' :
              color === 'red'   ? 'border-red-200 hover:border-red-400 hover:bg-red-50' :
              'border-slate-200 hover:border-slate-400 hover:bg-slate-50'
            }`}
          >
            <p className={`text-sm font-semibold ${color === 'blue' ? 'text-blue-700' : color === 'red' ? 'text-red-700' : 'text-slate-700'}`}>
              {label}
            </p>
            <p className="mt-1 text-xs text-slate-400">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
