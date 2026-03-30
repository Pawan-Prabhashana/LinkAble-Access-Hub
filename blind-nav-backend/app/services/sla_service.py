"""
SLA Service — Phase 4.

Responsibilities:
  - Compute slaTargetAt from priority + creation timestamp
  - Compute slaStatus and slaMinutesRemaining dynamically
  - Run auto-escalation checks
  - Generate alerts for SLA events

SLA windows (production defaults):
  CRITICAL       15 min
  HIGH           2 h  (120 min)
  MEDIUM         8 h  (480 min)
  LOW            24 h (1440 min)
  PENDING_REVIEW 4 h  (240 min)

Demo/dev-friendly windows (DEMO_MODE=true):
  CRITICAL       2 min
  HIGH           5 min
  MEDIUM         10 min
  LOW            20 min
  PENDING_REVIEW 8 min
"""

from __future__ import annotations

import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

# ── SLA windows ───────────────────────────────────────────────────────────────

SLA_MINUTES_PRODUCTION: dict[str, float] = {
    "CRITICAL":      15,
    "HIGH":          120,
    "MEDIUM":        480,
    "LOW":           1440,
    "PENDING_REVIEW": 240,
}

SLA_MINUTES_DEMO: dict[str, float] = {
    "CRITICAL":      2,
    "HIGH":          5,
    "MEDIUM":        10,
    "LOW":           20,
    "PENDING_REVIEW": 8,
}

# AT_RISK threshold: if time_remaining / total_sla <= this fraction, mark AT_RISK
AT_RISK_FRACTION = 0.25


def _is_demo() -> bool:
    return os.getenv("DEMO_MODE", "false").lower() in ("true", "1", "yes")


def get_sla_minutes(priority: str) -> float:
    table = SLA_MINUTES_DEMO if _is_demo() else SLA_MINUTES_PRODUCTION
    return table.get(priority, 240)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _parse(iso: str) -> datetime:
    return datetime.fromisoformat(iso)


# ── Compute SLA target ────────────────────────────────────────────────────────

def compute_sla_target(priority: str, created_at: str) -> str:
    """Return ISO datetime string for the SLA deadline."""
    minutes = get_sla_minutes(priority)
    created = _parse(created_at)
    target = created + timedelta(minutes=minutes)
    return target.isoformat()


# ── Compute current SLA status ────────────────────────────────────────────────

def compute_sla_status(
    sla_target_at: Optional[str],
    request_status: str,
    priority: str,
    created_at: str,
) -> tuple[str, float]:
    """
    Returns (sla_status, minutes_remaining).
    minutes_remaining is negative if overdue.
    """
    # Terminal states don't breach SLA
    if request_status in ("COMPLETED", "CANCELLED"):
        return "COMPLETED", 0.0

    if not sla_target_at:
        # Reconstruct target if missing (back-compat)
        sla_target_at = compute_sla_target(priority, created_at)

    target = _parse(sla_target_at)
    now = _now()
    delta_minutes = (target - now).total_seconds() / 60.0

    total_minutes = get_sla_minutes(priority)

    if delta_minutes < 0:
        return "BREACHED", round(delta_minutes, 1)

    if total_minutes > 0 and (delta_minutes / total_minutes) <= AT_RISK_FRACTION:
        return "AT_RISK", round(delta_minutes, 1)

    return "ON_TRACK", round(delta_minutes, 1)


# ── Escalation logic ──────────────────────────────────────────────────────────

ESCALATION_RULES = [
    # (condition_fn, escalation_level, reason)
    # Evaluated in order; first matching rule wins
]


def compute_escalation(
    priority: str,
    ai_category: Optional[str],
    sla_status: str,
    is_assigned: bool,
    created_at: str,
    current_escalation: Optional[str] = None,
) -> tuple[str, str]:
    """
    Returns (escalation_level, reason).
    Escalation levels: NONE | TEAM_LEAD | OPERATIONS_MANAGER | EMERGENCY_RESPONSE
    """
    now = _now()
    age_minutes = (now - _parse(created_at)).total_seconds() / 60.0

    # ── Emergency category always → EMERGENCY_RESPONSE ───────────────────────
    if ai_category == "EMERGENCY_SUPPORT":
        return "EMERGENCY_RESPONSE", "Emergency Support category requires immediate response"

    # ── CRITICAL priority ────────────────────────────────────────────────────
    if priority == "CRITICAL":
        if sla_status == "BREACHED":
            return "EMERGENCY_RESPONSE", "CRITICAL request SLA breached — emergency response required"
        if not is_assigned:
            return "EMERGENCY_RESPONSE", "CRITICAL request unassigned — immediate escalation required"
        return "OPERATIONS_MANAGER", "CRITICAL priority requires Operations Manager oversight"

    # ── SLA BREACHED ─────────────────────────────────────────────────────────
    if sla_status == "BREACHED":
        return "OPERATIONS_MANAGER", "SLA has been breached — escalating to Operations Manager"

    # ── SLA AT_RISK + HIGH priority ───────────────────────────────────────────
    if sla_status == "AT_RISK" and priority == "HIGH":
        return "TEAM_LEAD", "HIGH priority request approaching SLA breach — Team Lead escalation"

    # ── Unassigned too long ───────────────────────────────────────────────────
    unassigned_threshold = get_sla_minutes(priority) * 0.3  # 30% of SLA window
    if not is_assigned and age_minutes > unassigned_threshold:
        if priority in ("HIGH", "CRITICAL"):
            return "TEAM_LEAD", f"Request unassigned for {int(age_minutes)} min — Team Lead required"

    return "NONE", ""


# ── Alert generation ──────────────────────────────────────────────────────────

def make_alert(
    alert_type: str,
    severity: str,
    title: str,
    message: str,
    request_id: Optional[str] = None,
) -> dict:
    return {
        "id": str(uuid.uuid4()),
        "type": alert_type,
        "severity": severity,
        "title": title,
        "message": message,
        "requestId": request_id,
        "createdAt": _now().isoformat(),
        "isRead": False,
        "source": "system",
    }


def generate_sla_alerts(
    request_id: str,
    title: str,
    sla_status: str,
    escalation_level: str,
    escalation_reason: str,
    priority: str,
) -> list[dict]:
    alerts = []

    if sla_status == "BREACHED":
        alerts.append(make_alert(
            "SLA_BREACHED", "CRITICAL",
            f"SLA Breached — {title[:50]}",
            f"Request has exceeded its SLA target. Priority: {priority}. Immediate action required.",
            request_id,
        ))

    elif sla_status == "AT_RISK":
        alerts.append(make_alert(
            "SLA_AT_RISK", "HIGH",
            f"SLA At Risk — {title[:50]}",
            f"Request is approaching its SLA deadline. Priority: {priority}.",
            request_id,
        ))

    if escalation_level not in ("NONE", None, ""):
        alerts.append(make_alert(
            "ESCALATION_TRIGGERED", "HIGH" if escalation_level != "EMERGENCY_RESPONSE" else "CRITICAL",
            f"Escalation: {escalation_level.replace('_', ' ').title()} — {title[:40]}",
            escalation_reason,
            request_id,
        ))

    return alerts
