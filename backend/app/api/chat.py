from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db, AsyncSessionLocal
from app.models.user import User
from app.models.repository import Repository
from app.models.chat import ChatSession, ChatMessage
from app.schemas.chat import (
    ChatSessionCreate,
    ChatSessionResponse,
    ChatMessageResponse,
    ChatQueryRequest
)
from app.core.dependencies import get_current_user
from app.services.rag_service import RAGService

router = APIRouter(prefix="/chat", tags=["Chat & RAG"])

@router.get("/{repo_id}/sessions", response_model=List[ChatSessionResponse])
async def list_sessions(
    repo_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.repo_id == repo_id, ChatSession.user_id == current_user.id)
        .order_by(ChatSession.updated_at.desc())
    )
    return result.scalars().all()


@router.post("/{repo_id}/sessions", response_model=ChatSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    repo_id: str,
    body: ChatSessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify repo ownership
    repo_res = await db.execute(select(Repository).where(Repository.id == repo_id, Repository.user_id == current_user.id))
    if not repo_res.scalars().first():
        raise HTTPException(status_code=404, detail="Repository not found")

    session = ChatSession(
        repo_id=repo_id,
        user_id=current_user.id,
        title=body.title or "New Chat"
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


@router.get("/sessions/{session_id}/messages", response_model=List[ChatMessageResponse])
async def get_session_messages(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    session_res = await db.execute(select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == current_user.id))
    session = session_res.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    msg_res = await db.execute(select(ChatMessage).where(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.asc()))
    return msg_res.scalars().all()


@router.post("/sessions/{session_id}/stream")
async def stream_chat(
    session_id: str,
    req: ChatQueryRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify session ownership
    session_res = await db.execute(select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == current_user.id))
    session = session_res.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    # If this is the first message and title is default, update session title from user query
    if session.title == "New Chat":
        session.title = req.query[:40] + ("..." if len(req.query) > 40 else "")
        await db.commit()

    # Save user message to database
    user_msg = ChatMessage(session_id=session.id, role="user", content=req.query, citations=[])
    db.add(user_msg)
    await db.commit()

    rag_service = RAGService()

    async def sse_event_generator():
        async with AsyncSessionLocal() as session_db:
            async for sse_chunk in rag_service.stream_rag_response(
                repo_id=session.repo_id,
                session_id=session.id,
                query=req.query,
                db=session_db
            ):
                yield sse_chunk

    return StreamingResponse(
        sse_event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    session_res = await db.execute(select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == current_user.id))
    session = session_res.scalars().first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    # Delete related chat messages first
    msg_res = await db.execute(select(ChatMessage).where(ChatMessage.session_id == session_id))
    messages = msg_res.scalars().all()
    for m in messages:
        await db.delete(m)

    await db.delete(session)
    await db.commit()
    return {"message": "Chat session deleted successfully"}

