from pydantic import BaseModel
from typing import Optional, List


class AIAnalyzeRequest(BaseModel):
    text: str
    title: Optional[str] = None
    location: Optional[str] = None


class AIAnalysisResult(BaseModel):
    predictedPriority: str                   # CRITICAL | HIGH | MEDIUM | LOW
    predictedCategory: str                   # AI taxonomy (see enums)
    aiSummary: str                           # One-line clean summary
    tags: List[str] = []                     # e.g. ['walkway', 'lift', 'emergency']
    confidence: float = 0.5                  # 0.0 – 1.0
    reason: str = ""                         # Brief plain-English reasoning
    engine: str = "rules"                    # 'rules' | 'llm' | 'none'
