export type AlertType =
  | 'CRITICAL_REQUEST_CREATED'
  | 'SLA_AT_RISK'
  | 'SLA_BREACHED'
  | 'ESCALATION_TRIGGERED'
  | 'REQUEST_UNASSIGNED';

export type AlertSeverity = 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  requestId?: string;
  createdAt: string;
  isRead: boolean;
  source: string;
}

export interface SlaStats {
  activeRequests: number;
  onTrack: number;
  atRisk: number;
  breached: number;
  escalated: number;
  criticalOpen: number;
  unreadAlerts: number;
}
