import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List

from app.schemas.request import IssueRequest, IssueRequestCreate, IssueRequestUpdate, Note
from app.schemas.ai import AIAnalysisResult
from app.schemas.copilot import CopilotResult

DATA_FILE = Path(__file__).parent.parent.parent / "data" / "requests.json"


def _load() -> list[dict]:
    if not DATA_FILE.exists():
        return []
    try:
        return json.loads(DATA_FILE.read_text(encoding="utf-8"))
    except Exception:
        return []


def _save(requests: list[dict]) -> None:
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    DATA_FILE.write_text(
        json.dumps(requests, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _backfill(r: dict) -> dict:
    r.setdefault("notes", [])
    r.setdefault("assignedTo", None)
    r.setdefault("location", None)
    r.setdefault("lat", None)
    r.setdefault("lng", None)
    r.setdefault("reportedBy", None)
    r.setdefault("updatedAt", None)
    r.setdefault("transcript", None)
    # Phase 2
    r.setdefault("aiSummary", None)
    r.setdefault("aiCategory", None)
    r.setdefault("aiPriority", None)
    r.setdefault("aiTags", None)
    r.setdefault("aiConfidence", None)
    r.setdefault("aiReason", None)
    r.setdefault("aiEngine", None)
    r.setdefault("aiAnalyzedAt", None)
    r.setdefault("suggestedAction", None)
    # Phase 3
    r.setdefault("copilotSummary", None)
    r.setdefault("copilotSuggestedActions", None)
    r.setdefault("copilotResolutionSteps", None)
    r.setdefault("copilotRecommendedTeam", None)
    r.setdefault("copilotRecommendedAssignee", None)
    r.setdefault("copilotEscalationLevel", None)
    r.setdefault("copilotShouldAlert", None)
    r.setdefault("copilotAlertReason", None)
    r.setdefault("copilotDraftInternalNote", None)
    r.setdefault("copilotDecisionTrace", None)
    r.setdefault("copilotEngine", None)
    r.setdefault("copilotGeneratedAt", None)
    # Phase 4
    r.setdefault("slaTargetAt", None)
    r.setdefault("slaStatus", None)
    r.setdefault("slaMinutesRemaining", None)
    r.setdefault("escalationLevel", "NONE")
    r.setdefault("escalatedAt", None)
    r.setdefault("lastEscalationReason", None)
    return r


def _enrich_sla(r: dict) -> dict:
    """Recompute slaStatus + slaMinutesRemaining on every fetch (always fresh)."""
    from app.services.sla_service import compute_sla_status
    status, minutes = compute_sla_status(
        r.get("slaTargetAt"),
        r.get("status", "NEW"),
        r.get("priority", "MEDIUM"),
        r.get("timestamp", _now()),
    )
    r["slaStatus"] = status
    r["slaMinutesRemaining"] = minutes
    return r


def create_request(data: IssueRequestCreate) -> IssueRequest:
    transcript = (data.transcript or "").strip()
    raw_title = data.title or transcript
    title = (raw_title[:60] + "…") if len(raw_title) > 60 else raw_title
    if not title:
        title = "Untitled Report"

    source = data.source or ("mobile_voice_report" if transcript else "officer_manual_entry")
    created_at = _now()

    # Phase 2: AI analysis
    ai_result: Optional[AIAnalysisResult] = None
    analysis_text = data.description or transcript or ""
    if analysis_text.strip() or title not in ("Untitled Report",):
        try:
            from app.services.ai.analyzer import analyze as ai_analyze
            ai_result = ai_analyze(
                text=analysis_text,
                title=title if title != "Untitled Report" else "",
                location=data.location or "",
            )
        except Exception as exc:
            print(f"[request_store] AI analysis failed: {exc}")

    # Phase 4: compute SLA target (use AI priority if user didn't set one)
    effective_priority = data.priority or (ai_result.predictedPriority if ai_result else "PENDING_REVIEW")
    from app.services.sla_service import compute_sla_target
    sla_target_at = compute_sla_target(effective_priority, created_at)

    # Phase 3: Copilot
    copilot_result: Optional[CopilotResult] = None
    if analysis_text.strip():
        try:
            from app.schemas.copilot import CopilotGenerateRequest
            from app.services.copilot.copilot_service import generate as copilot_gen
            copilot_req = CopilotGenerateRequest(
                title=title,
                description=analysis_text,
                transcript=transcript or None,
                aiCategory=ai_result.predictedCategory if ai_result else None,
                aiPriority=ai_result.predictedPriority if ai_result else None,
                aiSummary=ai_result.aiSummary if ai_result else None,
                location=data.location,
                currentStatus="NEW",
                source=source,
            )
            copilot_result = copilot_gen(copilot_req)
        except Exception as exc:
            print(f"[request_store] Copilot generation failed: {exc}")

    record = IssueRequest(
        id=str(uuid.uuid4()),
        title=title,
        description=data.description or transcript or "",
        transcript=transcript or None,
        category=data.category or "ACCESSIBILITY_SUPPORT",
        priority=data.priority or "PENDING_REVIEW",
        status="NEW",
        source=source,
        location=data.location,
        lat=data.lat,
        lng=data.lng,
        reportedBy=data.reportedBy,
        assignedTo=None,
        notes=[],
        timestamp=created_at,
        updatedAt=None,
        # AI
        aiSummary=ai_result.aiSummary if ai_result else None,
        aiCategory=ai_result.predictedCategory if ai_result else None,
        aiPriority=ai_result.predictedPriority if ai_result else None,
        aiTags=ai_result.tags if ai_result else None,
        aiConfidence=ai_result.confidence if ai_result else None,
        aiReason=ai_result.reason if ai_result else None,
        aiEngine=ai_result.engine if ai_result else None,
        aiAnalyzedAt=created_at if ai_result else None,
        suggestedAction=None,
        # Copilot
        copilotSummary=copilot_result.copilotSummary if copilot_result else None,
        copilotSuggestedActions=copilot_result.copilotSuggestedActions if copilot_result else None,
        copilotResolutionSteps=copilot_result.copilotResolutionSteps if copilot_result else None,
        copilotRecommendedTeam=copilot_result.copilotRecommendedTeam if copilot_result else None,
        copilotRecommendedAssignee=copilot_result.copilotRecommendedAssignee if copilot_result else None,
        copilotEscalationLevel=copilot_result.copilotEscalationLevel if copilot_result else None,
        copilotShouldAlert=copilot_result.copilotShouldAlert if copilot_result else None,
        copilotAlertReason=copilot_result.copilotAlertReason if copilot_result else None,
        copilotDraftInternalNote=copilot_result.copilotDraftInternalNote if copilot_result else None,
        copilotDecisionTrace=copilot_result.copilotDecisionTrace if copilot_result else None,
        copilotEngine=copilot_result.copilotEngine if copilot_result else None,
        copilotGeneratedAt=copilot_result.copilotGeneratedAt if copilot_result else None,
        # SLA / Escalation
        slaTargetAt=sla_target_at,
        slaStatus=None,  # Will be computed on fetch
        slaMinutesRemaining=None,
        escalationLevel="NONE",
        escalatedAt=None,
        lastEscalationReason=None,
    )

    existing = _load()
    existing.append(record.model_dump())
    _save(existing)

    # Immediately fire a CRITICAL alert if applicable
    _fire_creation_alert(record)

    return record


def _fire_creation_alert(record: IssueRequest) -> None:
    """Create an immediate alert when a CRITICAL or EMERGENCY request is created."""
    from app.services.alert_store import create_alert
    from app.services.sla_service import make_alert, get_sla_minutes

    if record.priority == "CRITICAL" or record.aiCategory == "EMERGENCY_SUPPORT":
        sla_min = get_sla_minutes(record.priority)
        create_alert(make_alert(
            "CRITICAL_REQUEST_CREATED",
            "CRITICAL",
            f"Critical Request Created — {record.title[:50]}",
            f"A CRITICAL priority request has been submitted. SLA: {int(sla_min)} minutes. Immediate response required.",
            record.id,
        ))
    elif record.priority == "HIGH":
        create_alert(make_alert(
            "CRITICAL_REQUEST_CREATED",
            "HIGH",
            f"High Priority Request — {record.title[:50]}",
            f"A HIGH priority accessibility request has been submitted. SLA window: {int(get_sla_minutes(record.priority))} minutes.",
            record.id,
        ))


def get_all_requests() -> list[IssueRequest]:
    raw = _load()
    result = []
    for r in raw:
        _backfill(r)
        _enrich_sla(r)
        result.append(IssueRequest(**r))
    return result


def get_request_by_id(request_id: str) -> Optional[IssueRequest]:
    for r in _load():
        if r.get("id") == request_id:
            _backfill(r)
            _enrich_sla(r)
            return IssueRequest(**r)
    return None


def update_request(request_id: str, data: IssueRequestUpdate) -> Optional[IssueRequest]:
    records = _load()
    for i, r in enumerate(records):
        if r.get("id") != request_id:
            continue

        if data.status is not None:
            r["status"] = data.status
        if data.assignedTo is not None:
            r["assignedTo"] = data.assignedTo
        if data.priority is not None:
            r["priority"] = data.priority
            # Recompute SLA target when priority changes
            from app.services.sla_service import compute_sla_target
            r["slaTargetAt"] = compute_sla_target(data.priority, r.get("timestamp", _now()))

        if data.noteText:
            note = Note(
                id=str(uuid.uuid4()),
                text=data.noteText,
                author=data.noteAuthor or "Officer",
                timestamp=_now(),
            )
            r.setdefault("notes", [])
            r["notes"].append(note.model_dump())

        r["updatedAt"] = _now()
        _backfill(r)
        _enrich_sla(r)
        records[i] = r
        _save(records)
        return IssueRequest(**r)

    return None


def update_ai_fields(request_id: str, ai_result: AIAnalysisResult) -> Optional[IssueRequest]:
    records = _load()
    for i, r in enumerate(records):
        if r.get("id") != request_id:
            continue
        r["aiSummary"]    = ai_result.aiSummary
        r["aiCategory"]   = ai_result.predictedCategory
        r["aiPriority"]   = ai_result.predictedPriority
        r["aiTags"]       = ai_result.tags
        r["aiConfidence"] = ai_result.confidence
        r["aiReason"]     = ai_result.reason
        r["aiEngine"]     = ai_result.engine
        r["aiAnalyzedAt"] = _now()
        r["updatedAt"]    = _now()
        _backfill(r)
        _enrich_sla(r)
        records[i] = r
        _save(records)
        return IssueRequest(**r)
    return None


def update_copilot_fields(request_id: str, result: CopilotResult) -> Optional[IssueRequest]:
    records = _load()
    for i, r in enumerate(records):
        if r.get("id") != request_id:
            continue
        r["copilotSummary"]             = result.copilotSummary
        r["copilotSuggestedActions"]    = result.copilotSuggestedActions
        r["copilotResolutionSteps"]     = result.copilotResolutionSteps
        r["copilotRecommendedTeam"]     = result.copilotRecommendedTeam
        r["copilotRecommendedAssignee"] = result.copilotRecommendedAssignee
        r["copilotEscalationLevel"]     = result.copilotEscalationLevel
        r["copilotShouldAlert"]         = result.copilotShouldAlert
        r["copilotAlertReason"]         = result.copilotAlertReason
        r["copilotDraftInternalNote"]   = result.copilotDraftInternalNote
        r["copilotDecisionTrace"]       = result.copilotDecisionTrace
        r["copilotEngine"]              = result.copilotEngine
        r["copilotGeneratedAt"]         = result.copilotGeneratedAt
        r["updatedAt"]                  = _now()
        _backfill(r)
        _enrich_sla(r)
        records[i] = r
        _save(records)
        return IssueRequest(**r)
    return None


def get_all_requests_paginated(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    priority: Optional[str] = None,
) -> List[IssueRequest]:
    all_req = get_all_requests()
    if status:
        all_req = [r for r in all_req if r.status == status]
    if priority:
        all_req = [r for r in all_req if r.priority == priority]
    return all_req[skip: skip + limit]
