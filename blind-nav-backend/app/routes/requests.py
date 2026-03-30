from fastapi import APIRouter, HTTPException
from app.schemas.request import IssueRequest, IssueRequestCreate, IssueRequestUpdate
from app.services import request_store

router = APIRouter(prefix="/requests", tags=["requests"])


@router.post("", response_model=IssueRequest, status_code=201)
def create_issue_request(body: IssueRequestCreate):
    try:
        return request_store.create_request(body)
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.get("", response_model=list[IssueRequest])
def list_issue_requests():
    try:
        return request_store.get_all_requests()
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))


@router.get("/{request_id}", response_model=IssueRequest)
def get_issue_request(request_id: str):
    record = request_store.get_request_by_id(request_id)
    if not record:
        raise HTTPException(status_code=404, detail="Request not found")
    return record


@router.patch("/{request_id}", response_model=IssueRequest)
def update_issue_request(request_id: str, body: IssueRequestUpdate):
    try:
        updated = request_store.update_request(request_id, body)
        if not updated:
            raise HTTPException(status_code=404, detail="Request not found")
        return updated
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.post("/{request_id}/analyze", response_model=IssueRequest)
def analyze_request(request_id: str):
    """Trigger (or re-trigger) AI analysis for an existing request."""
    record = request_store.get_request_by_id(request_id)
    if not record:
        raise HTTPException(status_code=404, detail="Request not found")
    try:
        from app.services.ai.analyzer import analyze as ai_analyze
        result = ai_analyze(
            text=record.description,
            title=record.title,
            location=record.location or "",
        )
        updated = request_store.update_ai_fields(request_id, result)
        if not updated:
            raise HTTPException(status_code=404, detail="Request not found")
        return updated
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/{request_id}/copilot", response_model=IssueRequest)
def generate_copilot_for_request(request_id: str):
    """
    Trigger (or re-trigger) copilot / agentic workflow for an existing request.
    Reads current AI fields from the record and runs the full copilot pipeline.
    Updates and returns the enriched IssueRequest.
    """
    record = request_store.get_request_by_id(request_id)
    if not record:
        raise HTTPException(status_code=404, detail="Request not found")
    try:
        from app.schemas.copilot import CopilotGenerateRequest
        from app.services.copilot.copilot_service import generate as copilot_gen

        copilot_req = CopilotGenerateRequest(
            title=record.title,
            description=record.description,
            transcript=record.transcript,
            aiCategory=record.aiCategory,
            aiPriority=record.aiPriority,
            aiSummary=record.aiSummary,
            location=record.location,
            currentStatus=record.status,
            source=record.source,
        )
        result = copilot_gen(copilot_req)
        updated = request_store.update_copilot_fields(request_id, result)
        if not updated:
            raise HTTPException(status_code=404, detail="Request not found")
        return updated
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
