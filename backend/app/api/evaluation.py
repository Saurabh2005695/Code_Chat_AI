from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User
from app.models.repository import Repository
from app.models.evaluation import EvaluationRun
from app.schemas.evaluation import EvaluationRunRequest, EvaluationRunResponse
from app.core.dependencies import get_current_user
from app.services.eval_service import EvalService

router = APIRouter(prefix="/repos/{repo_id}/eval", tags=["Evaluation & Benchmarks"])

@router.post("/run", response_model=EvaluationRunResponse, status_code=status.HTTP_201_CREATED)
async def run_evaluation_benchmark(
    repo_id: str,
    req: EvaluationRunRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    repo_res = await db.execute(select(Repository).where(Repository.id == repo_id, Repository.user_id == current_user.id))
    repo = repo_res.scalars().first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    if not req.test_cases:
        raise HTTPException(status_code=400, detail="Test cases list cannot be empty")

    results = await EvalService.run_evaluation(repo_id=repo.id, test_cases=req.test_cases, db=db)
    return results


@router.get("/history", response_model=List[EvaluationRunResponse])
async def get_evaluation_history(
    repo_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    repo_res = await db.execute(select(Repository).where(Repository.id == repo_id, Repository.user_id == current_user.id))
    repo = repo_res.scalars().first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    runs_res = await db.execute(
        select(EvaluationRun)
        .options(selectinload(EvaluationRun.results))
        .where(EvaluationRun.repo_id == repo_id)
        .order_by(EvaluationRun.created_at.desc())
    )
    return runs_res.scalars().all()
