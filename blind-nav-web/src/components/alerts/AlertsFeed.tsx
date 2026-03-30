'use client';

import Link from 'next/link';
import { Alert } from '@/types/alert';
import { timeAgo } from '@/lib/utils';
import { Bell, Flame, AlertTriangle, ShieldAlert, Info, CheckCheck, RefreshCw } from 'lucide-react';

const SEVERITY_CONFIG: Record<string, { bg: string; border: string; icon: React.ElementType; iconColor: string }> = {
  CRITICAL: { bg: 'bg-red-50',    border: 'border-red-200',   icon: Flame,          iconColor: 'text-red-600'  },
  HIGH:     { bg: 'bg-orange-50', border: 'border-orange-200',icon: AlertTriangle,  iconColor: 'text-orange-600'},
  WARNING:  { bg: 'bg-amber-50',  border: 'border-amber-200', icon: ShieldAlert,    iconColor: 'text-amber-600' },
  INFO:     { bg: 'bg-blue-50',   border: 'border-blue-200',  icon: Info,           iconColor: 'text-blue-600'  },
};

interface Props {
  alerts: Alert[];
  loading?: boolean;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  maxItems?: number;
  showHeader?: boolean;
}

export default function AlertsFeed({
  alerts,
  loading = false,
  onMarkRead,
  onMarkAllRead,
  maxItems = 20,
  showHeader = true,
}: Props) {
  const visible = alerts.slice(0, maxItems);
  const unread  = alerts.filter(a => !a.isRead).length;

  return (
    <div className="flex flex-col">
      {showHeader && (
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-700">Alerts</span>
            {unread > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {loading && <RefreshCw className="h-3.5 w-3.5 animate-spin text-slate-400" />}
            {unread > 0 && (
              <button
                onClick={onMarkAllRead}
                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
              >
                <CheckCheck className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>
        </div>
      )}

      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Bell className="mb-2 h-8 w-8 text-slate-200" />
          <p className="text-sm text-slate-400">No alerts yet</p>
          <p className="mt-0.5 text-xs text-slate-300">Alerts will appear here as requests come in</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map(alert => {
            const cfg = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.INFO;
            const Icon = cfg.icon;
            return (
              <div
                key={alert.id}
                className={`relative rounded-lg border p-3 transition-all ${cfg.bg} ${cfg.border} ${
                  alert.isRead ? 'opacity-60' : ''
                }`}
              >
                {!alert.isRead && (
                  <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500" />
                )}
                <div className="flex items-start gap-2.5">
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${cfg.iconColor}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800">{alert.title}</p>
                    <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">{alert.message}</p>
                    <div className="mt-1.5 flex items-center gap-3">
                      <span className="text-[10px] text-slate-400">{timeAgo(alert.createdAt)}</span>
                      {alert.requestId && (
                        <Link
                          href={`/requests/${alert.requestId}`}
                          className="text-[10px] font-medium text-blue-600 hover:underline"
                        >
                          View request →
                        </Link>
                      )}
                      {!alert.isRead && (
                        <button
                          onClick={() => onMarkRead(alert.id)}
                          className="text-[10px] text-slate-400 hover:text-slate-600"
                        >
                          Dismiss
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
