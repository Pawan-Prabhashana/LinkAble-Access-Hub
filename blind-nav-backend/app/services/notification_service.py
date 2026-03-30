"""
Notification Service — maps alert events to notification payloads.

Each alert type triggers one or more notifications to relevant roles
across channels (EMAIL / SMS / IN_APP).

EMAIL channel notifications also trigger a REAL email via email_service
(when SMTP credentials are configured in .env).
"""

from __future__ import annotations
from app.services import notification_store

# Recipient definitions per escalation / alert type
RECIPIENTS = {
    "CRITICAL_REQUEST_CREATED": [
        {"channel": "EMAIL", "recipient": "Accessibility Officer",   "status": "SENT"},
        {"channel": "SMS",   "recipient": "Duty Manager",           "status": "SENT"},
        {"channel": "IN_APP","recipient": "All Officers",           "status": "DELIVERED"},
    ],
    "SLA_AT_RISK": [
        {"channel": "IN_APP","recipient": "Assigned Officer",       "status": "DELIVERED"},
        {"channel": "EMAIL", "recipient": "Team Lead",              "status": "SENT"},
    ],
    "SLA_BREACHED": [
        {"channel": "EMAIL", "recipient": "Operations Manager",     "status": "SENT"},
        {"channel": "SMS",   "recipient": "Duty Manager",           "status": "SENT"},
        {"channel": "IN_APP","recipient": "All Officers",           "status": "DELIVERED"},
    ],
    "ESCALATION_TRIGGERED": [
        {"channel": "EMAIL", "recipient": "Operations Manager",     "status": "SENT"},
        {"channel": "IN_APP","recipient": "Team Lead",              "status": "DELIVERED"},
    ],
    "REQUEST_UNASSIGNED": [
        {"channel": "IN_APP","recipient": "Accessibility Officer",  "status": "DELIVERED"},
    ],
}

ALERT_TYPE_TO_NOTIF_TYPE = {
    "CRITICAL_REQUEST_CREATED": "CRITICAL_ALERT",
    "SLA_AT_RISK":              "SLA_WARNING",
    "SLA_BREACHED":             "SLA_BREACH",
    "ESCALATION_TRIGGERED":     "ESCALATION",
    "REQUEST_UNASSIGNED":       "GENERAL",
}


def create_from_alert(alert: object) -> list:
    """
    Given an Alert object, generate and persist appropriate simulated notifications.
    Called automatically by alert_store.create_alert().
    """
    alert_type = getattr(alert, "type", "")
    alert_title = getattr(alert, "title", "")
    alert_message = getattr(alert, "message", "")
    alert_id = getattr(alert, "id", None)
    request_id = getattr(alert, "requestId", None)
    notif_type = ALERT_TYPE_TO_NOTIF_TYPE.get(alert_type, "GENERAL")

    recipients = RECIPIENTS.get(alert_type, [
        {"channel": "IN_APP", "recipient": "All Officers", "status": "DELIVERED"},
    ])

    payloads = []
    for r in recipients:
        payloads.append({
            "type":       notif_type,
            "channel":    r["channel"],
            "recipient":  r["recipient"],
            "subject":    f"[LinkAble AccessHub] {alert_title}",
            "body":       f"{alert_message}\n\nThis is an automated notification from LinkAble Access Hub operations system.",
            "status":     r["status"],
            "alertId":    alert_id,
            "requestId":  request_id,
        })

    created = notification_store.create_notifications_bulk(payloads)

    # Fire real email for every EMAIL-channel notification
    _send_real_emails(payloads, alert_title, alert_message, request_id, alert)

    return created


def _send_real_emails(
    payloads: list,
    alert_title: str,
    alert_message: str,
    request_id: object,
    alert: object,
) -> None:
    """Send actual emails for all EMAIL-channel notifications."""
    from app.services import email_service

    severity = getattr(alert, "severity", "HIGH")
    req_id   = str(request_id) if request_id else None

    for p in payloads:
        if p.get("channel") != "EMAIL":
            continue
        try:
            email_service.send_alert_email(
                alert_title=alert_title,
                alert_message=(
                    f"{alert_message}\n\n"
                    f"Intended recipient role: {p['recipient']}"
                ),
                request_id=req_id,
                severity=severity,
            )
        except Exception as exc:
            print(f"[Email] Notification email failed: {exc}")
