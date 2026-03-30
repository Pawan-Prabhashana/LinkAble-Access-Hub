"""
Copilot Orchestrator.

Decision flow:
  1. If OPENAI_API_KEY is set → try LLM (Layer B)
  2. If LLM succeeds and passes validation → use LLM result
  3. Otherwise → fall back to rules engine (Layer A)

Always produces a complete CopilotResult.
"""

from __future__ import annotations

from datetime import datetime, timezone

from app.schemas.copilot import CopilotGenerateRequest, CopilotResult
from app.services.copilot import rules_engine, llm_copilot


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def generate(req: CopilotGenerateRequest) -> CopilotResult:
    """
    Run the two-layer copilot pipeline and return a CopilotResult.

    Layer B (LLM) is attempted first when OPENAI_API_KEY is present.
    Layer A (rules) is the guaranteed fallback.
    """
    # ── Layer B: LLM ──────────────────────────────────────────────────────────
    llm_result = llm_copilot.generate(
        title=req.title,
        description=req.description,
        ai_category=req.aiCategory,
        ai_priority=req.aiPriority,
        location=req.location,
        ai_summary=req.aiSummary,
        current_status=req.currentStatus or "NEW",
        source=req.source,
    )
    if llm_result:
        try:
            llm_result["copilotGeneratedAt"] = _now()
            return CopilotResult(**llm_result)
        except Exception:
            pass  # Malformed → fall through

    # ── Layer A: Rules-based fallback ─────────────────────────────────────────
    rules_result = rules_engine.generate(
        title=req.title,
        description=req.description,
        ai_category=req.aiCategory,
        ai_priority=req.aiPriority,
        location=req.location,
        current_status=req.currentStatus or "NEW",
        ai_summary=req.aiSummary,
        transcript=req.transcript,
    )
    rules_result["copilotGeneratedAt"] = _now()
    return CopilotResult(**rules_result)
