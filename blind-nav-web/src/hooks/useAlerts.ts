'use client';

/**
 * useAlerts — shared polling store.
 *
 * Uses a module-level singleton so multiple components (Sidebar, AlertTopBar,
 * dashboard page) all share one 15-second poll instead of firing independently.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Alert } from '@/types/alert';

const POLL_INTERVAL_MS = 15_000;

// ── Module-level shared state ─────────────────────────────────────────────────
let sharedAlerts: Alert[] = [];
let sharedUnread = 0;
let listeners: Array<() => void> = [];
let timerRef: ReturnType<typeof setInterval> | null = null;
let fetching = false;

function notifyAll() {
  listeners.forEach(fn => fn());
}

async function fetchShared() {
  if (fetching) return;
  fetching = true;
  try {
    const data = await api.getAlerts();
    sharedAlerts = data;
    sharedUnread = data.filter(a => !a.isRead).length;
    notifyAll();
  } catch {
    // backend offline — keep last known state
  } finally {
    fetching = false;
  }
}

function startPolling() {
  if (timerRef) return;
  fetchShared(); // immediate
  timerRef = setInterval(fetchShared, POLL_INTERVAL_MS);
}

function stopPolling() {
  if (listeners.length === 0 && timerRef) {
    clearInterval(timerRef);
    timerRef = null;
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

interface UseAlertsReturn {
  alerts: Alert[];
  unreadCount: number;
  loading: boolean;
  refresh: () => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

export function useAlerts(): UseAlertsReturn {
  const [, forceRender] = useState(0);
  const [loading, setLoading] = useState(false);

  const listener = useCallback(() => {
    forceRender(n => n + 1);
  }, []);

  useEffect(() => {
    listeners.push(listener);
    startPolling();
    return () => {
      listeners = listeners.filter(l => l !== listener);
      stopPolling();
    };
  }, [listener]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchShared();
    setLoading(false);
  }, []);

  const markRead = useCallback(async (id: string) => {
    await api.markAlertRead(id);
    sharedAlerts = sharedAlerts.map(a => a.id === id ? { ...a, isRead: true } : a);
    sharedUnread = Math.max(0, sharedUnread - 1);
    notifyAll();
  }, []);

  const markAllRead = useCallback(async () => {
    await api.markAllAlertsRead();
    sharedAlerts = sharedAlerts.map(a => ({ ...a, isRead: true }));
    sharedUnread = 0;
    notifyAll();
  }, []);

  return {
    alerts: sharedAlerts,
    unreadCount: sharedUnread,
    loading,
    refresh,
    markRead,
    markAllRead,
  };
}
