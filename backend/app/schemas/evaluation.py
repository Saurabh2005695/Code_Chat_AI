from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class TestCase(BaseModel):
    query: str
    expected_files: List[str]

class EvaluationRunRequest(BaseModel):
    test_cases: List[TestCase]

class EvaluationResultItem(BaseModel):
    query: str
    expected_files: List[str]
    retrieved_files: List[str]
    is_hit: bool
    latency_ms: float

class EvaluationRunResponse(BaseModel):
    id: str
    repo_id: str
    precision_at_5: float
    mrr_score: float
    avg_latency_ms: float
    total_queries: int
    created_at: datetime
    results: List[EvaluationResultItem] = []

    model_config = ConfigDict(from_attributes=True)
