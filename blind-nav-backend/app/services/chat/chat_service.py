"""
Chat Intake Service — orchestrates Layer A (rules) + Layer B (LLM).

Decision flow:
  1. If OPENAI_API_KEY is set → try LLM (Layer B)
  2. If LLM succeeds and passes validation → use LLM result
  3. Otherwise → fall back to rules extractor (Layer A)
"""

from __future__ import annotations

from typing import List, Optional

from app.schemas.chat import ChatIntakeRequest, ChatIntakeResponse, RequestDraft
from app.services.chat import rules_extractor, llm_chat


def process(req: ChatIntakeRequest) -> ChatIntakeResponse:
    messages = req.messages
    current_draft_dict = req.currentDraft.model_dump() if req.currentDraft else None

    # ── Layer B: LLM ──────────────────────────────────────────────────────────
    llm_result = llm_chat.analyze(messages, current_draft_dict)

    if llm_result:
        draft = RequestDraft(
            title=llm_result.get("title"),
            description=llm_result.get("description"),
            category=llm_result.get("category"),
            priority=llm_result.get("priority"),
            location=llm_result.get("location"),
            tags=llm_result.get("tags", []),
            aiSummary=llm_result.get("aiSummary") or llm_result.get("title"),
            confidence=float(llm_result.get("confidence", 0.8)),
            reason=None,
        )
        return ChatIntakeResponse(
            reply=llm_result.get("reply", "I've processed your request."),
            draft=draft,
            missingFields=llm_result.get("missingFields", []),
            followUpQuestion=llm_result.get("followUpQuestion"),
            readyToCreate=bool(llm_result.get("readyToCreate", False)),
            engine="llm",
            confidence=float(llm_result.get("confidence", 0.8)),
        )

    # ── Layer A: Rules fallback ────────────────────────────────────────────────
    draft, reply, missing, followup, ready = rules_extractor.extract(messages)

    return ChatIntakeResponse(
        reply=reply,
        draft=draft,
        missingFields=missing,
        followUpQuestion=followup,
        readyToCreate=ready,
        engine="rules",
        confidence=draft.confidence,
    )
