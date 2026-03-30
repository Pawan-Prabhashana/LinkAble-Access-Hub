export type NotificationType = 'CRITICAL_ALERT' | 'SLA_WARNING' | 'SLA_BREACH' | 'ESCALATION' | 'GENERAL';
export type NotificationChannel = 'EMAIL' | 'SMS' | 'IN_APP' | 'PUSH';
export type NotificationStatus = 'PREPARED' | 'QUEUED' | 'SENT' | 'DELIVERED';

export interface Notification {
  id: string;
  type: NotificationType;
  channel: NotificationChannel;
  recipient: string;
  subject: string;
  body: string;
  status: NotificationStatus;
  alertId?: string;
  requestId?: string;
  createdAt: string;
  sentAt?: string;
}

export interface NotificationStats {
  total: number;
  prepared: number;
  sent: number;
  byChannel: { EMAIL: number; SMS: number; IN_APP: number; PUSH: number };
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  sop_ref: string;
  content: string;
  resolution_time: string;
  categories: string[];
  relevance_score: number;
}
