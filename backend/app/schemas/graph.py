from typing import List, Optional
from pydantic import BaseModel

class GraphNode(BaseModel):
    id: str
    label: str
    language: Optional[str] = "unknown"
    line_count: int = 0
    type: str = "file"  # file or module

class GraphEdge(BaseModel):
    source: str
    target: str
    type: str = "imports"

class DependencyGraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]

class GenerateReadmeResponse(BaseModel):
    readme_markdown: str
    onboarding_guide: str
