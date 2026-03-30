export type RequestStatus =
  | 'NEW'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type RequestPriority =
  | 'CRITICAL'
  | 'HIGH'
  | 'MEDIUM'
  | 'LOW'
  | 'PENDING_REVIEW';

export type RequestCategory =
  | 'ACCESSIBILITY_SUPPORT'
  | 'PATHWAY_BLOCKED'
  | 'ENTRANCE_BLOCKED'
  | 'LIFT_ISSUE'
  | 'NAVIGATION_AID'
  | 'SAFETY_CONCERN'
  | 'OTHER';

export type AiCategory =
  | 'PHYSICAL_OBSTRUCTION'
  | 'ACCESSIBILITY_EQUIPMENT_ISSUE'
  | 'NAVIGATION_ASSISTANCE'
  | 'UNSAFE_ENVIRONMENT'
  | 'FACILITY_ACCESS_ISSUE'
  | 'EMERGENCY_SUPPORT';

export type CopilotEscalationLevel = 'NORMAL' | 'URGENT' | 'CRITICAL' | 'ESCALATE';

export type RequestSource =
  | 'mobile_voice_report'
  | 'officer_manual_entry'
  | 'assisted_call'
  | 'mobile_app';

export interface Note {
  id: string;
  text: string;
  author: string;
  timestamp: string;
}

export interface IssueRequest {
  id: string;
  title: string;
  description: string;
  transcript?: string;
  category: string;
  priority: string;
  status: string;
  source: string;
  location?: string;
  reportedBy?: string;
  assignedTo?: string;
  notes: Note[];
  timestamp: string;
  updatedAt?: string;

  // ── Phase 2: AI analysis ─────────────────────────────────────────────────
  aiSummary?: string;
  aiCategory?: string;
  aiPriority?: string;
  aiTags?: string[];
  aiConfidence?: number;
  aiReason?: string;
  aiEngine?: string;
  aiAnalyzedAt?: string;
  suggestedAction?: string;

  // ── Phase 4: SLA + Escalation ────────────────────────────────────────────
  slaTargetAt?: string;
  slaStatus?: string;              // ON_TRACK | AT_RISK | BREACHED | COMPLETED
  slaMinutesRemaining?: number;    // negative = overdue
  escalationLevel?: string;        // NONE | TEAM_LEAD | OPERATIONS_MANAGER | EMERGENCY_RESPONSE
  escalatedAt?: string;
  lastEscalationReason?: string;

  // ── Phase 3: Copilot / agentic workflow ──────────────────────────────────
  copilotSummary?: string;
  copilotSuggestedActions?: string[];
  copilotResolutionSteps?: string[];
  copilotRecommendedTeam?: string;
  copilotRecommendedAssignee?: string;
  copilotEscalationLevel?: CopilotEscalationLevel;
  copilotShouldAlert?: boolean;
  copilotAlertReason?: string;
  copilotDraftInternalNote?: string;
  copilotDecisionTrace?: string[];
  copilotEngine?: string;
  copilotGeneratedAt?: string;
}

export interface CreateRequestPayload {
  transcript?: string;
  title?: string;
  description?: string;
  category?: string;
  priority?: string;
  location?: string;
  reportedBy?: string;
  source?: string;
}

export interface UpdateRequestPayload {
  status?: string;
  assignedTo?: string;
  priority?: string;
  noteText?: string;
  noteAuthor?: string;
}

export interface AIAnalysisResult {
  predictedPriority: string;
  predictedCategory: string;
  aiSummary: string;
  tags: string[];
  confidence: number;
  reason: string;
  engine: string;
}

export interface CopilotResult {
  copilotSummary: string;
  copilotSuggestedActions: string[];
  copilotResolutionSteps: string[];
  copilotRecommendedTeam: string;
  copilotRecommendedAssignee: string;
  copilotEscalationLevel: CopilotEscalationLevel;
  copilotShouldAlert: boolean;
  copilotAlertReason: string;
  copilotDraftInternalNote: string;
  copilotDecisionTrace: string[];
  copilotEngine: string;
  copilotGeneratedAt?: string;
}
