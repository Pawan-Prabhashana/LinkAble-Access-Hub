#!/usr/bin/env python3
"""
LinkAble Access Hub — Demo Seed Script
=======================================
Creates 13 realistic accessibility request records with varied SLA states,
priorities, categories, locations, and alert states.

Run from the backend root:
    python scripts/seed.py [--clear]

Options:
    --clear    Wipe existing data before seeding (default: append)
    --demo     Use demo-mode SLA windows (CRITICAL=2m, HIGH=5m, etc.)
"""

import sys
import json
import uuid
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path

# ── Paths ──────────────────────────────────────────────────────────────────────
ROOT = Path(__file__).parent.parent
DATA_DIR = ROOT / "data"
REQUESTS_FILE = DATA_DIR / "requests.json"
ALERTS_FILE   = DATA_DIR / "alerts.json"

DATA_DIR.mkdir(parents=True, exist_ok=True)

# ── Flags ──────────────────────────────────────────────────────────────────────
CLEAR = "--clear" in sys.argv
DEMO  = "--demo"  in sys.argv or os.getenv("DEMO_MODE", "false").lower() in ("true","1")

# ── SLA windows ────────────────────────────────────────────────────────────────
SLA_DEMO = {"CRITICAL":2, "HIGH":5, "MEDIUM":10, "LOW":20, "PENDING_REVIEW":8}
SLA_PROD = {"CRITICAL":15,"HIGH":120,"MEDIUM":480,"LOW":1440,"PENDING_REVIEW":240}
SLA = SLA_DEMO if DEMO else SLA_PROD

def now_iso():
    return datetime.now(timezone.utc).isoformat()

def minutes_ago(n: float) -> str:
    return (datetime.now(timezone.utc) - timedelta(minutes=n)).isoformat()

def sla_target(priority: str, created_at: str) -> str:
    mins = SLA.get(priority, 240)
    t = datetime.fromisoformat(created_at) + timedelta(minutes=mins)
    return t.isoformat()

def nid() -> str:
    return str(uuid.uuid4())

# ── Campus building locations (University campus, Sri Lanka) ───────────────────
# Centred around University of Moratuwa, Katubedda
LOCATIONS = {
    "Main Entrance":          {"lat": 6.7953, "lng": 79.9007},
    "Central Library":        {"lat": 6.7961, "lng": 79.9019},
    "Engineering Block C":    {"lat": 6.7945, "lng": 79.8998},
    "North Staircase":        {"lat": 6.7970, "lng": 79.9030},
    "Student Canteen":        {"lat": 6.7938, "lng": 79.9012},
    "Block A Entrance":       {"lat": 6.7963, "lng": 79.9003},
    "Administration Building":{"lat": 6.7957, "lng": 79.9025},
    "Sports Complex":         {"lat": 6.7980, "lng": 79.9035},
    "Parking Zone B":         {"lat": 6.7942, "lng": 79.9040},
    "Lecture Hall 4":         {"lat": 6.7950, "lng": 79.9015},
    "Block D Corridor":       {"lat": 6.7967, "lng": 79.8995},
    "Main Auditorium":        {"lat": 6.7975, "lng": 79.9010},
}

def loc(name):
    l = LOCATIONS.get(name, {})
    return {"location": name, "lat": l.get("lat"), "lng": l.get("lng")}

def base_request(
    title, description, category, priority, status,
    source, location_name, created_minutes_ago,
    assigned_to=None, reported_by=None, transcript=None,
):
    created_at = minutes_ago(created_minutes_ago)
    sla_t = sla_target(priority, created_at)

    ai_categories = {
        "PHYSICAL_OBSTRUCTION":          "PHYSICAL_OBSTRUCTION",
        "ACCESSIBILITY_EQUIPMENT_ISSUE": "ACCESSIBILITY_EQUIPMENT_ISSUE",
        "NAVIGATION_ASSISTANCE":         "NAVIGATION_ASSISTANCE",
        "UNSAFE_ENVIRONMENT":            "UNSAFE_ENVIRONMENT",
        "FACILITY_ACCESS_ISSUE":         "FACILITY_ACCESS_ISSUE",
        "EMERGENCY_SUPPORT":             "EMERGENCY_SUPPORT",
    }
    ai_summaries = {
        "PHYSICAL_OBSTRUCTION": "Physical obstruction is blocking accessible pathway, requiring immediate clearance.",
        "ACCESSIBILITY_EQUIPMENT_ISSUE": "Accessibility equipment malfunction is preventing independent access for mobility-impaired users.",
        "NAVIGATION_ASSISTANCE": "A person requires navigation assistance to reach their destination safely.",
        "UNSAFE_ENVIRONMENT": "Hazardous condition poses immediate risk to persons with disabilities.",
        "FACILITY_ACCESS_ISSUE": "Facility access point is compromised, restricting independent movement.",
        "EMERGENCY_SUPPORT": "Emergency accessibility support required — immediate response needed.",
    }
    escalation = "NONE"
    escalation_reason = None
    if priority == "CRITICAL":
        escalation = "EMERGENCY_RESPONSE"
        escalation_reason = "CRITICAL priority requires Emergency Response oversight"
    elif priority == "HIGH" and status not in ("COMPLETED","CANCELLED"):
        escalation = "TEAM_LEAD"
        escalation_reason = "HIGH priority accessibility request — Team Lead monitoring required"

    copilot_teams = {
        "PHYSICAL_OBSTRUCTION":          "Facilities Team",
        "ACCESSIBILITY_EQUIPMENT_ISSUE": "Facilities Team",
        "NAVIGATION_ASSISTANCE":         "Navigation Assistance Team",
        "UNSAFE_ENVIRONMENT":            "Security Team",
        "FACILITY_ACCESS_ISSUE":         "Facilities Team",
        "EMERGENCY_SUPPORT":             "Emergency Response Team",
    }
    team = copilot_teams.get(category, "Facilities Team")

    l = LOCATIONS.get(location_name, {})
    return {
        "id": nid(),
        "title": title,
        "description": description,
        "transcript": transcript,
        "category": category,
        "priority": priority,
        "status": status,
        "source": source,
        "location": location_name,
        "lat": l.get("lat"),
        "lng": l.get("lng"),
        "reportedBy": reported_by,
        "assignedTo": assigned_to,
        "notes": [],
        "timestamp": created_at,
        "updatedAt": None,
        # AI
        "aiSummary": ai_summaries.get(category),
        "aiCategory": ai_categories.get(category),
        "aiPriority": priority,
        "aiTags": [category.lower().replace("_","-"), priority.lower(), "accessibility"],
        "aiConfidence": 0.90,
        "aiReason": f"High-confidence match for {category} category based on description keywords and context.",
        "aiEngine": "rules",
        "aiAnalyzedAt": created_at,
        "suggestedAction": None,
        # Copilot
        "copilotSummary": f"This is a {priority} priority {category.replace('_',' ').title()} issue at {location_name}. Immediate {team} response recommended.",
        "copilotSuggestedActions": [
            f"Dispatch {team} to {location_name}",
            "Document incident and update request status",
            "Notify affected users of estimated resolution time",
        ],
        "copilotResolutionSteps": [
            "Confirm the exact location and scope of the issue",
            f"Contact {team} duty officer",
            "Clear or repair the accessibility barrier",
            "Verify accessibility restored before closing",
            "Update request to COMPLETED with resolution note",
        ],
        "copilotRecommendedTeam": team,
        "copilotRecommendedAssignee": team.replace(" Team","") + " Officer",
        "copilotEscalationLevel": "NORMAL" if priority in ("LOW","MEDIUM") else "URGENT",
        "copilotShouldAlert": priority in ("CRITICAL", "HIGH"),
        "copilotAlertReason": f"{'Immediate response required — CRITICAL priority.' if priority=='CRITICAL' else 'Prompt response required — HIGH priority SLA applies.'}" if priority in ("CRITICAL","HIGH") else None,
        "copilotDraftInternalNote": f"[Auto-generated] {priority} priority accessibility issue reported at {location_name}. Category: {category}. {team} has been notified. Please update status as work progresses.",
        "copilotDecisionTrace": [
            f"Category identified as {category}",
            f"Priority confirmed: {priority}",
            f"Team assigned: {team}",
            f"Escalation level: {escalation}",
        ],
        "copilotEngine": "rules",
        "copilotGeneratedAt": created_at,
        # SLA
        "slaTargetAt": sla_t,
        "slaStatus": None,   # will be computed on fetch
        "slaMinutesRemaining": None,
        # Escalation
        "escalationLevel": escalation,
        "escalatedAt": created_at if escalation != "NONE" else None,
        "lastEscalationReason": escalation_reason,
    }

def make_alert(atype, severity, title, message, request_id, mins_ago=0):
    return {
        "id": nid(),
        "type": atype,
        "severity": severity,
        "title": title,
        "message": message,
        "requestId": request_id,
        "createdAt": minutes_ago(mins_ago),
        "isRead": False,
        "source": "system",
    }

# ── Seed requests ─────────────────────────────────────────────────────────────
REQUESTS = []
ALERTS = []

# 1. CRITICAL — SLA already breached (created 45min ago, window=15min)
r = base_request(
    title="Accessible entrance completely blocked by construction materials",
    description="The accessible entrance at the main building is fully blocked by construction materials and scaffolding. Multiple wheelchair users and visually impaired students are unable to enter the building. No alternative accessible route has been provided.",
    category="FACILITY_ACCESS_ISSUE",
    priority="CRITICAL",
    status="ASSIGNED",
    source="mobile_voice_report",
    location_name="Main Entrance",
    created_minutes_ago=45,
    assigned_to="Facilities Officer — Sarah M.",
    reported_by="Student — James K.",
    transcript="The accessible entrance is completely blocked. There are construction materials everywhere. I cannot get in.",
)
REQUESTS.append(r)
ALERTS.append(make_alert("CRITICAL_REQUEST_CREATED","CRITICAL","Critical: Entrance Blocked — Main Entrance","CRITICAL priority accessibility request created. SLA: 15 minutes. Immediate response required.",r["id"],44))
ALERTS.append(make_alert("SLA_BREACHED","CRITICAL","SLA Breached — Accessible Entrance Blocked","Request has exceeded SLA target by 30 minutes. Priority: CRITICAL. Emergency escalation active.",r["id"],28))

# 2. CRITICAL — Emergency support needed (created 30min ago, BREACHED)
r2 = base_request(
    title="Emergency support needed near north staircase — person in distress",
    description="A visually impaired student is reportedly in distress near the north staircase on level 2. They appear disoriented and are unable to find their way. No staff present in the area. Urgent navigation and welfare support needed.",
    category="EMERGENCY_SUPPORT",
    priority="CRITICAL",
    status="IN_PROGRESS",
    source="officer_manual_entry",
    location_name="North Staircase",
    created_minutes_ago=30,
    assigned_to="Emergency Response Officer",
    reported_by="Lecturer — Prof. Chen",
)
REQUESTS.append(r2)
ALERTS.append(make_alert("CRITICAL_REQUEST_CREATED","CRITICAL","Critical: Emergency Support Needed — North Staircase","Person in distress near staircase. CRITICAL SLA: 15 min. Emergency Response Team dispatched.",r2["id"],29))
ALERTS.append(make_alert("SLA_BREACHED","CRITICAL","SLA Breached — Emergency Support Request","SLA exceeded. Priority: CRITICAL. Emergency Response Team currently on site.",r2["id"],13))

# 3. HIGH — SLA at risk (created 90min ago, HIGH window=2h, ~25min remaining)
r3 = base_request(
    title="Elevator voice guidance system not working — Block C",
    description="The audio/voice guidance system on the elevator in Block C is completely non-functional. Buttons have no tactile feedback either. Multiple visually impaired users have reported being unable to use the elevator independently. Maintenance has not been notified.",
    category="ACCESSIBILITY_EQUIPMENT_ISSUE",
    priority="HIGH",
    status="ASSIGNED",
    source="mobile_voice_report",
    location_name="Engineering Block C",
    created_minutes_ago=95,
    assigned_to="Facilities Officer — Mark R.",
    reported_by="Student — Priya S.",
)
REQUESTS.append(r3)
ALERTS.append(make_alert("CRITICAL_REQUEST_CREATED","HIGH","High Priority: Elevator Voice Guidance Failure","Accessibility equipment malfunction in Block C elevator. HIGH priority SLA: 2 hours.",r3["id"],94))
ALERTS.append(make_alert("SLA_AT_RISK","HIGH","SLA At Risk — Elevator Voice Guidance","Request approaching SLA deadline. Priority: HIGH. Resolution required within 30 minutes.",r3["id"],45))

# 4. HIGH — Wet floor hazard near accessible ramp (AT_RISK)
r4 = base_request(
    title="Wet floor with no warning signs near accessible ramp — Administration Building",
    description="There is a significant water leak creating a wet floor hazard directly adjacent to the accessible ramp at the Administration Building entrance. No wet floor signs have been placed. Risk of falls for wheelchair users, cane users, and elderly visitors.",
    category="UNSAFE_ENVIRONMENT",
    priority="HIGH",
    status="NEW",
    source="officer_manual_entry",
    location_name="Administration Building",
    created_minutes_ago=80,
    reported_by="Security Officer — Ahmed T.",
)
REQUESTS.append(r4)
ALERTS.append(make_alert("CRITICAL_REQUEST_CREATED","HIGH","High Priority: Wet Floor Hazard Near Accessible Ramp","Safety hazard identified near accessible ramp. Immediate attention required.",r4["id"],79))

# 5. HIGH — Navigation assistance (AT_RISK)
r5 = base_request(
    title="Student needs navigation assistance to reach Exam Hall 4 urgently",
    description="A blind student is requesting urgent navigation assistance to reach Lecture Hall 4 for an exam starting in 20 minutes. The student is currently at the main entrance and is unfamiliar with the route. A Navigation Assistant has not yet been assigned.",
    category="NAVIGATION_ASSISTANCE",
    priority="HIGH",
    status="ASSIGNED",
    source="mobile_voice_report",
    location_name="Main Entrance",
    created_minutes_ago=60,
    assigned_to="Navigation Assistance Team",
    reported_by="Student — Anonymous",
    transcript="I need someone to help me get to my exam. I am at the entrance and do not know the way to Hall 4. My exam starts soon.",
)
REQUESTS.append(r5)
ALERTS.append(make_alert("CRITICAL_REQUEST_CREATED","HIGH","High Priority: Navigation Assistance Requested","Blind student needs urgent navigation assistance for exam. HIGH priority.",r5["id"],59))

# 6. HIGH — Bench blocking hallway (AT_RISK)
r6 = base_request(
    title="Bench blocking accessible hallway — Central Library",
    description="Three heavy benches have been placed in the main accessible corridor leading to the Central Library, completely blocking the pathway for wheelchair users. The benches appear to have been moved during a cleaning operation and not returned to their original positions.",
    category="PHYSICAL_OBSTRUCTION",
    priority="HIGH",
    status="NEW",
    source="officer_manual_entry",
    location_name="Central Library",
    created_minutes_ago=55,
    reported_by="Library Staff — Ms. Wang",
)
REQUESTS.append(r6)

# 7. MEDIUM — Accessible parking blocked
r7 = base_request(
    title="Accessible parking space occupied by non-accessible vehicle",
    description="The designated accessible parking space in Parking Zone B has been occupied by a vehicle without an accessibility permit for over 2 hours. Multiple users with mobility impairments have been unable to park. The vehicle registration is noted in the activity log.",
    category="FACILITY_ACCESS_ISSUE",
    priority="MEDIUM",
    status="IN_PROGRESS",
    source="officer_manual_entry",
    location_name="Parking Zone B",
    created_minutes_ago=180,
    assigned_to="Security Officer — David L.",
    reported_by="Security Officer — David L.",
)
REQUESTS.append(r7)

# 8. MEDIUM — Tactile path obstruction
r8 = base_request(
    title="Tactile guidance path blocked by temporary signage — Block D",
    description="Temporary directional signs for a departmental event have been placed directly on the tactile guidance path in Block D corridor. The signs are heavy and cannot be easily moved by persons with visual impairments. The tactile path is a primary navigation route for visually impaired students.",
    category="PHYSICAL_OBSTRUCTION",
    priority="MEDIUM",
    status="NEW",
    source="mobile_voice_report",
    location_name="Block D Corridor",
    created_minutes_ago=120,
    reported_by="Student — Blind Students Association",
    transcript="The tactile path near Block D is blocked. There are signs placed all over it. I nearly tripped.",
)
REQUESTS.append(r8)

# 9. MEDIUM — Poor lighting
r9 = base_request(
    title="Poor lighting creating accessibility hazard in Block D corridor",
    description="Multiple light fixtures in the Block D accessible corridor are non-functional, creating a significantly dark environment that poses risks for low-vision users and others with mobility impairments. The issue was reported last week but has not been addressed.",
    category="UNSAFE_ENVIRONMENT",
    priority="MEDIUM",
    status="ASSIGNED",
    source="officer_manual_entry",
    location_name="Block D Corridor",
    created_minutes_ago=240,
    assigned_to="Facilities Officer — Tom B.",
    reported_by="Student — Visual Impairment Support Group",
)
REQUESTS.append(r9)

# 10. LOW — Wheelchair ramp maintenance
r10 = base_request(
    title="Wheelchair ramp surface cracking and requires resurfacing — Block A",
    description="The wheelchair ramp at Block A entrance has developed cracks in the anti-slip surface coating. While not immediately dangerous, the surface degradation may become a hazard particularly in wet weather. Recommended for scheduled maintenance within 24 hours.",
    category="ACCESSIBILITY_EQUIPMENT_ISSUE",
    priority="LOW",
    status="NEW",
    source="officer_manual_entry",
    location_name="Block A Entrance",
    created_minutes_ago=360,
    reported_by="Facilities Inspector — John H.",
)
REQUESTS.append(r10)

# 11. LOW — Signage damage
r11 = base_request(
    title="Accessible route signage damaged and misleading near cafeteria",
    description="Two accessible route signs near the Student Canteen have been damaged — one is reversed and one has been removed. This may cause confusion for visitors unfamiliar with the campus layout who rely on signage for navigation.",
    category="FACILITY_ACCESS_ISSUE",
    priority="LOW",
    status="ASSIGNED",
    source="officer_manual_entry",
    location_name="Student Canteen",
    created_minutes_ago=480,
    assigned_to="Facilities Team",
    reported_by="Staff — Ms. Perera",
)
REQUESTS.append(r11)

# 12. COMPLETED — Elevator restored
r12 = base_request(
    title="Elevator voice guidance restored — Main Auditorium",
    description="Voice guidance system in the Main Auditorium elevator was reported as non-functional. The issue was identified as a software configuration reset. Facilities team has restored the audio system and tested with a screen reader user.",
    category="ACCESSIBILITY_EQUIPMENT_ISSUE",
    priority="HIGH",
    status="COMPLETED",
    source="officer_manual_entry",
    location_name="Main Auditorium",
    created_minutes_ago=1440,
    assigned_to="Facilities Officer — Sarah M.",
    reported_by="Student — Blind Students Association",
)
r12["notes"].append({
    "id": nid(), "text": "Audio guidance system restored and tested. Elevator operational. User confirmed accessibility.",
    "author": "Facilities Officer — Sarah M.", "timestamp": minutes_ago(1380),
})
r12["updatedAt"] = minutes_ago(1380)
REQUESTS.append(r12)

# 13. COMPLETED — Fire exit cleared
r13 = base_request(
    title="Accessible fire exit pathway cleared — Sports Complex",
    description="The accessible fire exit route at Sports Complex was obstructed by sports equipment. Emergency routes must be kept clear at all times per accessibility regulations. Equipment has been relocated.",
    category="PHYSICAL_OBSTRUCTION",
    priority="CRITICAL",
    status="COMPLETED",
    source="officer_manual_entry",
    location_name="Sports Complex",
    created_minutes_ago=2880,
    assigned_to="Security Team",
    reported_by="Fire Safety Officer",
)
r13["notes"].append({
    "id": nid(), "text": "All sports equipment cleared from fire exit pathway. Route tested and confirmed accessible. Fire Safety Officer notified.",
    "author": "Security Duty Officer", "timestamp": minutes_ago(2820),
})
r13["updatedAt"] = minutes_ago(2820)
REQUESTS.append(r13)

# ── Write files ────────────────────────────────────────────────────────────────
if CLEAR:
    existing_requests = []
    existing_alerts = []
    print("♻️  Clearing existing data…")
else:
    existing_requests = json.loads(REQUESTS_FILE.read_text()) if REQUESTS_FILE.exists() else []
    existing_alerts   = json.loads(ALERTS_FILE.read_text()) if ALERTS_FILE.exists() else []

existing_requests.extend(REQUESTS)
existing_alerts.extend(ALERTS)

REQUESTS_FILE.write_text(json.dumps(existing_requests, indent=2, ensure_ascii=False))
ALERTS_FILE.write_text(json.dumps(existing_alerts, indent=2, ensure_ascii=False))

print(f"✅  Seeded {len(REQUESTS)} requests and {len(ALERTS)} alerts")
print(f"   Priorities: CRITICAL={sum(1 for r in REQUESTS if r['priority']=='CRITICAL')}, HIGH={sum(1 for r in REQUESTS if r['priority']=='HIGH')}, MEDIUM={sum(1 for r in REQUESTS if r['priority']=='MEDIUM')}, LOW={sum(1 for r in REQUESTS if r['priority']=='LOW')}")
print(f"   Statuses:   NEW={sum(1 for r in REQUESTS if r['status']=='NEW')}, ASSIGNED={sum(1 for r in REQUESTS if r['status']=='ASSIGNED')}, IN_PROGRESS={sum(1 for r in REQUESTS if r['status']=='IN_PROGRESS')}, COMPLETED={sum(1 for r in REQUESTS if r['status']=='COMPLETED')}")
print(f"   Data files: {REQUESTS_FILE}, {ALERTS_FILE}")
