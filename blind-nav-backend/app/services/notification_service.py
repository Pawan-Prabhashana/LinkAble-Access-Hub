"""
Notification Service — maps alert events to simulated notification payloads.

Each alert type triggers one or more notifications to relevant roles,
across appropriate channels (EMAIL / SMS / IN_APP).

This is a simulation layer — no real email or SMS is sent.
The notifications are stored and visible in the Notification Centre UI.
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

    return notification_store.create_notifications_bulk(payloads)
