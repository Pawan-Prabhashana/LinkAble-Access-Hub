'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Alert } from '@/types/alert';

const POLL_INTERVAL_MS = 10_000; // 10 seconds

interface UseAlertsReturn {
  alerts: Alert[];
  unreadCount: number;
  loading: boolean;
  refresh: () => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

export function useAlerts(): UseAlertsReturn {
  const [alerts, setAlerts]         = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading]       = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      const data = await api.getAlerts();
      setAlerts(data);
      setUnreadCount(data.filter(a => !a.isRead).length);
    } catch {
      // Silently fail — backend may not be running yet
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchAlerts();
    setLoading(false);
  }, [fetchAlerts]);

  const markRead = useCallback(async (id: string) => {
    await api.markAlertRead(id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await api.markAllAlertsRead();
    setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    // Initial load
    fetchAlerts();

    // Start polling
    intervalRef.current = setInterval(fetchAlerts, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchAlerts]);

  return { alerts, unreadCount, loading, refresh, markRead, markAllRead };
}
