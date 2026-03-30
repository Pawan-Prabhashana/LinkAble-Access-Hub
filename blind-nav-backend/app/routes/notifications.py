from fastapi import APIRouter, Query
from typing import Optional
from app.services import notification_store
from app.schemas.notification import Notification

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[Notification])
def list_notifications(
    channel: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
):
    """
    Return all simulated notifications, newest first.
    Optionally filter by channel (EMAIL, SMS, IN_APP, PUSH) or type.
    """
    return notification_store.get_all(channel=channel, ntype=type)


@router.get("/stats", response_model=dict)
def notification_stats():
    return notification_store.get_stats()


@router.post("/{notif_id}/send", response_model=dict)
def simulate_send(notif_id: str):
    """Mark a notification as sent (simulates operator triggering dispatch)."""
    ok = notification_store.mark_sent(notif_id)
    if not ok:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"ok": True}
