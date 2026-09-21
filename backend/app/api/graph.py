from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.repository import Repository
from app.schemas.graph import DependencyGraphResponse, GenerateReadmeResponse
from app.core.dependencies import get_current_user
from app.services.graph_service import GraphService

router = APIRouter(prefix="/repos/{repo_id}", tags=["Dependency Graph & Auto-Docs"])

@router.get("/graph", response_model=DependencyGraphResponse)
async def get_dependency_graph(
    repo_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    repo_res = await db.execute(select(Repository).where(Repository.id == repo_id, Repository.user_id == current_user.id))
    repo = repo_res.scalars().first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    graph_data = await GraphService.build_dependency_graph(repo.id, db)
    return graph_data


@router.post("/generate-readme", response_model=GenerateReadmeResponse)
async def generate_readme(
    repo_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    repo_res = await db.execute(select(Repository).where(Repository.id == repo_id, Repository.user_id == current_user.id))
    repo = repo_res.scalars().first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    docs = await GraphService.generate_readme_and_onboarding(repo, db)
    return docs
