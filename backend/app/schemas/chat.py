from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class CitationItem(BaseModel):
    file_path: str
    start_line: int
    end_line: int
    score: float
    snippet: Optional[str] = None
    language: Optional[str] = None

class ChatSessionCreate(BaseModel):
    title: Optional[str] = "New Chat"

class ChatSessionResponse(BaseModel):
    id: str
    repo_id: str
    title: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ChatMessageResponse(BaseModel):
    id: str
    role: str
    content: str
    citations: List[CitationItem] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ChatQueryRequest(BaseModel):
    query: str
