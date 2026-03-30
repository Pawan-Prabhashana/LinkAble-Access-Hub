from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.schemas.alert import Alert
from app.services import alert_store

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("", response_model=list[Alert])
def list_alerts(unread_only: bool = Query(False)):
    """
    Return all operational alerts, newest first.
    Pass ?unread_only=true to get only unread alerts.
    """
    return alert_store.get_all_alerts(unread_only=unread_only)


@router.get("/count", response_model=dict)
def alert_count():
    """Return unread alert count. Used by the UI badge polling loop."""
    return {"unread": alert_store.get_unread_count()}


@router.post("/{alert_id}/read", response_model=dict)
def mark_alert_read(alert_id: str):
    ok = alert_store.mark_read(alert_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"ok": True}


@router.post("/read-all", response_model=dict)
def mark_all_read():
    count = alert_store.mark_all_read()
    return {"marked": count}


@router.delete("/clear", response_model=dict)
def clear_alerts():
    count = alert_store.clear_all()
    return {"cleared": count}
