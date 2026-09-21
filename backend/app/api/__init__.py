from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.repositories import router as repo_router
from app.api.chat import router as chat_router
from app.api.graph import router as graph_router
from app.api.evaluation import router as eval_router

api_router = APIRouter(prefix="/api")

api_router.include_router(auth_router)
api_router.include_router(repo_router)
api_router.include_router(chat_router)
api_router.include_router(graph_router)
api_router.include_router(eval_router)

__all__ = ["api_router"]
