from fastapi import APIRouter
from app.services.sla_service import (
    compute_sla_status, compute_escalation, generate_sla_alerts, _is_demo, get_sla_minutes,
)
from app.services import alert_store, request_store as rs
from datetime import datetime, timezone

router = APIRouter(prefix="/sla", tags=["sla"])


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.post("/refresh", response_model=dict)
def refresh_sla():
    """
    Manually trigger a full SLA + escalation recalculation over all open requests.
    Called by the background task and optionally by the frontend for demo purposes.
    Returns a summary of changes and new alerts created.
    """
    return _run_sla_check()


@router.get("/config", response_model=dict)
def sla_config():
    """Return the current SLA windows so the UI can display countdown context."""
    from app.services.sla_service import SLA_MINUTES_DEMO, SLA_MINUTES_PRODUCTION
    table = SLA_MINUTES_DEMO if _is_demo() else SLA_MINUTES_PRODUCTION
    return {
        "demoMode": _is_demo(),
        "windows": table,
    }


@router.get("/stats", response_model=dict)
def sla_stats():
    """Aggregate SLA stats for the operations dashboard."""
    requests = rs.get_all_requests()
    active = [r for r in requests if r.status not in ("COMPLETED", "CANCELLED")]
    on_track = at_risk = breached = escalated = critical_open = 0
    for r in active:
        sla_status, _ = compute_sla_status(r.slaTargetAt, r.status, r.priority, r.timestamp)
        if sla_status == "BREACHED":
            breached += 1
        elif sla_status == "AT_RISK":
            at_risk += 1
        else:
            on_track += 1
        if r.escalationLevel and r.escalationLevel != "NONE":
            escalated += 1
        if r.priority == "CRITICAL":
            critical_open += 1
    unread = alert_store.get_unread_count()
    return {
        "activeRequests": len(active),
        "onTrack": on_track,
        "atRisk": at_risk,
        "breached": breached,
        "escalated": escalated,
        "criticalOpen": critical_open,
        "unreadAlerts": unread,
    }


def _run_sla_check() -> dict:
    """Core SLA check logic — shared by background task and /sla/refresh endpoint."""
    requests = rs.get_all_requests()
    active = [r for r in requests if r.status not in ("COMPLETED", "CANCELLED")]

    updated = 0
    alerts_created = 0

    for req in active:
        sla_status, minutes_remaining = compute_sla_status(
            req.slaTargetAt, req.status, req.priority, req.timestamp
        )
        escalation_level, escalation_reason = compute_escalation(
            priority=req.priority,
            ai_category=req.aiCategory,
            sla_status=sla_status,
            is_assigned=bool(req.assignedTo),
            created_at=req.timestamp,
            current_escalation=req.escalationLevel,
        )

        # Persist changes if anything changed
        changed = (
            req.slaStatus != sla_status
            or (escalation_level != "NONE" and req.escalationLevel != escalation_level)
        )
        if changed:
            _update_sla_fields(req.id, sla_status, minutes_remaining, escalation_level, escalation_reason)
            updated += 1

        # Generate alerts for at-risk/breached/escalated requests
        new_alerts_data = generate_sla_alerts(
            req.id, req.title, sla_status, escalation_level, escalation_reason, req.priority
        )
        created = alert_store.create_alerts_bulk(new_alerts_data)
        alerts_created += len(created)

    return {
        "checked": len(active),
        "updated": updated,
        "alertsCreated": alerts_created,
        "timestamp": _now(),
    }


def _update_sla_fields(
    request_id: str,
    sla_status: str,
    minutes_remaining: float,
    escalation_level: str,
    escalation_reason: str,
) -> None:
    """Directly patch SLA + escalation fields in the JSON store."""
    from app.services.request_store import _load, _save, _backfill
    records = _load()
    for i, r in enumerate(records):
        if r.get("id") != request_id:
            continue
        r["slaStatus"] = sla_status
        r["slaMinutesRemaining"] = minutes_remaining
        if escalation_level != "NONE":
            r["escalationLevel"] = escalation_level
            r["escalatedAt"] = _now()
            r["lastEscalationReason"] = escalation_reason
        _backfill(r)
        records[i] = r
        _save(records)
        return
