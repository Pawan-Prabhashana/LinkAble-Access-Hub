"""
Copilot Layer A — Deterministic rules engine.

Produces agentic recommendations, team assignments, escalation decisions,
and decision traces purely from structured request data + keywords.
No external API. Always produces a complete CopilotResult.
"""

from __future__ import annotations
from typing import List, Tuple

# ── Team assignment map ───────────────────────────────────────────────────────

TEAM_BY_CATEGORY = {
    "EMERGENCY_SUPPORT":            "Emergency Response Team",
    "UNSAFE_ENVIRONMENT":           "Security Team",
    "PHYSICAL_OBSTRUCTION":         "Facilities Team",
    "ACCESSIBILITY_EQUIPMENT_ISSUE":"Facilities Team",
    "NAVIGATION_ASSISTANCE":        "Navigation Assistance Team",
    "FACILITY_ACCESS_ISSUE":        "Facilities Team",
}

TEAM_UPGRADE_CRITICAL = {
    "UNSAFE_ENVIRONMENT":   "Emergency Response Team",
    "FACILITY_ACCESS_ISSUE":"Security Team",
}

TEAM_ASSIGNEE = {
    "Emergency Response Team":      "Emergency Response Officer",
    "Security Team":                "Security Duty Officer",
    "Facilities Team":              "Facilities Coordinator",
    "Navigation Assistance Team":   "Navigation Support Officer",
    "Student Support Desk":         "Student Support Officer",
    "Accessibility Officer":        "Accessibility Officer",
}

# ── Suggested actions ─────────────────────────────────────────────────────────

SUGGESTED_ACTIONS: dict[str, List[str]] = {
    "PHYSICAL_OBSTRUCTION": [
        "Dispatch Facilities Team to assess and clear the obstruction",
        "Notify affected users of an alternative accessible route",
        "Place temporary hazard signage near the obstruction",
        "Log the incident with photos if possible",
        "Confirm clearance and update request to In Progress",
    ],
    "ACCESSIBILITY_EQUIPMENT_ISSUE": [
        "Contact Facilities Maintenance for immediate equipment inspection",
        "Arrange manual assistance for affected users as interim measure",
        "Place out-of-service notice on the equipment",
        "Escalate to vendor if repair is not possible within 2 hours",
        "Confirm equipment restored and update status to Resolved",
    ],
    "NAVIGATION_ASSISTANCE": [
        "Assign Navigation Support Officer to assist the individual",
        "Confirm the person's current location and destination",
        "Provide real-time escort or remote guidance",
        "Log the assistance provided in the activity notes",
        "Check if wayfinding improvements are needed at this location",
    ],
    "UNSAFE_ENVIRONMENT": [
        "Secure the area immediately to prevent access",
        "Place visible hazard signage / barriers",
        "Notify Security Team for area monitoring",
        "Arrange urgent repairs or wet floor cleanup",
        "Re-inspect before re-opening access",
    ],
    "FACILITY_ACCESS_ISSUE": [
        "Contact Facilities or Security to unlock / unblock the access point",
        "Provide alternative entry route to affected users",
        "Investigate cause: scheduled maintenance, construction, or error",
        "Ensure accessible alternative meets accessibility standards",
        "Update signage and communicate resolution timeline",
    ],
    "EMERGENCY_SUPPORT": [
        "IMMEDIATELY dispatch Emergency Response Team to reported location",
        "Contact campus security for rapid area access",
        "Notify student/staff support for welfare follow-up",
        "Confirm the individual's condition and provide updates every 5 minutes",
        "Document full incident timeline for safety report",
    ],
}

RESOLUTION_STEPS: dict[str, List[str]] = {
    "PHYSICAL_OBSTRUCTION": [
        "Identify responsible party for the obstruction",
        "Remove or relocate the obstructing object to a designated area",
        "Verify the path is fully clear and accessible",
        "Update request status to Completed with resolution note",
    ],
    "ACCESSIBILITY_EQUIPMENT_ISSUE": [
        "Run diagnostics / visual inspection on the equipment",
        "Perform repair or arrange temporary replacement",
        "Test equipment with a sample user or officer",
        "Document repair details; update status to Completed",
    ],
    "NAVIGATION_ASSISTANCE": [
        "Confirm the person has been successfully assisted",
        "Note the exact location gap that caused the navigation difficulty",
        "Recommend permanent wayfinding improvement if recurring",
        "Close request with assistance summary in notes",
    ],
    "UNSAFE_ENVIRONMENT": [
        "Resolve the hazard (mop wet floor, repair railing, restore lighting)",
        "Confirm the area is safe for re-access",
        "Inspect surrounding area for related hazards",
        "File a safety incident report; close request with full details",
    ],
    "FACILITY_ACCESS_ISSUE": [
        "Restore or unblock the access point",
        "Verify access with a test using the required mobility aid",
        "Communicate resolution to reported user if contact details available",
        "Close request with resolution and root cause noted",
    ],
    "EMERGENCY_SUPPORT": [
        "Ensure individual receives immediate assistance",
        "Coordinate with emergency services if needed",
        "Complete welfare check and confirm safety",
        "Submit full incident report to Safety & Compliance team",
        "Schedule follow-up welfare check within 24 hours",
    ],
}

DRAFT_NOTE_TEMPLATES: dict[str, str] = {
    "EMERGENCY_SUPPORT":
        "⚠️ EMERGENCY: Immediate response dispatched. Emergency Response Team notified. "
        "Situation under active monitoring. All updates to be logged in real-time.",
    "UNSAFE_ENVIRONMENT":
        "⚡ URGENT: Unsafe environment condition reported. Area has been secured pending "
        "resolution. Security Team on site. Hazard signage placed.",
    "PHYSICAL_OBSTRUCTION":
        "Obstruction reported at the above location. Facilities Team assigned for removal. "
        "Affected route temporarily unavailable; alternative route communicated to users.",
    "ACCESSIBILITY_EQUIPMENT_ISSUE":
        "Accessibility equipment fault reported. Maintenance team notified for urgent inspection. "
        "Manual assistance arranged as interim measure.",
    "NAVIGATION_ASSISTANCE":
        "Navigation assistance requested. Navigation Support Officer assigned. "
        "Individual being assisted to destination.",
    "FACILITY_ACCESS_ISSUE":
        "Access point reported blocked. Facilities and Security Teams coordinating to restore access. "
        "Alternative entry route provided to users.",
}

# ── Escalation keyword signals ────────────────────────────────────────────────

CRITICAL_KEYWORDS = [
    "emergency", "trapped", "stuck", "cannot move", "fallen", "injury",
    "medical", "urgent", "help now", "fall risk",
]

URGENT_KEYWORDS = [
    "blocked", "blocking", "not working", "broken", "unsafe", "dangerous",
    "wet floor", "slippery", "cannot enter", "exam hall", "exam", "hazard",
]


def _keyword_hit(text_lower: str, keywords: list) -> list[str]:
    return [kw for kw in keywords if kw in text_lower]


# ── Core decision logic ───────────────────────────────────────────────────────

def generate(
    title: str,
    description: str,
    ai_category: str | None,
    ai_priority: str | None,
    location: str | None = None,
    current_status: str = "NEW",
    ai_summary: str | None = None,
    transcript: str | None = None,
) -> dict:
    """
    Generate a full copilot result using deterministic rules.
    Returns a dict compatible with CopilotResult.
    """
    trace: List[str] = []
    full_text = " ".join(
        p for p in [title, description, ai_summary, transcript, location] if p
    ).lower()

    cat = ai_category or "PHYSICAL_OBSTRUCTION"
    pri = ai_priority or "MEDIUM"

    # ── Step 1: Determine escalation level ───────────────────────────────────
    crit_hits = _keyword_hit(full_text, CRITICAL_KEYWORDS)
    urg_hits  = _keyword_hit(full_text, URGENT_KEYWORDS)

    if pri == "CRITICAL" or crit_hits:
        escalation = "CRITICAL"
        should_alert = True
        alert_reason = (
            f"Priority is CRITICAL" if pri == "CRITICAL"
            else f"Critical keywords detected: {', '.join(crit_hits[:3])}"
        )
        trace.append(f"Escalation → CRITICAL: {alert_reason}")
    elif pri == "HIGH" or cat == "EMERGENCY_SUPPORT" or urg_hits:
        escalation = "URGENT"
        should_alert = cat in ("EMERGENCY_SUPPORT", "UNSAFE_ENVIRONMENT")
        alert_reason = (
            "Emergency Support category triggers alert" if cat == "EMERGENCY_SUPPORT"
            else ("Unsafe environment with high priority" if should_alert else "")
        )
        trace.append(
            f"Escalation → URGENT: priority={pri}, category={cat}, "
            f"urgent-keywords=[{', '.join(urg_hits[:2])}]"
        )
    elif pri == "MEDIUM":
        escalation = "NORMAL"
        should_alert = False
        alert_reason = ""
        trace.append(f"Escalation → NORMAL: priority=MEDIUM")
    else:
        escalation = "NORMAL"
        should_alert = False
        alert_reason = ""
        trace.append(f"Escalation → NORMAL: priority={pri}, no critical signals")

    # ── Step 2: Override escalation for specific content signals ─────────────
    if "exam hall" in full_text or "examination" in full_text:
        if escalation not in ("CRITICAL",):
            escalation = "ESCALATE"
            should_alert = True
            alert_reason = "Exam hall / examination context — time-sensitive escalation required"
            trace.append("Override → ESCALATE: exam context detected")

    if "fire" in full_text or "smoke" in full_text:
        escalation = "CRITICAL"
        should_alert = True
        alert_reason = "Fire/smoke keywords — emergency protocol activated"
        trace.append("Override → CRITICAL: fire/smoke keywords detected")

    # ── Step 3: Team assignment ────────────────────────────────────────────────
    recommended_team = TEAM_BY_CATEGORY.get(cat, "Accessibility Officer")
    if escalation == "CRITICAL" and cat in TEAM_UPGRADE_CRITICAL:
        recommended_team = TEAM_UPGRADE_CRITICAL[cat]
        trace.append(
            f"Team upgrade: {cat} + CRITICAL → {recommended_team}"
        )
    else:
        trace.append(f"Team assigned: {recommended_team} (category={cat})")

    recommended_assignee = TEAM_ASSIGNEE.get(recommended_team, "Duty Officer")
    trace.append(f"Suggested assignee: {recommended_assignee}")

    # ── Step 4: Suggested actions + resolution steps ───────────────────────────
    actions        = SUGGESTED_ACTIONS.get(cat, SUGGESTED_ACTIONS["PHYSICAL_OBSTRUCTION"])
    resolution     = RESOLUTION_STEPS.get(cat, RESOLUTION_STEPS["PHYSICAL_OBSTRUCTION"])
    trace.append(f"Actions and resolution steps loaded for category: {cat}")

    # ── Step 5: Draft internal note ────────────────────────────────────────────
    note_template = DRAFT_NOTE_TEMPLATES.get(cat, DRAFT_NOTE_TEMPLATES["PHYSICAL_OBSTRUCTION"])
    loc_clause = f" Location: {location}." if location else ""
    draft_note = f"[AUTO-GENERATED]{loc_clause} {note_template}"

    # ── Step 6: Copilot summary ────────────────────────────────────────────────
    first_sentence = (ai_summary or description[:120]).rstrip(".")
    summary = (
        f"{first_sentence}. "
        f"Classified as {cat.replace('_', ' ').title()} with {pri} priority. "
        f"Recommended action: {actions[0].lower() if actions else 'assess and respond.'}"
    )
    trace.append(f"Summary generated from: AI summary + category + top action")

    # ── Step 7: Engine label ───────────────────────────────────────────────────
    trace.append("Engine: rules-based (no LLM API key detected)")

    return {
        "copilotSummary":            summary,
        "copilotSuggestedActions":   actions,
        "copilotResolutionSteps":    resolution,
        "copilotRecommendedTeam":    recommended_team,
        "copilotRecommendedAssignee": recommended_assignee,
        "copilotEscalationLevel":    escalation,
        "copilotShouldAlert":        should_alert,
        "copilotAlertReason":        alert_reason,
        "copilotDraftInternalNote":  draft_note,
        "copilotDecisionTrace":      trace,
        "copilotEngine":             "rules",
    }
