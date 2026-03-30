from pydantic import BaseModel
from typing import Optional


class Alert(BaseModel):
    id: str
    type: str        # CRITICAL_REQUEST_CREATED | SLA_AT_RISK | SLA_BREACHED | ESCALATION_TRIGGERED | REQUEST_UNASSIGNED
    severity: str    # INFO | WARNING | HIGH | CRITICAL
    title: str
    message: str
    requestId: Optional[str] = None
    createdAt: str
    isRead: bool = False
    source: str = "system"   # 'system' | 'rules' | 'llm'
