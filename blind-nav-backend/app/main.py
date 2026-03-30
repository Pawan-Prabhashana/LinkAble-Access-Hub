import asyncio
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.health import router as health_router
from app.routes.detect import router as detect_router
from app.routes.requests import router as requests_router
from app.routes.ai import router as ai_router
from app.routes.copilot import router as copilot_router
from app.routes.alerts import router as alerts_router
from app.routes.sla import router as sla_router, _run_sla_check
from app.routes.knowledge import router as knowledge_router
from app.routes.notifications import router as notifications_router
from app.routes.chat import router as chat_router


def _auto_seed_if_empty() -> None:
    """Seed demo data on startup if the requests store is empty."""
    try:
        from app.services.request_store import _load as _load_requests
        if len(_load_requests()) > 0:
            return
        seed_script = Path(__file__).parent.parent / "scripts" / "seed.py"
        if not seed_script.exists():
            return
        import subprocess, sys
        env = {**os.environ, "PYTHONPATH": str(Path(__file__).parent.parent)}
        result = subprocess.run(
            [sys.executable, str(seed_script), "--clear"],
            capture_output=True, text=True, env=env,
        )
        if result.returncode == 0:
            print("[Startup] Auto-seeded demo data ✓")
        else:
            print(f"[Startup] Seed script error: {result.stderr[:200]}")
    except Exception as exc:
        print(f"[Startup] Auto-seed skipped: {exc}")

# ── Background SLA checker ────────────────────────────────────────────────────
# Runs every 30 seconds in production, every 15 seconds in demo mode.

async def _sla_checker_loop() -> None:
    import os
    interval = 15 if os.getenv("DEMO_MODE", "false").lower() in ("true", "1", "yes") else 30
    while True:
        await asyncio.sleep(interval)
        try:
            _run_sla_check()
        except Exception as exc:
            print(f"[SLA checker] Error: {exc}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    _auto_seed_if_empty()
    task = asyncio.create_task(_sla_checker_loop())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="LinkAble Access Hub — Backend",
    version="6.0.0",
    description=(
        "AI-powered Smart Service Request Platform. "
        "AI analysis (Part 2) · GenAI copilot (Part 3) · "
        "Real-time SLA + alerts (Part 4) · "
        "RAG knowledge base, notifications, role views, map (Part 5) · "
        "AI Chat Intake (Part 6)."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(detect_router)
app.include_router(requests_router)
app.include_router(ai_router)
app.include_router(copilot_router)
app.include_router(alerts_router)
app.include_router(sla_router)
app.include_router(knowledge_router)
app.include_router(notifications_router)
app.include_router(chat_router)
