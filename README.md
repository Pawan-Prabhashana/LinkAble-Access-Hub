# LinkAble Access Hub

**AI-powered Smart Service Request Platform for Accessibility**  
A full-stack hackathon project providing intelligent operational tools for managing and resolving accessibility barriers for blind and low-vision users.

---

## Project Architecture

```
blind-nav-fullstack-package/
├── blind-nav-backend/      # FastAPI Python backend
├── blind-nav-web/          # Next.js 14 web dashboard
└── blind-nav-frontend/     # React Native / Expo mobile app
```

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- (Optional) OpenAI API key for LLM features

---

### 1. Backend

```bash
cd blind-nav-backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env — set OPENAI_API_KEY if you want LLM features, set DEMO_MODE=true for short SLA windows

# (Optional) Seed demo data
python scripts/seed.py --clear

# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at: **http://localhost:8000**  
API docs: **http://localhost:8000/docs**

---

### 2. Web Dashboard

```bash
cd blind-nav-web
npm install

# Copy and configure environment
cp .env.local.example .env.local
# Edit .env.local — set NEXT_PUBLIC_API_URL to your backend URL

# Development
npm run dev         # Starts at http://localhost:3000

# Production build
npm run build && npm start
```

Dashboard runs at: **http://localhost:3000**

---

### 3. Mobile App

```bash
cd blind-nav-frontend
npm install
npx expo start --tunnel
```

Scan the QR code with Expo Go (iOS/Android).

---

## Environment Variables

### Backend (`blind-nav-backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | *(empty)* | OpenAI API key — enables LLM analysis and copilot. Without this, the rules-based engine handles all AI. |
| `DEMO_MODE` | `false` | Set to `true` for short SLA windows (CRITICAL=2min, HIGH=5min) — perfect for live demos |

### Web Dashboard (`blind-nav-web/.env.local`)

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://192.168.8.141:8000` | Backend API URL |

---

## Platform Features

### Part 1 — Service Request Management
- Request lifecycle: NEW → ASSIGNED → IN_PROGRESS → COMPLETED
- Dashboard with stats and recent requests
- Manual intake form for officers
- Request detail view with notes and history

### Part 2 — AI Analysis Pipeline
- **Layer A (Rules Classifier):** Deterministic keyword scoring — works offline, always
- **Layer B (LLM Analyzer):** OpenAI-powered analysis with structured JSON output
- Predictions: priority, category, AI summary, tags, confidence, reasoning

### Part 3 — GenAI Copilot & Agentic Workflow
- Operational copilot recommendations per request
- Suggested resolution steps, team assignment, escalation rationale
- Draft internal note generation
- Operator-in-the-loop — recommendations, not automated actions

### Part 4 — Real-time SLA & Alerts
- SLA tracking per request (configurable windows by priority)
- Auto-escalation logic (TEAM_LEAD → OPERATIONS_MANAGER → EMERGENCY_RESPONSE)
- Alert generation: CRITICAL_REQUEST_CREATED, SLA_AT_RISK, SLA_BREACHED, ESCALATION_TRIGGERED
- Background SLA checker (runs every 30s / 15s in demo mode)
- Alert Centre page with filter tabs

### Part 5 — Advanced Intelligence & Operations
- **RAG-lite Knowledge Base:** 12 accessibility SOPs, keyword retrieval, shown as "Relevant Guidance" in request details
- **Notification Simulation:** Multi-channel (Email/SMS/In-App/Push) simulated notifications per alert
- **Role-based Views:** 5 officer roles, switch via sidebar, localStorage-persisted
- **Map View:** Interactive Leaflet map with request markers, priority color coding, filter by status/priority
- **AI Draft Assistant:** Paste raw issue text → AI auto-fills title, description, category, priority
- **Demo Seed Data:** 13 realistic accessibility requests with varied SLA states, escalations, completions

---

## Demo Script (Hackathon)

### Setup (2 minutes)
1. Start backend with `DEMO_MODE=true` (2-minute SLA windows)
2. Run `python scripts/seed.py --clear` to load 13 demo requests
3. Start web dashboard
4. Navigate to **http://localhost:3000**

### Demo flow

**Dashboard:** Show 8 operational cards (active, at-risk, breached, escalated, critical). Live alert feed auto-updates every 10 seconds.

**Map View:** Navigate to `/map` — show 13 requests plotted on campus map. Click a CRITICAL marker to see the popup. Filter by priority.

**AI Draft Assistant:** Go to New Request → paste raw text → click "Draft from Text" → watch AI classify and fill the form in real time.

**Request Detail:** Open any request → show: SLA badge with countdown, Relevant Guidance (RAG), AI Insights panel, GenAI Copilot panel with resolution steps.

**Alerts:** Navigate to Alerts Centre → show CRITICAL/HIGH alerts with "View Request" links.

**Notifications:** Navigate to Notification Centre → show simulated Email/SMS/In-App notifications auto-generated by the alert system.

**Role Switching:** Click role selector in sidebar → switch to "Facilities Officer" → dashboard shows facilities-relevant context.

---

## API Reference

| Endpoint | Description |
|----------|-------------|
| `GET /requests` | List all requests (with live SLA computation) |
| `POST /requests` | Create request (AI analysis + copilot + SLA auto-triggered) |
| `PATCH /requests/{id}` | Update request status/assignee/notes |
| `POST /requests/{id}/analyze` | Re-run AI analysis |
| `POST /requests/{id}/copilot` | Re-run copilot generation |
| `GET /alerts` | List alerts |
| `POST /alerts/read-all` | Mark all alerts read |
| `POST /sla/refresh` | Trigger SLA recalculation |
| `GET /sla/stats` | Aggregate SLA statistics |
| `GET /knowledge/search?q=...&category=...` | RAG knowledge retrieval |
| `GET /knowledge/request/{id}` | Guidance for a specific request |
| `GET /notifications` | Simulated notification log |
| `POST /notifications/{id}/send` | Simulate sending a notification |
| `GET /health` | Health check |
| `GET /docs` | Interactive Swagger UI |

---

## Deployment

### Render (Backend)
1. New Web Service → connect repo
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables: `OPENAI_API_KEY`, `DEMO_MODE`

### Vercel (Frontend)
1. Import repo to Vercel
2. Root directory: `blind-nav-web`
3. Set `NEXT_PUBLIC_API_URL` to deployed backend URL
4. Deploy

### Local Network Demo
- Set `NEXT_PUBLIC_API_URL=http://<your-local-ip>:8000` in `.env.local`
- Mobile app: update `API_BASE_URL` in `blind-nav-frontend/src/services/api.ts`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native + Expo, TypeScript, expo-speech-recognition |
| Backend | FastAPI, Python 3.10+, Pydantic, Uvicorn |
| AI Analysis | OpenAI API (optional) + deterministic rules classifier |
| Web Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Map | React Leaflet + OpenStreetMap |
| Storage | JSON file store (production: swap for PostgreSQL) |
| Real-time | Smart polling (10s interval) |

---

## Team

Built for accessibility · Powered by AI · Designed for inclusion

**LinkAble Access Hub** — Hackathon 2026
