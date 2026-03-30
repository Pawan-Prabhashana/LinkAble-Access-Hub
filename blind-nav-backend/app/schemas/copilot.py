from pydantic import BaseModel
from typing import Optional, List


class CopilotGenerateRequest(BaseModel):
    """
    Payload for POST /copilot/generate or POST /requests/{id}/copilot.
    When called via the request-scoped endpoint the server fills these
    from the stored record; this model is also used for the standalone
    /copilot/generate endpoint (e.g. live preview in a future form).
    """
    title: str
    description: str
    transcript: Optional[str] = None
    aiCategory: Optional[str] = None
    aiPriority: Optional[str] = None
    aiSummary: Optional[str] = None
    location: Optional[str] = None
    currentStatus: Optional[str] = "NEW"
    source: Optional[str] = None


class CopilotResult(BaseModel):
    """
    Full output of the copilot / agentic workflow.
    Saved onto the IssueRequest record and returned to the frontend.
    """
    # ── Operational summary ──────────────────────────────────────────────────
    copilotSummary: str                        # 2-3 sentence operator brief

    # ── Agentic recommendations ──────────────────────────────────────────────
    copilotSuggestedActions: List[str] = []    # Ordered next-step actions
    copilotResolutionSteps:  List[str] = []    # Specific resolution procedure

    # ── Assignment ───────────────────────────────────────────────────────────
    copilotRecommendedTeam:     str = ""
    copilotRecommendedAssignee: str = ""

    # ── Escalation / alert ───────────────────────────────────────────────────
    copilotEscalationLevel: str  = "NORMAL"    # NORMAL | URGENT | CRITICAL | ESCALATE
    copilotShouldAlert:     bool = False
    copilotAlertReason:     str  = ""

    # ── Draft comms ──────────────────────────────────────────────────────────
    copilotDraftInternalNote: str = ""

    # ── Explainability ───────────────────────────────────────────────────────
    copilotDecisionTrace: List[str] = []       # Human-readable reasoning steps

    # ── Metadata ─────────────────────────────────────────────────────────────
    copilotEngine:      str = "rules"          # 'rules' | 'llm'
    copilotGeneratedAt: Optional[str] = None
