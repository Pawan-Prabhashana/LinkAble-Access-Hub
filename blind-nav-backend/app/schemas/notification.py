from pydantic import BaseModel
from typing import Optional


class Notification(BaseModel):
    id: str
    type: str       # CRITICAL_ALERT | SLA_WARNING | SLA_BREACH | ESCALATION | GENERAL
    channel: str    # EMAIL | SMS | IN_APP | PUSH
    recipient: str  # Role / person name
    subject: str
    body: str
    status: str     # PREPARED | QUEUED | SENT | DELIVERED
    alertId: Optional[str] = None
    requestId: Optional[str] = None
    createdAt: str
    sentAt: Optional[str] = None
