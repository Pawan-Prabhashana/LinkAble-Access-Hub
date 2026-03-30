from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.health import router as health_router
from app.routes.detect import router as detect_router
from app.routes.requests import router as requests_router
from app.routes.ai import router as ai_router
from app.routes.copilot import router as copilot_router

app = FastAPI(
    title="LinkAble Access Hub — Backend",
    version="3.0.0",
    description=(
        "AI-powered Smart Service Request Platform for accessibility support. "
        "Includes AI analysis pipeline (Part 2) and GenAI copilot / agentic workflow (Part 3)."
    ),
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
