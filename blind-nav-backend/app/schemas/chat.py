from __future__ import annotations
from typing import List, Optional
from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: str       # 'user' | 'assistant'
    content: str


class RequestDraft(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    location: Optional[str] = None
    source: str = "ai_chat_intake"
    tags: Optional[List[str]] = None
    aiSummary: Optional[str] = None
    confidence: float = 0.5
    reason: Optional[str] = None


class ChatIntakeRequest(BaseModel):
    messages: List[ChatMessage]
    currentDraft: Optional[RequestDraft] = None


class ChatIntakeResponse(BaseModel):
    reply: str
    draft: Optional[RequestDraft] = None
    missingFields: List[str] = []
    followUpQuestion: Optional[str] = None
    readyToCreate: bool = False
    engine: str = "rules"
    confidence: float = 0.5
