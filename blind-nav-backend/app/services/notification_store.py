"""
Notification Store — JSON-file persistence for simulated notifications.

In production this would connect to an email/SMS/push provider.
Here it stores 'PREPARED' notifications that represent what the system
would send, providing a complete enterprise-grade audit trail.
"""

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from app.schemas.notification import Notification

NOTIF_FILE = Path(__file__).parent.parent.parent / "data" / "notifications.json"
MAX_NOTIFICATIONS = 300


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _load() -> list[dict]:
    if not NOTIF_FILE.exists():
        return []
    try:
        return json.loads(NOTIF_FILE.read_text(encoding="utf-8"))
    except Exception:
        return []


def _save(items: list[dict]) -> None:
    NOTIF_FILE.parent.mkdir(parents=True, exist_ok=True)
    if len(items) > MAX_NOTIFICATIONS:
        items = items[-MAX_NOTIFICATIONS:]
    NOTIF_FILE.write_text(
        json.dumps(items, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )


def create_notification(data: dict) -> Notification:
    data.setdefault("id", str(uuid.uuid4()))
    data.setdefault("createdAt", _now())
    data.setdefault("sentAt", None)
    existing = _load()
    existing.append(data)
    _save(existing)
    return Notification(**data)


def create_notifications_bulk(items: list[dict]) -> list[Notification]:
    now = _now()
    existing = _load()
    created = []
    for data in items:
        data.setdefault("id", str(uuid.uuid4()))
        data.setdefault("createdAt", now)
        data.setdefault("sentAt", None)
        existing.append(data)
        created.append(Notification(**data))
    if created:
        _save(existing)
    return created


def get_all(channel: Optional[str] = None, ntype: Optional[str] = None) -> list[Notification]:
    raw = _load()
    raw.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    if channel:
        raw = [r for r in raw if r.get("channel") == channel]
    if ntype:
        raw = [r for r in raw if r.get("type") == ntype]
    return [Notification(**r) for r in raw]


def mark_sent(notif_id: str) -> bool:
    records = _load()
    for r in records:
        if r.get("id") == notif_id:
            r["status"] = "SENT"
            r["sentAt"] = _now()
            _save(records)
            return True
    return False


def get_stats() -> dict:
    records = _load()
    return {
        "total": len(records),
        "prepared": sum(1 for r in records if r.get("status") == "PREPARED"),
        "sent": sum(1 for r in records if r.get("status") == "SENT"),
        "byChannel": {
            "EMAIL": sum(1 for r in records if r.get("channel") == "EMAIL"),
            "SMS":   sum(1 for r in records if r.get("channel") == "SMS"),
            "IN_APP":sum(1 for r in records if r.get("channel") == "IN_APP"),
            "PUSH":  sum(1 for r in records if r.get("channel") == "PUSH"),
        },
    }
