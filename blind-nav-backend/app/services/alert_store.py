"""
Alert store — simple JSON file persistence for operational alerts.
Thread-safe enough for a hackathon (single-process, GIL-protected).
"""

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from app.schemas.alert import Alert

ALERT_FILE = Path(__file__).parent.parent.parent / "data" / "alerts.json"
# Keep at most this many alerts to avoid unbounded growth
MAX_ALERTS = 200


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _load() -> list[dict]:
    if not ALERT_FILE.exists():
        return []
    try:
        return json.loads(ALERT_FILE.read_text(encoding="utf-8"))
    except Exception:
        return []


def _save(alerts: list[dict]) -> None:
    ALERT_FILE.parent.mkdir(parents=True, exist_ok=True)
    # Trim to MAX_ALERTS (keep newest)
    if len(alerts) > MAX_ALERTS:
        alerts = alerts[-MAX_ALERTS:]
    ALERT_FILE.write_text(
        json.dumps(alerts, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )


# ── Deduplication key ─────────────────────────────────────────────────────────
# Prevents creating duplicate alerts for the same request + type combo within a
# short window (prevents spam from the background checker firing repeatedly).

def _already_recent(
    existing: list[dict],
    alert_type: str,
    request_id: Optional[str],
    within_minutes: int = 15,
) -> bool:
    cutoff = datetime.fromisoformat(_now()) \
        .replace(tzinfo=None)
    from datetime import timedelta
    cutoff_str = (datetime.utcnow() - timedelta(minutes=within_minutes)).isoformat()

    for a in existing:
        if (
            a.get("type") == alert_type
            and a.get("requestId") == request_id
            and a.get("createdAt", "") >= cutoff_str
        ):
            return True
    return False


# ── Public API ────────────────────────────────────────────────────────────────

def create_alert(data: dict) -> Alert:
    existing = _load()

    # Deduplicate
    if _already_recent(existing, data["type"], data.get("requestId")):
        # Return a stub — no write
        return Alert(**data)

    data.setdefault("id", str(uuid.uuid4()))
    data.setdefault("createdAt", _now())
    data.setdefault("isRead", False)
    data.setdefault("source", "system")

    existing.append(data)
    _save(existing)
    return Alert(**data)


def create_alerts_bulk(alerts: list[dict]) -> list[Alert]:
    existing = _load()
    created = []
    for data in alerts:
        if _already_recent(existing, data["type"], data.get("requestId")):
            continue
        data.setdefault("id", str(uuid.uuid4()))
        data.setdefault("createdAt", _now())
        data.setdefault("isRead", False)
        data.setdefault("source", "system")
        existing.append(data)
        created.append(Alert(**data))
    if created:
        _save(existing)
    return created


def get_all_alerts(unread_only: bool = False) -> list[Alert]:
    raw = _load()
    raw.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    if unread_only:
        raw = [a for a in raw if not a.get("isRead", False)]
    return [Alert(**a) for a in raw]


def get_unread_count() -> int:
    return sum(1 for a in _load() if not a.get("isRead", False))


def mark_read(alert_id: str) -> bool:
    records = _load()
    for r in records:
        if r.get("id") == alert_id:
            r["isRead"] = True
            _save(records)
            return True
    return False


def mark_all_read() -> int:
    records = _load()
    count = 0
    for r in records:
        if not r.get("isRead", False):
            r["isRead"] = True
            count += 1
    if count:
        _save(records)
    return count


def clear_all() -> int:
    count = len(_load())
    _save([])
    return count
