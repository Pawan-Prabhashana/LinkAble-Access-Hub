from fastapi import APIRouter, HTTPException
from app.schemas.copilot import CopilotGenerateRequest, CopilotResult
from app.services.copilot.copilot_service import generate as copilot_generate

router = APIRouter(prefix="/copilot", tags=["copilot"])


@router.post("/generate", response_model=CopilotResult)
def generate_copilot(body: CopilotGenerateRequest):
    """
    Standalone copilot generation endpoint.

    Accepts request fields + AI analysis results and returns a full
    CopilotResult with operational guidance, team recommendation,
    escalation decision, and decision trace.

    Useful for:
    - Live preview while an officer is creating a new request
    - Demo / testing the copilot pipeline in isolation
    """
    if not body.title.strip() and not body.description.strip():
        raise HTTPException(status_code=422, detail="title or description must not be empty")
    try:
        return copilot_generate(body)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
