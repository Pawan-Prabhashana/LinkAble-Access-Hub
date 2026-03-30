from fastapi import APIRouter, Query
from typing import Optional
from app.services.rag_service import retrieve, _load

router = APIRouter(prefix="/knowledge", tags=["knowledge"])


@router.get("/search")
def search_knowledge(
    q: str = Query("", description="Free-text query"),
    category: Optional[str] = Query(None, description="AI category to filter by"),
    priority: Optional[str] = Query(None),
    top_k: int = Query(3, ge=1, le=6),
):
    """
    RAG-lite knowledge retrieval.
    Returns the most relevant SOPs and procedural guidance for the given context.
    """
    return retrieve(query=q, category=category, priority=priority, top_k=top_k)


@router.get("/request/{request_id}")
def knowledge_for_request(request_id: str):
    """Retrieve relevant guidance for an existing request."""
    from app.services.request_store import get_request_by_id
    req = get_request_by_id(request_id)
    if not req:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Request not found")
    from app.services.rag_service import retrieve_for_request
    return retrieve_for_request(req)


@router.get("/all")
def list_all():
    """Return all knowledge-base articles (for debugging / admin)."""
    return _load()
