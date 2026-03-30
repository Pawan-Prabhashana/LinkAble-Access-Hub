"""
Layer B — Optional LLM-powered analysis via OpenAI.

Called only when OPENAI_API_KEY is present in the environment.
If the API key is missing, the model is unavailable, or the response is
malformed/invalid, this module returns None so the orchestrator can
fall back to the rules-based classifier.
"""

from __future__ import annotations

import json
import os
from typing import Optional

SYSTEM_PROMPT = """You are an accessibility incident classifier for a public-building management system.

Analyse the request text and return ONLY a valid JSON object (no markdown, no prose) with these exact keys:
- predictedPriority   : one of CRITICAL | HIGH | MEDIUM | LOW
- predictedCategory   : one of PHYSICAL_OBSTRUCTION | ACCESSIBILITY_EQUIPMENT_ISSUE | NAVIGATION_ASSISTANCE | UNSAFE_ENVIRONMENT | FACILITY_ACCESS_ISSUE | EMERGENCY_SUPPORT
- aiSummary           : a clean one-line summary, max 100 characters
- tags                : JSON array of relevant tags chosen from: walkway, lift, entrance, exam_support, emergency, accessibility, ramp, construction, wet_floor, voice_guidance
- confidence          : float 0.0–1.0 representing your certainty
- reason              : one sentence explaining the classification decision

Definitions:
- PHYSICAL_OBSTRUCTION: object/furniture blocking a path or access route
- ACCESSIBILITY_EQUIPMENT_ISSUE: broken lift, audio/voice guidance, ramp, handrail, etc.
- NAVIGATION_ASSISTANCE: person needs help finding/reaching a location
- UNSAFE_ENVIRONMENT: wet floor, trip hazard, poor lighting, unstable surface
- FACILITY_ACCESS_ISSUE: locked/blocked entrance, door, gate
- EMERGENCY_SUPPORT: trapped, fallen, injured, urgent medical need

Typical examples:
- "There is a bench blocking the hallway" -> PHYSICAL_OBSTRUCTION, HIGH
- "The lift voice guidance is not working" -> ACCESSIBILITY_EQUIPMENT_ISSUE, HIGH
- "Wet floor near the accessible ramp" -> UNSAFE_ENVIRONMENT, HIGH
- "A student needs assistance getting to the exam hall" -> NAVIGATION_ASSISTANCE, HIGH
- "Accessible entrance is blocked by construction materials" -> FACILITY_ACCESS_ISSUE, HIGH
- "Person is stuck in the lift" -> EMERGENCY_SUPPORT, CRITICAL

Return ONLY the JSON object."""

_VALID_PRIORITIES = {"CRITICAL", "HIGH", "MEDIUM", "LOW"}
_VALID_CATEGORIES = {
    "PHYSICAL_OBSTRUCTION",
    "ACCESSIBILITY_EQUIPMENT_ISSUE",
    "NAVIGATION_ASSISTANCE",
    "UNSAFE_ENVIRONMENT",
    "FACILITY_ACCESS_ISSUE",
    "EMERGENCY_SUPPORT",
}


def _validate(result: dict) -> bool:
    """Return True only when all required keys are present and have valid values."""
    if result.get("predictedPriority") not in _VALID_PRIORITIES:
        return False
    if result.get("predictedCategory") not in _VALID_CATEGORIES:
        return False
    if not isinstance(result.get("aiSummary"), str) or not result["aiSummary"].strip():
        return False
    if not isinstance(result.get("tags"), list):
        return False
    confidence = result.get("confidence")
    if not isinstance(confidence, (int, float)):
        return False
    return True


def analyze(text: str, title: str = "", location: str = "") -> Optional[dict]:
    """
    Call OpenAI to classify the request text.
    Returns a dict compatible with AIAnalysisResult, or None on any failure.
    """
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        return None

    try:
        from openai import OpenAI  # type: ignore

        client = OpenAI(api_key=api_key)

        parts = [p for p in [title, text, location] if p and p.strip()]
        full_text = "\n".join(parts) if len(parts) > 1 else (parts[0] if parts else "")
        if not full_text.strip():
            return None

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": full_text},
            ],
            temperature=0.1,
            max_tokens=350,
        )

        raw = response.choices[0].message.content or ""
        # Strip markdown code fences if the model wraps output
        raw = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        result: dict = json.loads(raw)

        if not _validate(result):
            return None

        # Normalise & enrich
        result["confidence"] = round(float(result["confidence"]), 2)
        result["engine"] = "llm"
        result.setdefault("reason", "")
        return result

    except Exception as exc:  # noqa: BLE001
        print(f"[LLM analyzer] Failed: {exc}")
        return None
