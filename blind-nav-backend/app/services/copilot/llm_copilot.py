"""
Copilot Layer B — Optional LLM-powered agentic guidance via OpenAI.

Called only when OPENAI_API_KEY is present in the environment.
Returns None on any failure so the orchestrator falls back to rules.
"""

from __future__ import annotations

import json
import os
from typing import Optional

SYSTEM_PROMPT = """You are an intelligent operations copilot for an accessibility management platform.

Given a service request with its AI classification, generate structured operational guidance.
Return ONLY a valid JSON object (no markdown, no prose) with these exact keys:

- copilotSummary          : 2-3 sentences summarising the situation and recommended response for an operator
- copilotSuggestedActions : array of 3-5 ordered actionable steps the operator should take now
- copilotResolutionSteps  : array of 3-5 specific steps to fully resolve and close this request
- copilotRecommendedTeam  : one of: "Accessibility Officer" | "Facilities Team" | "Security Team" | "Student Support Desk" | "Navigation Assistance Team" | "Emergency Response Team"
- copilotRecommendedAssignee : a role/person title within the recommended team
- copilotEscalationLevel  : one of: "NORMAL" | "URGENT" | "CRITICAL" | "ESCALATE"
- copilotShouldAlert      : boolean — true only for CRITICAL or EMERGENCY situations
- copilotAlertReason      : string explaining why an alert is recommended (empty string if no alert)
- copilotDraftInternalNote : a ready-to-use 2-3 sentence internal note for the operations log
- copilotDecisionTrace    : array of 3-5 strings explaining each decision in plain English

Domain context:
- This is a university/public-building accessibility operations platform
- Requests come from blind/low-vision users via a mobile app or from officers
- Priority levels: CRITICAL > HIGH > MEDIUM > LOW
- Categories: EMERGENCY_SUPPORT | UNSAFE_ENVIRONMENT | PHYSICAL_OBSTRUCTION | ACCESSIBILITY_EQUIPMENT_ISSUE | NAVIGATION_ASSISTANCE | FACILITY_ACCESS_ISSUE

Escalation rules to follow:
- CRITICAL priority or emergency/trapped/injury keywords → CRITICAL escalation, alert=true
- Exam hall context → ESCALATE, alert=true
- HIGH priority or blocked/unsafe/broken → URGENT, alert=false unless EMERGENCY_SUPPORT
- MEDIUM or LOW → NORMAL

Return ONLY the JSON object."""

_VALID_TEAMS = {
    "Accessibility Officer",
    "Facilities Team",
    "Security Team",
    "Student Support Desk",
    "Navigation Assistance Team",
    "Emergency Response Team",
}
_VALID_ESCALATIONS = {"NORMAL", "URGENT", "CRITICAL", "ESCALATE"}


def _validate(r: dict) -> bool:
    if not isinstance(r.get("copilotSummary"), str):
        return False
    if r.get("copilotRecommendedTeam") not in _VALID_TEAMS:
        return False
    if r.get("copilotEscalationLevel") not in _VALID_ESCALATIONS:
        return False
    if not isinstance(r.get("copilotShouldAlert"), bool):
        return False
    if not isinstance(r.get("copilotSuggestedActions"), list):
        return False
    if not isinstance(r.get("copilotDecisionTrace"), list):
        return False
    return True


def generate(
    title: str,
    description: str,
    ai_category: str | None,
    ai_priority: str | None,
    location: str | None = None,
    ai_summary: str | None = None,
    current_status: str = "NEW",
    source: str | None = None,
) -> Optional[dict]:
    """
    Call OpenAI to generate copilot guidance.
    Returns a dict compatible with CopilotResult, or None on any failure.
    """
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        return None

    try:
        from openai import OpenAI  # type: ignore

        client = OpenAI(api_key=api_key)

        user_content = (
            f"Title: {title}\n"
            f"Description: {description}\n"
            f"AI Category: {ai_category or 'Unknown'}\n"
            f"AI Priority: {ai_priority or 'Unknown'}\n"
            f"AI Summary: {ai_summary or 'N/A'}\n"
            f"Location: {location or 'Not specified'}\n"
            f"Current Status: {current_status}\n"
            f"Source: {source or 'Unknown'}"
        )

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": user_content},
            ],
            temperature=0.2,
            max_tokens=700,
        )

        raw = response.choices[0].message.content or ""
        raw = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        result: dict = json.loads(raw)

        if not _validate(result):
            return None

        result["copilotEngine"] = "llm"
        result.setdefault("copilotResolutionSteps",    [])
        result.setdefault("copilotAlertReason",        "")
        result.setdefault("copilotDraftInternalNote",  "")
        result.setdefault("copilotDecisionTrace",      [])
        return result

    except Exception as exc:  # noqa: BLE001
        print(f"[LLM copilot] Failed: {exc}")
        return None
