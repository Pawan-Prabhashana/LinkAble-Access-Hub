from fastapi import APIRouter
from app.schemas.chat import ChatIntakeRequest, ChatIntakeResponse
from app.services.chat import chat_service

router = APIRouter(prefix="/ai", tags=["Chat Intake"])


@router.post("/chat-intake", response_model=ChatIntakeResponse)
def chat_intake(req: ChatIntakeRequest) -> ChatIntakeResponse:
    """
    AI Chat Intake endpoint.

    Accepts a conversation (list of messages) and returns:
    - assistant reply
    - structured request draft (title, description, category, priority, location, tags)
    - missing fields list
    - readyToCreate flag
    - engine used (rules | llm)
    """
    return chat_service.process(req)
