'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { IssueRequest } from '@/types/request';
import { SlaStats } from '@/types/alert';
import { timeAgo } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import PriorityBadge from '@/components/ui/PriorityBadge';
import SlaBadge from '@/components/ui/SlaBadge';
import AlertsFeed from '@/components/alerts/AlertsFeed';
import { useAlerts } from '@/hooks/useAlerts';
import {
  ClipboardList, AlertTriangle, CheckCircle2,
  PlusCircle, ArrowRight, RefreshCw, Wifi, WifiOff,
  Flame, ShieldAlert, Activity, Bell,
} from 'lucide-react';

function StatCard({
  label, value, icon: Icon, colorClass, sub, href,
}: {
  label: string; value: number | string; icon: React.ElementType;
  colorClass: string; sub?: string; href?: string;
}) {
  const inner = (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className={`mt-1 text-3xl font-bold ${colorClass}`}>{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
        </div>
        <div className={`rounded-lg p-2.5 ${colorClass.replace('text-', 'bg-').replace('-700','-50').replace('-600','-50').replace('-500','-50')}`}>
          <Icon className={`h-5 w-5 ${colorClass}`} />
        </div>
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function DashboardPage() {
  const [requests, setRequests]   = useState<IssueRequest[]>([]);
  const [slaStats, setSlaStats]   = useState<SlaStats | null>(null);
  const [loading, setLoading]     = useState(true);
  const [online, setOnline]       = useState(true);
  const { alerts, unreadCount, markRead, markAllRead } = useAlerts();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, stats] = await Promise.all([
        api.getRequests(),
        api.getSlaStats(),
      ]);
      setRequests(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      setSlaStats(stats);
      setOnline(true);
    } catch {
      setOnline(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const recent = requests.slice(0, 6);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Operations Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Real-time accessibility request control centre</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${online ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
            {online ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {online ? 'Backend Connected' : 'Backend Offline'}
          </span>
          <button onClick={load} className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <Link href="/requests/new" className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
            <PlusCircle className="h-4 w-4" /> New Request
          </Link>
        </div>
      </div>

      {/* SLA Operations cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active Requests"  value={slaStats?.activeRequests ?? requests.filter(r => !['COMPLETED','CANCELLED'].includes(r.status)).length}  icon={ClipboardList}  colorClass="text-slate-700"  sub="Open right now" href="/requests" />
        <StatCard label="SLA At Risk"      value={slaStats?.atRisk      ?? 0} icon={AlertTriangle}  colorClass="text-amber-600"  sub="Approaching deadline" href="/requests?sla=AT_RISK" />
        <StatCard label="SLA Breached"     value={slaStats?.breached    ?? 0} icon={Flame}          colorClass="text-red-600"    sub="Past SLA target"     href="/requests?sla=BREACHED" />
        <StatCard label="Escalated"        value={slaStats?.escalated   ?? 0} icon={ShieldAlert}    colorClass="text-orange-600" sub="Needs management review" />
      </div>
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Critical Open"    value={slaStats?.criticalOpen ?? requests.filter(r=>r.priority==='CRITICAL'&&r.status!=='COMPLETED').length}  icon={Flame}     colorClass="text-red-700"    sub="CRITICAL priority" />
        <StatCard label="In Progress"      value={requests.filter(r => r.status==='IN_PROGRESS'||r.status==='ASSIGNED').length} icon={Activity}   colorClass="text-blue-600"   sub="Assigned + active" />
        <StatCard label="Completed Today"  value={requests.filter(r => r.status==='COMPLETED').length}                          icon={CheckCircle2}colorClass="text-green-600"  sub="All time" />
        <StatCard label="Unread Alerts"    value={unreadCount}                                                                   icon={Bell}        colorClass="text-violet-600" sub="Pending review" href="/alerts" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Recent requests */}
        <div className="lg:col-span-2 rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="text-base font-semibold text-slate-900">Recent Requests</h2>
            <Link href="/requests" className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Loading…
            </div>
          ) : recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CheckCircle2 className="mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm text-slate-400">No requests yet</p>
              <Link href="/requests/new" className="mt-4 text-sm font-semibold text-blue-600 hover:underline">Create first request →</Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {recent.map((r) => (
                <Link key={r.id} href={`/requests/${r.id}`}
                  className={`flex items-center justify-between px-6 py-4 transition-colors hover:bg-slate-50 ${
                    r.slaStatus === 'BREACHED' ? 'border-l-4 border-red-400' :
                    r.slaStatus === 'AT_RISK'  ? 'border-l-4 border-amber-400' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-800">{r.title}</p>
                      {r.escalationLevel && r.escalationLevel !== 'NONE' && (
                        <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-orange-500" />
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-400">
                      {r.location ? `📍 ${r.location} · ` : ''}{timeAgo(r.timestamp)}
                    </p>
                  </div>
                  <div className="ml-4 flex shrink-0 items-center gap-2">
                    <SlaBadge slaStatus={r.slaStatus} slaMinutesRemaining={r.slaMinutesRemaining} size="sm" />
                    <PriorityBadge priority={r.priority} />
                    <StatusBadge status={r.status} />
                    <ArrowRight className="ml-1 h-3.5 w-3.5 text-slate-300" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Alert feed */}
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-slate-500" />
              <h2 className="text-base font-semibold text-slate-900">Live Alerts</h2>
              {unreadCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <Link href="/alerts" className="text-xs font-medium text-blue-600 hover:underline">
              All alerts →
            </Link>
          </div>
          <AlertsFeed
            alerts={alerts}
            onMarkRead={markRead}
            onMarkAllRead={markAllRead}
            maxItems={8}
            showHeader={false}
          />
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        {[
          { label: 'Create Request',     desc: 'Manual intake form',  href: '/requests/new',            color: 'blue'  },
          { label: 'SLA Breached Queue', desc: 'Needs urgent action', href: '/requests?sla=BREACHED',   color: 'red'   },
          { label: 'Alert Centre',       desc: 'All operational alerts',href: '/alerts',                color: 'violet'},
        ].map(({ label, desc, href, color }) => (
          <Link key={href} href={href}
            className={`rounded-xl border-2 border-dashed p-5 text-center transition-all hover:border-solid ${
              color === 'blue'   ? 'border-blue-200   hover:border-blue-400   hover:bg-blue-50' :
              color === 'red'    ? 'border-red-200    hover:border-red-400    hover:bg-red-50' :
              color === 'violet' ? 'border-violet-200 hover:border-violet-400 hover:bg-violet-50' :
              'border-slate-200 hover:border-slate-400 hover:bg-slate-50'
            }`}
          >
            <p className={`text-sm font-semibold ${
              color === 'blue'   ? 'text-blue-700'   :
              color === 'red'    ? 'text-red-700'    :
              color === 'violet' ? 'text-violet-700' :
              'text-slate-700'
            }`}>{label}</p>
            <p className="mt-1 text-xs text-slate-400">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
