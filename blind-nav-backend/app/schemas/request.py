from pydantic import BaseModel
from typing import Optional, List


class Note(BaseModel):
    id: str
    text: str
    author: str = "Officer"
    timestamp: str


class IssueRequestCreate(BaseModel):
    transcript: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    location: Optional[str] = None
    reportedBy: Optional[str] = None
    source: Optional[str] = None


class IssueRequestUpdate(BaseModel):
    status: Optional[str] = None
    assignedTo: Optional[str] = None
    priority: Optional[str] = None
    noteText: Optional[str] = None
    noteAuthor: Optional[str] = "Officer"


class IssueRequest(BaseModel):
    id: str
    title: str
    description: str
    transcript: Optional[str] = None
    category: str
    priority: str
    status: str
    source: str
    location: Optional[str] = None
    reportedBy: Optional[str] = None
    assignedTo: Optional[str] = None
    notes: List[Note] = []
    timestamp: str
    updatedAt: Optional[str] = None

    # ── Phase 2: AI analysis fields ──────────────────────────────────────────
    aiSummary: Optional[str] = None
    aiCategory: Optional[str] = None
    aiPriority: Optional[str] = None
    aiTags: Optional[List[str]] = None
    aiConfidence: Optional[float] = None
    aiReason: Optional[str] = None
    aiEngine: Optional[str] = None
    aiAnalyzedAt: Optional[str] = None
    suggestedAction: Optional[str] = None

    # ── Phase 3: Copilot / agentic workflow fields ───────────────────────────
    copilotSummary: Optional[str] = None
    copilotSuggestedActions: Optional[List[str]] = None
    copilotResolutionSteps: Optional[List[str]] = None
    copilotRecommendedTeam: Optional[str] = None
    copilotRecommendedAssignee: Optional[str] = None
    copilotEscalationLevel: Optional[str] = None      # NORMAL | URGENT | CRITICAL | ESCALATE
    copilotShouldAlert: Optional[bool] = None
    copilotAlertReason: Optional[str] = None
    copilotDraftInternalNote: Optional[str] = None
    copilotDecisionTrace: Optional[List[str]] = None
    copilotEngine: Optional[str] = None               # 'rules' | 'llm'
    copilotGeneratedAt: Optional[str] = None
