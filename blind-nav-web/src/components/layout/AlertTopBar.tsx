'use client';

import Link from 'next/link';
import { Bell, Flame, X } from 'lucide-react';
import { useAlerts } from '@/hooks/useAlerts';
import { useState } from 'react';

export default function AlertTopBar() {
  const { alerts, unreadCount, markRead } = useAlerts();
  const [dismissed, setDismissed] = useState<string[]>([]);

  // Show only the most recent unread critical/high alert (if any)
  const topAlert = alerts.find(
    a => !a.isRead && !dismissed.includes(a.id) && (a.severity === 'CRITICAL' || a.severity === 'HIGH')
  );

  if (!topAlert) return null;

  const isCritical = topAlert.severity === 'CRITICAL';

  const dismiss = () => {
    setDismissed(prev => [...prev, topAlert.id]);
    markRead(topAlert.id);
  };

  return (
    <div className={`flex items-center justify-between px-4 py-2.5 text-sm font-medium ${
      isCritical
        ? 'bg-red-600 text-white'
        : 'bg-amber-500 text-white'
    }`}>
      <div className="flex items-center gap-2.5">
        {isCritical
          ? <Flame className="h-4 w-4 shrink-0" />
          : <Bell className="h-4 w-4 shrink-0" />
        }
        <span className="truncate">{topAlert.title}</span>
        {topAlert.requestId && (
          <Link
            href={`/requests/${topAlert.requestId}`}
            className="ml-2 rounded bg-white/20 px-2 py-0.5 text-xs font-semibold hover:bg-white/30 transition-colors"
          >
            View Request →
          </Link>
        )}
      </div>
      <div className="flex items-center gap-3">
        {unreadCount > 1 && (
          <Link href="/alerts" className="text-xs opacity-80 hover:opacity-100 underline">
            +{unreadCount - 1} more alerts
          </Link>
        )}
        <button onClick={dismiss} className="opacity-70 hover:opacity-100 transition-opacity">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
