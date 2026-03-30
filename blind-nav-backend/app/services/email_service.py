"""
Email Service — sends real emails via SMTP (Gmail-compatible).

Configuration (set in .env):
  SMTP_EMAIL    — sender address  (e.g. youraccount@gmail.com)
  SMTP_PASSWORD — Gmail App Password (NOT your main password)
  SMTP_HOST     — default: smtp.gmail.com
  SMTP_PORT     — default: 587
  ALERT_EMAIL_TO — comma-separated recipient addresses
                   default: pawanprabhashana11@gmail.com

Gmail setup:
  1. Go to https://myaccount.google.com/security
  2. Enable 2-Step Verification
  3. Under "App passwords" generate a password for "Mail"
  4. Set SMTP_EMAIL=your@gmail.com  SMTP_PASSWORD=xxxx-xxxx-xxxx-xxxx

Fails silently when credentials are missing — safe for offline demo.
"""

from __future__ import annotations

import os
import smtplib
import textwrap
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List, Optional

# ── Configuration ──────────────────────────────────────────────────────────

_SMTP_HOST   = os.getenv("SMTP_HOST",     "smtp.gmail.com")
_SMTP_PORT   = int(os.getenv("SMTP_PORT", "587"))
_SMTP_EMAIL  = os.getenv("SMTP_EMAIL",    "").strip()
_SMTP_PASS   = os.getenv("SMTP_PASSWORD", "").strip()
_DEFAULT_TO  = os.getenv("ALERT_EMAIL_TO", "pawanprabhashana11@gmail.com").strip()


def _is_configured() -> bool:
    return bool(_SMTP_EMAIL and _SMTP_PASS)


# ── Category → responsible officer role mapping ────────────────────────────
# In production this would pull from a user directory.
# For now all emails go to ALERT_EMAIL_TO.

CATEGORY_OFFICER: dict[str, str] = {
    "PHYSICAL_OBSTRUCTION":          "Facilities Officer",
    "ACCESSIBILITY_EQUIPMENT_ISSUE": "Facilities Officer",
    "NAVIGATION_ASSISTANCE":         "Accessibility Officer",
    "UNSAFE_ENVIRONMENT":            "Safety & Security Officer",
    "FACILITY_ACCESS_ISSUE":         "Facilities Officer",
    "EMERGENCY_SUPPORT":             "Duty Manager",
}

PRIORITY_EMOJI = {
    "CRITICAL": "🔴",
    "HIGH":     "🟠",
    "MEDIUM":   "🟡",
    "LOW":      "🟢",
}


# ── HTML email template ─────────────────────────────────────────────────────

def _html_body(
    subject: str,
    headline: str,
    body_paragraphs: List[str],
    request_id: Optional[str] = None,
    badge_text: Optional[str] = None,
    badge_color: str = "#e74c3c",
) -> str:
    badge_html = ""
    if badge_text:
        badge_html = (
            f'<span style="background:{badge_color};color:#fff;'
            f'padding:3px 10px;border-radius:12px;font-size:12px;'
            f'font-weight:700;letter-spacing:0.5px;">{badge_text}</span>&nbsp;&nbsp;'
        )

    link_html = ""
    if request_id:
        # If deployed, replace with real URL
        link_html = f"""
        <p style="margin-top:20px;">
          <a href="http://localhost:3000/requests/{request_id}"
             style="background:#2563eb;color:#fff;padding:10px 20px;
                    border-radius:8px;text-decoration:none;font-weight:600;
                    font-size:14px;">
            View Full Request →
          </a>
        </p>"""

    paras = "".join(
        f'<p style="color:#4b5563;font-size:14px;line-height:1.7;margin:8px 0;">{p}</p>'
        for p in body_paragraphs
    )

    now = datetime.now(timezone.utc).strftime("%d %b %Y %H:%M UTC")

    return f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
             background:#f8fafc;margin:0;padding:32px 0;">
  <div style="max-width:600px;margin:0 auto;background:#fff;
              border-radius:12px;overflow:hidden;
              box-shadow:0 1px 3px rgba(0,0,0,0.1);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1e3a5f,#2563eb);
                padding:24px 28px;">
      <p style="color:#93c5fd;font-size:11px;letter-spacing:1.5px;
                text-transform:uppercase;margin:0 0 6px;">
        LinkAble Access Hub · Automated Alert
      </p>
      <h1 style="color:#fff;font-size:20px;font-weight:700;margin:0;">
        {badge_html}{headline}
      </h1>
    </div>

    <!-- Body -->
    <div style="padding:24px 28px;">
      {paras}
      {link_html}
    </div>

    <!-- Footer -->
    <div style="background:#f1f5f9;padding:16px 28px;
                border-top:1px solid #e2e8f0;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">
        Sent automatically by LinkAble Access Hub at {now}.<br>
        This message requires no reply — action should be taken in the system.
      </p>
    </div>
  </div>
</body>
</html>"""


# ── Core send function ──────────────────────────────────────────────────────

def send_email(
    to: str | List[str],
    subject: str,
    html_body: str,
    plain_body: Optional[str] = None,
) -> bool:
    """
    Send an HTML email. Returns True on success, False on failure.
    Silently no-ops when SMTP is not configured.
    """
    if not _is_configured():
        print(f"[Email] SMTP not configured — skipping: {subject}")
        return False

    recipients = [to] if isinstance(to, str) else to

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f"LinkAble AccessHub <{_SMTP_EMAIL}>"
    msg["To"]      = ", ".join(recipients)

    if plain_body:
        msg.attach(MIMEText(plain_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(_SMTP_HOST, _SMTP_PORT, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(_SMTP_EMAIL, _SMTP_PASS)
            server.sendmail(_SMTP_EMAIL, recipients, msg.as_string())
        print(f"[Email] ✓ Sent to {recipients}: {subject}")
        return True
    except Exception as exc:
        print(f"[Email] ✗ Failed to send '{subject}': {exc}")
        return False


# ── High-level event senders ────────────────────────────────────────────────

def send_new_request_alert(
    request_id: str,
    title: str,
    category: str,
    priority: str,
    location: Optional[str],
    description: str,
    source: str,
) -> bool:
    """Send immediate email when a HIGH/CRITICAL request is created."""
    officer = CATEGORY_OFFICER.get(category, "Accessibility Officer")
    emoji   = PRIORITY_EMOJI.get(priority, "⚪")
    cat_label = category.replace("_", " ").title()
    loc_line = f"<strong>Location:</strong> {location}" if location else "Location not specified"

    subject = f"[AccessHub] {emoji} {priority} — New {cat_label} Request"

    paras = [
        f"A new <strong>{priority}</strong> priority accessibility request has been submitted and requires your attention.",
        f"<strong>Title:</strong> {title}",
        f"{loc_line}",
        f"<strong>Category:</strong> {cat_label}",
        f"<strong>Source:</strong> {source.replace('_', ' ').title()}",
        textwrap.shorten(description, width=250, placeholder="…") if description else "",
        f"Responsible officer: <strong>{officer}</strong>. Please review and take action promptly.",
    ]
    paras = [p for p in paras if p]

    return send_email(
        to=_DEFAULT_TO,
        subject=subject,
        html_body=_html_body(
            subject=subject,
            headline=f"New {priority} Request: {title[:60]}",
            body_paragraphs=paras,
            request_id=request_id,
            badge_text=f"{emoji} {priority}",
            badge_color="#dc2626" if priority == "CRITICAL" else "#ea580c",
        ),
        plain_body=(
            f"{subject}\n\n{title}\nLocation: {location or 'N/A'}\n"
            f"Category: {cat_label}\nPriority: {priority}\n\n{description[:300]}"
        ),
    )


def send_recurring_issue_alert(
    new_request_id: str,
    new_title: str,
    location: str,
    category: str,
    prior_titles: List[str],
    count: int,
) -> bool:
    """Send email when the same location/category has multiple open issues."""
    officer  = CATEGORY_OFFICER.get(category, "Accessibility Officer")
    cat_label = category.replace("_", " ").title()
    prior_list = "".join(f"<li>{t}</li>" for t in prior_titles[:5])

    subject = f"[AccessHub] ⚠ Recurring {cat_label} Issue at {location}"

    paras = [
        f"<strong>⚠ Recurring issue detected</strong> — {count} open {cat_label.lower()} "
        f"requests have been reported at or near <strong>{location}</strong>.",
        f"<strong>Latest request:</strong> {new_title}",
        f"<strong>Previous open issues at this location:</strong><ul>{prior_list}</ul>",
        f"This pattern may indicate a systemic problem requiring immediate investigation.",
        f"Responsible officer: <strong>{officer}</strong>. "
        f"Please review all related requests and coordinate a resolution.",
    ]

    return send_email(
        to=_DEFAULT_TO,
        subject=subject,
        html_body=_html_body(
            subject=subject,
            headline=f"Recurring Issue at {location}",
            body_paragraphs=paras,
            request_id=new_request_id,
            badge_text="⚠ RECURRING",
            badge_color="#d97706",
        ),
        plain_body=(
            f"{subject}\n\nLocation: {location}\nCategory: {cat_label}\n"
            f"Count: {count} open issues\nLatest: {new_title}"
        ),
    )


def send_sla_breach_email(
    request_id: str,
    title: str,
    priority: str,
    location: Optional[str],
    minutes_overdue: float,
) -> bool:
    """Send email when an SLA is breached."""
    subject = f"[AccessHub] 🚨 SLA Breached — {title[:50]}"
    officer = CATEGORY_OFFICER.get("FACILITY_ACCESS_ISSUE", "Operations Manager")
    overdue_str = f"{int(abs(minutes_overdue))} minutes overdue"

    paras = [
        f"🚨 <strong>SLA breach detected</strong> for a <strong>{priority}</strong> priority request.",
        f"<strong>Request:</strong> {title}",
        f"<strong>Location:</strong> {location or 'Not specified'}",
        f"<strong>Status:</strong> {overdue_str}",
        f"Immediate escalation to <strong>{officer}</strong> is required. Please review and resolve this request urgently.",
    ]

    return send_email(
        to=_DEFAULT_TO,
        subject=subject,
        html_body=_html_body(
            subject=subject,
            headline=f"SLA Breach: {title[:55]}",
            body_paragraphs=paras,
            request_id=request_id,
            badge_text="🚨 SLA BREACHED",
            badge_color="#7c3aed",
        ),
        plain_body=f"{subject}\n{title}\nLocation: {location or 'N/A'}\n{overdue_str}",
    )


def send_alert_email(
    alert_title: str,
    alert_message: str,
    request_id: Optional[str] = None,
    severity: str = "HIGH",
) -> bool:
    """Generic alert → email (called from notification_service)."""
    emoji_map = {"CRITICAL": "🔴", "HIGH": "🟠", "WARNING": "🟡", "INFO": "ℹ️"}
    emoji = emoji_map.get(severity, "⚪")
    subject = f"[AccessHub] {emoji} {alert_title}"

    return send_email(
        to=_DEFAULT_TO,
        subject=subject,
        html_body=_html_body(
            subject=subject,
            headline=alert_title,
            body_paragraphs=[alert_message],
            request_id=request_id,
            badge_text=f"{emoji} {severity}",
            badge_color="#dc2626" if severity == "CRITICAL" else "#ea580c",
        ),
        plain_body=f"{subject}\n\n{alert_message}",
    )
