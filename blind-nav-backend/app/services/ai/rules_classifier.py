"""
Layer A — Deterministic rules-based classifier.

Uses keyword/phrase scoring with weights. No external dependencies.
Always produces a result — this is the guaranteed demo-safe fallback.
"""

from __future__ import annotations
from typing import Dict, List

# ── Category rules ────────────────────────────────────────────────────────────
# Each entry: list of (phrase, weight) tuples.
# Multi-word phrases score higher than single keywords.

CATEGORY_RULES: Dict[str, List[tuple]] = {
    "PHYSICAL_OBSTRUCTION": [
        ("blocked hallway", 3.0), ("blocking the hallway", 3.0), ("blocking the path", 3.0),
        ("construction materials", 2.5), ("bench blocking", 2.5), ("chairs blocking", 2.5),
        ("blocked", 1.5), ("blocking", 1.5), ("obstruct", 1.5), ("obstacle", 1.5),
        ("bench", 1.0), ("furniture", 1.0), ("construction", 1.0), ("debris", 1.0),
        ("boxes", 1.0), ("equipment", 0.8), ("material", 0.8),
    ],
    "ACCESSIBILITY_EQUIPMENT_ISSUE": [
        ("voice guidance not working", 3.5), ("audio guidance not working", 3.5),
        ("lift not working", 3.0), ("elevator not working", 3.0),
        ("ramp broken", 3.0), ("access panel broken", 3.0),
        ("voice guidance", 2.0), ("audio guidance", 2.0),
        ("lift", 1.5), ("elevator", 1.5), ("ramp", 1.2),
        ("handrail", 1.5), ("guide rail", 1.5), ("braille", 1.5),
        ("not working", 1.0), ("broken", 1.0), ("malfunctioning", 1.0),
        ("automatic door", 1.5), ("accessible door", 1.5), ("door mechanism", 1.5),
    ],
    "NAVIGATION_ASSISTANCE": [
        ("need help reaching", 4.0), ("need assistance getting", 4.0),
        ("needs assistance getting", 4.0), ("help getting to", 3.5),
        ("assistance getting to", 4.0), ("get to the", 3.0),
        ("cannot find", 2.5), ("escort to", 2.5),
        ("need help", 1.5), ("need assistance", 2.0), ("need a guide", 2.0),
        ("reaching", 1.0), ("get to", 0.8), ("find my way", 2.0),
        ("direction", 0.8), ("navigate", 1.0), ("accompany", 1.5),
    ],
    "UNSAFE_ENVIRONMENT": [
        ("wet floor", 3.5), ("wet floor near", 3.5), ("slip hazard", 3.0),
        ("fall risk", 3.0), ("trip hazard", 3.0),
        ("unsafe staircase", 3.0), ("unsafe area", 2.5),
        ("unsafe", 2.0), ("dangerous", 2.0), ("hazard", 2.0),
        ("slippery", 2.5), ("wet", 1.5), ("no lighting", 2.0), ("dark", 1.0),
        ("exposed wire", 2.5), ("broken glass", 2.5),
    ],
    "FACILITY_ACCESS_ISSUE": [
        ("accessible entrance blocked", 4.0), ("access blocked", 3.0),
        ("entrance blocked", 3.0), ("cannot enter", 3.0),
        ("door locked", 2.5), ("gate locked", 2.5), ("access denied", 2.5),
        ("accessible entrance", 2.0), ("main entrance", 1.5),
        ("locked", 1.5), ("closed", 1.0), ("barrier", 1.5),
    ],
    "EMERGENCY_SUPPORT": [
        ("emergency", 3.5), ("need urgent", 3.5), ("urgently need", 3.5),
        ("trapped", 4.0), ("stuck", 3.0), ("cannot move", 3.5),
        ("fallen", 3.0), ("fall", 2.5), ("injury", 3.0), ("hurt", 2.5),
        ("medical", 2.5), ("help now", 3.0), ("urgent assistance", 3.5),
        ("exam hall", 2.0), ("exam", 1.5), ("examination", 1.5),
    ],
}

# ── Priority rules ────────────────────────────────────────────────────────────

PRIORITY_RULES: Dict[str, List[tuple]] = {
    "CRITICAL": [
        ("emergency", 5.0), ("trapped", 5.0), ("cannot move", 5.0),
        ("medical emergency", 5.0), ("fallen and", 4.0), ("immediate danger", 5.0),
        ("help now", 4.0), ("urgently need help", 4.5),
        ("injury", 3.5), ("hurt", 3.0), ("medical", 3.0),
        ("stuck", 3.0), ("urgent", 2.5),
    ],
    "HIGH": [
        ("accessible entrance blocked", 4.0), ("entrance blocked", 3.5),
        ("cannot enter", 3.5), ("wet floor", 3.5), ("unsafe", 3.0),
        ("dangerous", 3.0), ("fall risk", 3.5),
        ("blocked", 2.5), ("blocking", 2.5), ("obstruct", 2.5),
        ("not working", 2.5), ("broken", 2.5), ("construction", 2.0),
        ("exam hall", 2.0), ("exam", 1.5), ("hazard", 3.0), ("slippery", 3.0),
    ],
    "MEDIUM": [
        ("need assistance getting", 2.5), ("need help getting", 2.5),
        ("need help", 2.0), ("need assistance", 2.0), ("issue", 1.5),
        ("problem", 1.5), ("malfunctioning", 2.0), ("difficulty", 1.5),
        ("hard to", 1.0), ("challenging", 1.0), ("not accessible", 2.0),
    ],
    "LOW": [
        ("inquiry", 1.5), ("question", 1.5), ("wondering", 1.5),
        ("would like", 1.0), ("prefer", 1.0), ("request", 0.5),
        ("suggestion", 1.0), ("feedback", 1.0),
    ],
}

# ── Tag rules ────────────────────────────────────────────────────────────────

TAG_RULES: Dict[str, List[str]] = {
    "walkway":       ["walkway", "hallway", "corridor", "path", "passage", "route"],
    "lift":          ["lift", "elevator"],
    "entrance":      ["entrance", "entry", "door", "gate", "access point"],
    "exam_support":  ["exam", "examination", "exam hall", "test hall"],
    "emergency":     ["emergency", "urgent", "trapped", "stuck", "medical"],
    "accessibility": ["accessible", "accessibility", "disability", "disabled", "wheelchair"],
    "ramp":          ["ramp", "slope"],
    "construction":  ["construction", "scaffolding", "building work", "materials"],
    "wet_floor":     ["wet floor", "wet", "slippery", "water on"],
    "voice_guidance":["voice guidance", "audio guidance", "voice assistant"],
}

# ── Summary templates ────────────────────────────────────────────────────────

CATEGORY_SUMMARY_PREFIX: Dict[str, str] = {
    "PHYSICAL_OBSTRUCTION":        "Physical obstruction",
    "ACCESSIBILITY_EQUIPMENT_ISSUE": "Accessibility equipment issue",
    "NAVIGATION_ASSISTANCE":       "Navigation assistance needed",
    "UNSAFE_ENVIRONMENT":          "Unsafe environment condition",
    "FACILITY_ACCESS_ISSUE":       "Facility access issue",
    "EMERGENCY_SUPPORT":           "Emergency support required",
}


# ── Core scoring function ────────────────────────────────────────────────────

def _score(text_lower: str, rules: Dict[str, List[tuple]]) -> Dict[str, float]:
    scores: Dict[str, float] = {k: 0.0 for k in rules}
    for category, phrases in rules.items():
        for phrase, weight in phrases:
            if phrase in text_lower:
                scores[category] += weight
    return scores


def _best(scores: Dict[str, float]) -> tuple[str, float]:
    """Return (best_key, best_score)."""
    best_key = max(scores, key=scores.get)  # type: ignore[arg-type]
    return best_key, scores[best_key]


def _confidence(scores: Dict[str, float], winner: str) -> float:
    total = sum(scores.values())
    if total == 0:
        return 0.45
    raw = scores[winner] / total
    return round(min(0.95, max(0.35, raw)), 2)


def _generate_summary(text: str, category: str) -> str:
    first = text.split(".")[0].strip()
    if not first:
        return CATEGORY_SUMMARY_PREFIX.get(category, "Accessibility issue reported")
    # Capitalise and truncate
    first = first[0].upper() + first[1:]
    return first[:100] + ("…" if len(first) > 100 else "")


def _generate_reason(text_lower: str, priority: str, category: str) -> str:
    matched: List[str] = []
    for phrase, _ in PRIORITY_RULES.get(priority, []):
        if phrase in text_lower:
            matched.append(f'"{phrase}"')
        if len(matched) >= 3:
            break
    if matched:
        return f"Detected {priority.lower()} priority signals: {', '.join(matched)}"
    return (
        f"Text pattern matched to {category.lower().replace('_', ' ')} "
        f"with {priority.lower()} priority"
    )


# ── Public entry point ───────────────────────────────────────────────────────

def classify(text: str) -> dict:
    """
    Classify text using the deterministic rules engine.
    Returns a dict compatible with AIAnalysisResult.
    """
    text_lower = text.lower()

    # Score
    cat_scores = _score(text_lower, CATEGORY_RULES)
    pri_scores = _score(text_lower, PRIORITY_RULES)

    best_cat, best_cat_score = _best(cat_scores)
    best_pri, best_pri_score = _best(pri_scores)

    # Fallback: if nothing matched, choose sensible defaults
    if best_cat_score == 0:
        best_cat = "FACILITY_ACCESS_ISSUE"
    if best_pri_score == 0:
        best_pri = "MEDIUM"

    # Tags
    tags: List[str] = []
    for tag, keywords in TAG_RULES.items():
        if any(kw in text_lower for kw in keywords):
            tags.append(tag)

    summary = _generate_summary(text, best_cat)
    confidence = _confidence(cat_scores, best_cat)
    reason = _generate_reason(text_lower, best_pri, best_cat)

    return {
        "predictedPriority":  best_pri,
        "predictedCategory":  best_cat,
        "aiSummary":          summary,
        "tags":               tags,
        "confidence":         confidence,
        "reason":             reason,
        "engine":             "rules",
    }
