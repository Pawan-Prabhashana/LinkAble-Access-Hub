import {
  IssueRequest,
  CreateRequestPayload,
  UpdateRequestPayload,
  AIAnalysisResult,
  CopilotResult,
} from '@/types/request';
import { Alert, SlaStats } from '@/types/alert';
import { Notification, NotificationStats, KnowledgeArticle } from '@/types/notification';
import { ChatIntakeRequest, ChatIntakeResponse } from '@/types/chat';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // ── Requests ──────────────────────────────────────────────────────────────

  getRequests(): Promise<IssueRequest[]> {
    return request<IssueRequest[]>('/requests');
  },

  getRequest(id: string): Promise<IssueRequest> {
    return request<IssueRequest>(`/requests/${id}`);
  },

  createRequest(payload: CreateRequestPayload): Promise<IssueRequest> {
    return request<IssueRequest>('/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateRequest(id: string, payload: UpdateRequestPayload): Promise<IssueRequest> {
    return request<IssueRequest>(`/requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  // ── AI (Phase 2) ──────────────────────────────────────────────────────────

  analyzeText(text: string, title?: string, location?: string): Promise<AIAnalysisResult> {
    return request<AIAnalysisResult>('/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({ text, title, location }),
    });
  },

  analyzeRequest(id: string): Promise<IssueRequest> {
    return request<IssueRequest>(`/requests/${id}/analyze`, { method: 'POST' });
  },

  // ── Copilot (Phase 3) ─────────────────────────────────────────────────────

  generateCopilot(id: string): Promise<IssueRequest> {
    return request<IssueRequest>(`/requests/${id}/copilot`, { method: 'POST' });
  },

  generateCopilotPreview(payload: {
    title: string; description: string; aiCategory?: string;
    aiPriority?: string; aiSummary?: string; location?: string;
  }): Promise<CopilotResult> {
    return request<CopilotResult>('/copilot/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // ── Alerts (Phase 4) ──────────────────────────────────────────────────────

  getAlerts(unreadOnly = false): Promise<Alert[]> {
    return request<Alert[]>(`/alerts${unreadOnly ? '?unread_only=true' : ''}`);
  },

  getAlertCount(): Promise<{ unread: number }> {
    return request<{ unread: number }>('/alerts/count');
  },

  markAlertRead(id: string): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>(`/alerts/${id}/read`, { method: 'POST' });
  },

  markAllAlertsRead(): Promise<{ marked: number }> {
    return request<{ marked: number }>('/alerts/read-all', { method: 'POST' });
  },

  // ── SLA (Phase 4) ─────────────────────────────────────────────────────────

  getSlaStats(): Promise<SlaStats> {
    return request<SlaStats>('/sla/stats');
  },

  refreshSla(): Promise<{ checked: number; updated: number; alertsCreated: number }> {
    return request('/sla/refresh', { method: 'POST' });
  },

  getSlaConfig(): Promise<{ demoMode: boolean; windows: Record<string, number> }> {
    return request('/sla/config');
  },

  // ── Knowledge Base (Phase 5) ──────────────────────────────────────────────

  searchKnowledge(q: string, category?: string, priority?: string): Promise<KnowledgeArticle[]> {
    const params = new URLSearchParams({ q });
    if (category) params.set('category', category);
    if (priority)  params.set('priority', priority);
    return request<KnowledgeArticle[]>(`/knowledge/search?${params}`);
  },

  getKnowledgeForRequest(requestId: string): Promise<KnowledgeArticle[]> {
    return request<KnowledgeArticle[]>(`/knowledge/request/${requestId}`);
  },

  // ── Notifications (Phase 5) ───────────────────────────────────────────────

  getNotifications(channel?: string): Promise<Notification[]> {
    const params = channel ? `?channel=${channel}` : '';
    return request<Notification[]>(`/notifications${params}`);
  },

  getNotificationStats(): Promise<NotificationStats> {
    return request<NotificationStats>('/notifications/stats');
  },

  simulateSend(notifId: string): Promise<{ ok: boolean }> {
    return request<{ ok: boolean }>(`/notifications/${notifId}/send`, { method: 'POST' });
  },

  // ── Chat Intake (Phase 6) ─────────────────────────────────────────────────

  chatIntake(payload: ChatIntakeRequest): Promise<ChatIntakeResponse> {
    return request<ChatIntakeResponse>('/ai/chat-intake', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // ── Health ────────────────────────────────────────────────────────────────

  healthCheck(): Promise<{ status: string }> {
    return request<{ status: string }>('/health');
  },
};
