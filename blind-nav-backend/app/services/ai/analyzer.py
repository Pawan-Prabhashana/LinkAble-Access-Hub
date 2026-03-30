"""
AI Analysis Orchestrator.

Decision flow:
  1. If OPENAI_API_KEY is set → try LLM (Layer B)
  2. If LLM succeeds and passes validation → use LLM result
  3. Otherwise → fall back to rules-based classifier (Layer A)

This guarantees the system always produces a result.
"""

from __future__ import annotations

from app.schemas.ai import AIAnalysisResult
from app.services.ai import rules_classifier, llm_analyzer


_EMPTY_RESULT = AIAnalysisResult(
    predictedPriority="MEDIUM",
    predictedCategory="FACILITY_ACCESS_ISSUE",
    aiSummary="Accessibility issue reported",
    tags=[],
    confidence=0.3,
    reason="No description provided — defaulting to medium priority",
    engine="none",
)


def analyze(text: str, title: str = "", location: str = "") -> AIAnalysisResult:
    """
    Run the two-layer AI analysis pipeline on the given text.

    Args:
        text:     Primary description / transcript of the issue.
        title:    Optional request title (improves classification).
        location: Optional location context.

    Returns:
        AIAnalysisResult with predictedPriority, predictedCategory,
        aiSummary, tags, confidence, reason, engine.
    """
    full_text = " ".join(p for p in [title, text, location] if p and p.strip())

    if not full_text.strip():
        return _EMPTY_RESULT

    # ── Layer B: LLM ──────────────────────────────────────────────────────────
    llm_result = llm_analyzer.analyze(text=text, title=title, location=location)
    if llm_result:
        try:
            return AIAnalysisResult(**llm_result)
        except Exception:
            pass  # malformed → fall through to rules

    # ── Layer A: Rules-based fallback ─────────────────────────────────────────
    rules_result = rules_classifier.classify(full_text)
    return AIAnalysisResult(**rules_result)
