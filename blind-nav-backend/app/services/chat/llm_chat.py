"""
Layer B — LLM-powered conversational chat intake.

Uses OpenAI to extract structured fields AND generate a natural reply.
Falls back to None if the API key is missing or the call fails.
"""

from __future__ import annotations

import json
import os
from typing import List, Optional

from app.schemas.chat import ChatMessage

_SYSTEM_PROMPT = """You are an AI intake assistant for LinkAble Access Hub, an accessibility service request platform at a university.

Your job is to help officers and users report accessibility barriers through conversation and produce a structured service request draft.

When the user describes an accessibility issue, extract and return ONLY a JSON object with these exact fields:
{
  "title": "short summary, max 80 characters",
  "description": "full description based on the user's words",
  "category": "one of: PHYSICAL_OBSTRUCTION | ACCESSIBILITY_EQUIPMENT_ISSUE | NAVIGATION_ASSISTANCE | UNSAFE_ENVIRONMENT | FACILITY_ACCESS_ISSUE | EMERGENCY_SUPPORT",
  "priority": "one of: CRITICAL | HIGH | MEDIUM | LOW",
  "location": "building/floor/area name, or null if not mentioned",
  "tags": ["array", "of", "relevant", "keywords"],
  "aiSummary": "1-2 sentence professional summary of the issue",
  "confidence": 0.85,
  "reply": "brief, professional 1-2 sentence acknowledgment of what you understood",
  "missingFields": ["list", "of", "important", "missing", "fields"],
  "readyToCreate": true,
  "followUpQuestion": "one short follow-up question if a critical field is missing, otherwise null"
}

Priority guidelines:
- CRITICAL: emergencies, trapped persons, immediate access blockage, injury risk
- HIGH: major barriers affecting access, unsafe conditions, broken essential equipment
- MEDIUM: moderate inconvenience, equipment issues, navigation difficulties
- LOW: minor issues, suggestions, general inquiries

Category guidelines:
- PHYSICAL_OBSTRUCTION: objects blocking pathways, corridors, entrances
- ACCESSIBILITY_EQUIPMENT_ISSUE: broken lift, ramp, voice guidance, door mechanism
- NAVIGATION_ASSISTANCE: person needs escort or guidance to reach a location
- UNSAFE_ENVIRONMENT: wet floors, poor lighting, trip hazards, exposed wires
- FACILITY_ACCESS_ISSUE: locked doors, inaccessible entrances, building access denied
- EMERGENCY_SUPPORT: immediate danger, injury, trapped, medical emergency

Rules:
- Set readyToCreate: true only when you have title, description, category, and priority
- Only ask a followUpQuestion if a genuinely critical field is missing
- Keep reply concise and professional (1-2 sentences max)
- Return ONLY valid JSON — no explanation text, no markdown fences"""


def analyze(
    messages: List[ChatMessage],
    current_draft: Optional[dict] = None,
) -> Optional[dict]:
    """
    Call OpenAI to extract structured fields + generate a reply.
    Returns a dict or None on failure/no API key.
    """
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        return None

    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)

        openai_msgs = [{"role": "system", "content": _SYSTEM_PROMPT}]

        if current_draft:
            openai_msgs.append({
                "role": "system",
                "content": f"Current draft state: {json.dumps(current_draft)}",
            })

        for m in messages:
            openai_msgs.append({"role": m.role, "content": m.content})

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=openai_msgs,  # type: ignore[arg-type]
            temperature=0.2,
            max_tokens=600,
            response_format={"type": "json_object"},
        )

        raw = response.choices[0].message.content or ""
        result = json.loads(raw)

        # Validate required fields exist
        required = {"title", "description", "category", "priority", "reply"}
        if not required.issubset(result.keys()):
            return None

        # Sanitise
        result.setdefault("tags", [])
        result.setdefault("missingFields", [])
        result.setdefault("readyToCreate", False)
        result.setdefault("confidence", 0.8)
        result.setdefault("followUpQuestion", None)
        result.setdefault("aiSummary", result.get("title", ""))

        return result

    except Exception as exc:
        print(f"[LLM Chat] Error: {exc}")
        return None
