"""
Layer A — Deterministic chat intake extractor.

Combines all user messages, runs the existing AI analyzer,
and extracts location via simple keyword/pattern matching.
Always produces a result — works fully offline / demo mode.
"""

from __future__ import annotations

import re
from typing import List, Optional, Tuple

from app.schemas.chat import ChatMessage, RequestDraft
from app.services.ai.analyzer import analyze

# ── Location extraction patterns ─────────────────────────────────────────────

_LOC_PREPOSITIONS = r"(?:near|in|at|inside|outside|beside|next to|by|from|on|behind|in front of)"

_LOCATION_PATTERNS = [
    # "near the exam hall", "at the main entrance", "in block A"
    rf"{_LOC_PREPOSITIONS}\s+the\s+([\w\s\-]+?)(?:\s+and|\s+where|\s+which|\s*[,.]|$)",
    rf"{_LOC_PREPOSITIONS}\s+(building\s+[\w]+|block\s+[\w]+|hall\s+[\w]+|room\s+[\w]+|floor\s+[\w]+|level\s+[\w]+|wing\s+[\w]+)",
    # Named places
    r"(library|main entrance|cafeteria|canteen|toilet|bathroom|restroom|lift|elevator|staircase|ramp|car ?park|parking|corridor|lobby|reception|exam hall|lecture hall|sports hall|computer lab|science lab|admin block|faculty building|student center|auditorium|courtyard|garden)",
]

_LOCATION_RE = [re.compile(p, re.IGNORECASE) for p in _LOCATION_PATTERNS]


def _extract_location(text: str) -> Optional[str]:
    for pattern in _LOCATION_RE:
        m = pattern.search(text)
        if m:
            loc = m.group(1).strip().rstrip(".,;")
            if len(loc) >= 3:
                return loc.title()
    return None


# ── Follow-up questions ───────────────────────────────────────────────────────

_EMERGENCY_CATEGORIES = {"EMERGENCY_SUPPORT"}
_LOCATION_CRITICAL_CATEGORIES = {"PHYSICAL_OBSTRUCTION", "FACILITY_ACCESS_ISSUE", "UNSAFE_ENVIRONMENT"}


def _build_followup(missing: List[str], category: str, message_count: int) -> Optional[str]:
    """Return one focused follow-up question, or None if enough info."""
    # Only ask at most one follow-up per turn, and skip after 3 turns
    if message_count >= 3:
        return None

    if "location" in missing and category in _LOCATION_CRITICAL_CATEGORIES:
        return "Where is this happening? Please mention the building, floor, or area."

    if "location" in missing:
        return "Could you tell me the location — which building, floor, or area?"

    if category in _EMERGENCY_CATEGORIES:
        return "Is anyone currently in immediate danger or distress?"

    return None


# ── Reply generator ───────────────────────────────────────────────────────────

_CATEGORY_LABELS = {
    "PHYSICAL_OBSTRUCTION":        "Physical Obstruction",
    "ACCESSIBILITY_EQUIPMENT_ISSUE": "Equipment Issue",
    "NAVIGATION_ASSISTANCE":       "Navigation Assistance",
    "UNSAFE_ENVIRONMENT":          "Unsafe Environment",
    "FACILITY_ACCESS_ISSUE":       "Facility Access Issue",
    "EMERGENCY_SUPPORT":           "Emergency Support",
}

_PRIORITY_LABELS = {
    "CRITICAL": "🔴 Critical",
    "HIGH":     "🟠 High",
    "MEDIUM":   "🟡 Medium",
    "LOW":      "🟢 Low",
}


def _build_reply(
    draft: RequestDraft,
    missing: List[str],
    followup: Optional[str],
    ready: bool,
) -> str:
    parts: List[str] = []

    cat_label = _CATEGORY_LABELS.get(draft.category or "", "Accessibility Issue")
    pri_label = _PRIORITY_LABELS.get(draft.priority or "", draft.priority or "")

    parts.append(
        f"I've identified this as a **{cat_label}** with {pri_label} priority."
    )

    if draft.location:
        parts.append(f"Location: **{draft.location}**.")

    if draft.aiSummary:
        parts.append(draft.aiSummary)

    if ready:
        parts.append(
            "I have enough information to create a request. "
            "Please review the draft on the right and confirm when ready."
        )
    elif followup:
        parts.append(followup)
    elif missing:
        parts.append(
            f"Still missing: {', '.join(missing)}. "
            "You can provide more detail or submit the draft as-is."
        )

    return " ".join(parts)


# ── Main extract function ─────────────────────────────────────────────────────

def extract(
    messages: List[ChatMessage],
) -> Tuple[RequestDraft, str, List[str], Optional[str], bool]:
    """
    Returns (draft, reply, missingFields, followUpQuestion, readyToCreate).
    """
    user_messages = [m for m in messages if m.role == "user"]
    full_text = " ".join(m.content for m in user_messages)
    message_count = len(user_messages)

    if not full_text.strip():
        return (
            RequestDraft(),
            "Please describe the accessibility issue you'd like to report.",
            ["description"],
            None,
            False,
        )

    # Run existing AI analyzer (Layer A → Layer B if key present)
    ai = analyze(text=full_text, title="", location="")

    location = _extract_location(full_text)

    # Build title from AI summary (truncated)
    summary = ai.aiSummary or full_text[:80]
    title = (summary[:77] + "…") if len(summary) > 80 else summary

    draft = RequestDraft(
        title=title,
        description=full_text,
        category=ai.predictedCategory,
        priority=ai.predictedPriority,
        location=location,
        tags=ai.tags or [],
        aiSummary=ai.aiSummary,
        confidence=ai.confidence,
        reason=ai.reason,
    )

    # Determine missing fields
    missing: List[str] = []
    if not location:
        missing.append("location")

    # Ready when we have the essentials and either location or 2+ user turns
    ready = bool(
        draft.title
        and draft.category
        and draft.priority
        and (location or message_count >= 2)
    )

    followup = _build_followup(missing, draft.category or "", message_count)
    reply = _build_reply(draft, missing, followup, ready)

    return draft, reply, missing, followup, ready
