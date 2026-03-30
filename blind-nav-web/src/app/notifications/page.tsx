'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Notification, NotificationStats } from '@/types/notification';
import { timeAgo } from '@/lib/utils';
import Link from 'next/link';
import {
  Mail, MessageSquare, Bell, MonitorSmartphone, Send,
  RefreshCw, Inbox, CheckCircle2, Filter, Zap,
} from 'lucide-react';

const CHANNEL_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  EMAIL:  { icon: Mail,             color: 'text-blue-600',   bg: 'bg-blue-50'   },
  SMS:    { icon: MessageSquare,    color: 'text-green-600',  bg: 'bg-green-50'  },
  IN_APP: { icon: Bell,             color: 'text-violet-600', bg: 'bg-violet-50' },
  PUSH:   { icon: MonitorSmartphone,color: 'text-orange-600', bg: 'bg-orange-50' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PREPARED:  { label: 'Prepared',  color: 'bg-slate-100  text-slate-600'   },
  QUEUED:    { label: 'Queued',    color: 'bg-amber-100  text-amber-700'   },
  SENT:      { label: 'Sent',      color: 'bg-blue-100   text-blue-700'    },
  DELIVERED: { label: 'Delivered', color: 'bg-green-100  text-green-700'   },
};

const TYPE_LABELS: Record<string, string> = {
  CRITICAL_ALERT: '🔴 Critical Alert',
  SLA_WARNING:    '⚠️ SLA Warning',
  SLA_BREACH:     '🔥 SLA Breach',
  ESCALATION:     '🛡️ Escalation',
  GENERAL:        '📋 General',
};

type ChannelFilter = 'ALL' | 'EMAIL' | 'SMS' | 'IN_APP' | 'PUSH';

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [stats,  setStats]  = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ChannelFilter>('ALL');
  const [sending, setSending] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, s] = await Promise.all([api.getNotifications(), api.getNotificationStats()]);
      setNotifs(data);
      setStats(s);
    } catch { /* backend offline */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'ALL' ? notifs : notifs.filter(n => n.channel === filter);

  const handleSend = async (id: string) => {
    setSending(id);
    try {
      await api.simulateSend(id);
      await load();
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold text-slate-900">
            <Send className="h-6 w-6 text-slate-600" />
            Notification Centre
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Multi-channel notifications · Real emails sent to <strong>pawanprabhashana11@gmail.com</strong> when SMTP is configured
          </p>
        </div>
        <button onClick={load} className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
          {[
            { label: 'Total',     value: stats.total,               color: 'text-slate-700', bg: 'bg-slate-50'   },
            { label: 'Prepared',  value: stats.prepared,            color: 'text-amber-700', bg: 'bg-amber-50'   },
            { label: 'Sent',      value: stats.sent,                color: 'text-blue-700',  bg: 'bg-blue-50'    },
            { label: 'Email',     value: stats.byChannel.EMAIL,     color: 'text-blue-700',  bg: 'bg-blue-50'    },
            { label: 'SMS',       value: stats.byChannel.SMS,       color: 'text-green-700', bg: 'bg-green-50'   },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`rounded-xl ${bg} p-4 ring-1 ring-slate-100`}>
              <p className="text-xs font-medium text-slate-500">{label}</p>
              <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="mb-4 flex items-center gap-1 rounded-lg bg-slate-100 p-1 w-fit">
        <Filter className="ml-2 h-3.5 w-3.5 text-slate-400" />
        {(['ALL','EMAIL','SMS','IN_APP','PUSH'] as ChannelFilter[]).map(ch => {
          const cfg = ch !== 'ALL' ? CHANNEL_CONFIG[ch] : null;
          const Icon = cfg?.icon ?? Bell;
          return (
            <button
              key={ch}
              onClick={() => setFilter(ch)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                filter === ch ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="h-3 w-3" />
              {ch === 'IN_APP' ? 'In-App' : ch.charAt(0) + ch.slice(1).toLowerCase()}
            </button>
          );
        })}
      </div>

      {/* Notification list */}
      <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Loading notifications…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Inbox className="mb-3 h-12 w-12 text-slate-200" />
            <p className="text-sm text-slate-400">No notifications yet</p>
            <p className="mt-1 text-xs text-slate-300">Notifications are generated automatically when alerts fire</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map(n => {
              const chCfg = CHANNEL_CONFIG[n.channel] ?? CHANNEL_CONFIG.IN_APP;
              const sCfg  = STATUS_CONFIG[n.status]  ?? STATUS_CONFIG.PREPARED;
              const ChIcon = chCfg.icon;
              return (
                <div key={n.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                  {/* Channel icon */}
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${chCfg.bg}`}>
                    <ChIcon className={`h-4 w-4 ${chCfg.color}`} />
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-slate-800">{n.subject}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${sCfg.color}`}>
                        {sCfg.label}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-400 flex-wrap">
                      <span>{TYPE_LABELS[n.type] ?? n.type}</span>
                      <span>·</span>
                      <span className="font-medium text-slate-500">To: {n.recipient}</span>
                      <span>·</span>
                      <span>{timeAgo(n.createdAt)}</span>
                      {n.requestId && (
                        <>
                          <span>·</span>
                          <Link href={`/requests/${n.requestId}`} className="text-blue-500 hover:underline">
                            View request →
                          </Link>
                        </>
                      )}
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500 line-clamp-2">{n.body}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-2">
                    {n.status === 'PREPARED' && (
                      <button
                        onClick={() => handleSend(n.id)}
                        disabled={sending === n.id}
                        className="flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1.5 text-[10px] font-semibold text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-50"
                      >
                        {sending === n.id
                          ? <RefreshCw className="h-3 w-3 animate-spin" />
                          : <Zap className="h-3 w-3" />
                        }
                        Simulate Send
                      </button>
                    )}
                    {n.status === 'SENT' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    {n.status === 'DELIVERED' && <CheckCircle2 className="h-4 w-4 text-blue-500" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-5 py-3 flex items-start gap-3">
        <Mail className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-blue-800">Real email delivery</p>
          <p className="text-xs text-blue-600 mt-0.5">
            EMAIL channel notifications trigger real emails to <strong>pawanprabhashana11@gmail.com</strong> when
            <code className="mx-1 rounded bg-blue-100 px-1 text-blue-700">SMTP_EMAIL</code> and
            <code className="rounded bg-blue-100 px-1 text-blue-700">SMTP_PASSWORD</code> are set in the backend <code className="rounded bg-blue-100 px-1 text-blue-700">.env</code>.
            SMS and Push remain simulated.
          </p>
        </div>
      </div>
    </div>
  );
}
