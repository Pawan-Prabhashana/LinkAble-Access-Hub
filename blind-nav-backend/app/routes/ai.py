from fastapi import APIRouter, HTTPException
from app.schemas.ai import AIAnalyzeRequest, AIAnalysisResult
from app.services.ai.analyzer import analyze

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/analyze", response_model=AIAnalysisResult)
def analyze_text(body: AIAnalyzeRequest):
    """
    Standalone AI analysis endpoint.
    Accepts arbitrary text and returns predicted priority, category,
    summary, tags, confidence, and reasoning.

    Useful for:
    - Demo / testing the AI pipeline
    - Client-side preview before submitting a request
    """
    if not body.text.strip():
        raise HTTPException(status_code=422, detail="text must not be empty")
    try:
        return analyze(
            text=body.text,
            title=body.title or "",
            location=body.location or "",
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
