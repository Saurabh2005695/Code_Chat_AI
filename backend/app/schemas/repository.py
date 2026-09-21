from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class IndexGithubRequest(BaseModel):
    github_url: str
    branch: Optional[str] = "main"

class RepositoryResponse(BaseModel):
    id: str
    name: str
    source_type: str
    source_url: Optional[str] = None
    default_branch: str
    status: str
    error_message: Optional[str] = None
    total_files: int
    total_chunks: int
    last_indexed_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class RepoStatusResponse(BaseModel):
    id: str
    status: str
    progress_percentage: int
    current_step: str
    error_message: Optional[str] = None

class FileTreeNode(BaseModel):
    path: str
    name: str
    type: str  # 'file' or 'directory'
    size_bytes: Optional[int] = 0
    language: Optional[str] = None

class FileContentResponse(BaseModel):
    path: str
    content: str
    language: str
    line_count: int

class ExplainSymbolRequest(BaseModel):
    file_path: str
    start_line: int
    end_line: int
    code_snippet: Optional[str] = None
