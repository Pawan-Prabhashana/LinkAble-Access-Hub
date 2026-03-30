'use client';

import { useAlerts } from '@/hooks/useAlerts';
import { useCallback, useState } from 'react';
import { api } from '@/lib/api';
import AlertsFeed from '@/components/alerts/AlertsFeed';
import { Alert } from '@/types/alert';
import {
  Bell, Flame, AlertTriangle, ShieldAlert, CheckCheck,
  RefreshCw, Filter,
} from 'lucide-react';

type FilterKey = 'all' | 'CRITICAL' | 'HIGH' | 'WARNING' | 'INFO' | 'unread';

const FILTER_TABS: { key: FilterKey; label: string; icon: React.ElementType }[] = [
  { key: 'all',      label: 'All',      icon: Bell        },
  { key: 'unread',   label: 'Unread',   icon: Bell        },
  { key: 'CRITICAL', label: 'Critical', icon: Flame       },
  { key: 'HIGH',     label: 'High',     icon: AlertTriangle },
  { key: 'WARNING',  label: 'Warning',  icon: ShieldAlert },
];

export default function AlertsPage() {
  const { alerts, unreadCount, loading, refresh, markRead, markAllRead } = useAlerts();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [clearing, setClearing] = useState(false);

  const filtered: Alert[] = alerts.filter(a => {
    if (filter === 'unread')    return !a.isRead;
    if (filter === 'all')       return true;
    return a.severity === filter;
  });

  const handleClear = useCallback(async () => {
    setClearing(true);
    try {
      await api.markAllAlertsRead();
      await refresh();
    } finally {
      setClearing(false);
    }
  }, [refresh]);

  const handleRefreshSla = useCallback(async () => {
    try {
      const result = await api.refreshSla();
      await refresh();
      // toast-style console feedback
      console.log('[SLA Refresh]', result);
    } catch (err) {
      console.error('SLA refresh failed', err);
    }
  }, [refresh]);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold text-slate-900">
            <Bell className="h-6 w-6 text-slate-600" />
            Alert Centre
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Real-time operational alerts · Auto-refreshes every 10 seconds
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefreshSla}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4" /> Trigger SLA Check
          </button>
          <button
            onClick={handleClear}
            disabled={clearing}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
          <button
            onClick={refresh}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Summary row */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        {[
          { label: 'Total Alerts',    value: alerts.length,                                    color: 'text-slate-700',  bg: 'bg-slate-50' },
          { label: 'Unread',          value: unreadCount,                                      color: 'text-blue-700',   bg: 'bg-blue-50'  },
          { label: 'Critical',        value: alerts.filter(a=>a.severity==='CRITICAL').length, color: 'text-red-700',    bg: 'bg-red-50'   },
          { label: 'High Priority',   value: alerts.filter(a=>a.severity==='HIGH').length,     color: 'text-orange-700', bg: 'bg-orange-50'},
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`rounded-xl ${bg} p-4 ring-1 ring-slate-100`}>
            <p className="text-xs font-medium text-slate-500">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex items-center gap-1 rounded-lg bg-slate-100 p-1 w-fit">
        <Filter className="ml-2 h-3.5 w-3.5 text-slate-400" />
        {FILTER_TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              filter === key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="h-3 w-3" />
            {label}
            {key !== 'all' && key !== 'unread' && (
              <span className="text-[10px] text-slate-400">
                ({alerts.filter(a => a.severity === key).length})
              </span>
            )}
            {key === 'unread' && (
              <span className="text-[10px] text-slate-400">({unreadCount})</span>
            )}
          </button>
        ))}
      </div>

      {/* Alert feed */}
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <AlertsFeed
          alerts={filtered}
          loading={loading}
          onMarkRead={markRead}
          onMarkAllRead={markAllRead}
          maxItems={100}
          showHeader={false}
        />
      </div>
    </div>
  );
}
