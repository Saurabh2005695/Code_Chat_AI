import os
import shutil
import hashlib
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import settings
from app.database import get_db, AsyncSessionLocal
from app.models.user import User
from app.models.repository import Repository, RepoFile
from app.schemas.repository import (
    IndexGithubRequest,
    RepositoryResponse,
    RepoStatusResponse,
    FileTreeNode,
    FileContentResponse,
    ExplainSymbolRequest
)
from app.core.dependencies import get_current_user
from app.services.git_service import GitService
from app.services.parser_service import ParserService
from app.services.vector_service import VectorService
from app.services.bm25_service import BM25Service
from app.services.llm_provider import LLMProvider
from app.utils.file_filters import is_ignored_path, detect_language, is_binary_file

router = APIRouter(prefix="/repos", tags=["Repositories"])

# In-memory progress tracker for real-time status polling
indexing_progress = {}

async def process_repository_indexing(repo_id: str):
    """Background worker for cloning/scanning, AST chunking, and embedding generation"""
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Repository).where(Repository.id == repo_id))
        repo = result.scalars().first()
        if not repo:
            return

        try:
            indexing_progress[repo_id] = {"status": "indexing", "progress": 10, "step": "Setting up directory..."}
            repo.status = "indexing"
            await db.commit()

            # Step 1: Clone or extract
            if repo.source_type == "github":
                indexing_progress[repo_id] = {"status": "indexing", "progress": 25, "step": "Cloning repository from GitHub..."}
                success, msg = GitService.clone_repository(repo.source_url, repo.storage_path, repo.default_branch)
                if not success:
                    raise Exception(msg)
            
            # Step 2: Scan files and filter
            indexing_progress[repo_id] = {"status": "indexing", "progress": 45, "step": "Scanning and parsing codebase..."}
            
            all_chunks = []
            file_records = []
            
            for root, dirs, files in os.walk(repo.storage_path):
                # Filter out ignored directories
                dirs[:] = [d for d in dirs if not is_ignored_path(d)]
                
                for file_name in files:
                    full_path = os.path.join(root, file_name)
                    rel_path = os.path.relpath(full_path, repo.storage_path).replace("\\", "/")

                    if is_ignored_path(rel_path) or is_binary_file(full_path):
                        continue

                    try:
                        with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                            content = f.read()

                        if not content.strip():
                            continue

                        lang = detect_language(rel_path)
                        lines = content.splitlines()
                        file_hash = hashlib.md5(content.encode("utf-8")).hexdigest()
                        imports = ParserService.extract_imports(content, lang)

                        # Chunk file
                        chunks = ParserService.chunk_file(full_path, content, rel_path)
                        all_chunks.extend(chunks)

                        file_records.append(RepoFile(
                            repo_id=repo.id,
                            file_path=rel_path,
                            language=lang,
                            line_count=len(lines),
                            size_bytes=len(content.encode("utf-8")),
                            file_hash=file_hash,
                            imports=imports
                        ))
                    except Exception:
                        continue

            # Step 3: Insert file metadata
            indexing_progress[repo_id] = {"status": "indexing", "progress": 70, "step": "Storing metadata and files..."}
            
            # Remove old file records if reindexing
            old_files = await db.execute(select(RepoFile).where(RepoFile.repo_id == repo.id))
            for f in old_files.scalars().all():
                await db.delete(f)
            
            for f_rec in file_records:
                db.add(f_rec)

            # Step 4: Generate dense embeddings & BM25 index
            indexing_progress[repo_id] = {"status": "indexing", "progress": 85, "step": f"Generating vector embeddings for {len(all_chunks)} chunks..."}
            
            vector_service = VectorService()
            vector_service.index_chunks(repo.id, all_chunks)
            BM25Service.index_chunks(repo.id, all_chunks)

            # Update repository state
            repo.status = "ready"
            repo.total_files = len(file_records)
            repo.total_chunks = len(all_chunks)
            repo.last_indexed_at = datetime.utcnow()
            repo.error_message = None
            await db.commit()

            indexing_progress[repo_id] = {"status": "ready", "progress": 100, "step": "Repository ready for chat!"}

        except Exception as e:
            repo.status = "failed"
            repo.error_message = str(e)
            await db.commit()
            indexing_progress[repo_id] = {"status": "failed", "progress": 0, "step": f"Failed: {str(e)}"}


@router.get("", response_model=List[RepositoryResponse])
async def list_repositories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Repository).where(Repository.user_id == current_user.id).order_by(Repository.created_at.desc()))
    return result.scalars().all()


@router.post("/index-github", response_model=RepositoryResponse, status_code=status.HTTP_202_ACCEPTED)
async def index_github_repo(
    req: IndexGithubRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Extract repo name from URL
    clean_url = req.github_url.strip().rstrip("/")
    repo_name = clean_url.split("/")[-1].replace(".git", "")
    if not repo_name:
        repo_name = "github-repo"

    storage_path = os.path.join(settings.STORAGE_DIR, f"{current_user.id}_{repo_name}")

    repo = Repository(
        user_id=current_user.id,
        name=repo_name,
        source_type="github",
        source_url=clean_url,
        storage_path=storage_path,
        default_branch=req.branch or "main",
        status="pending"
    )
    db.add(repo)
    await db.commit()
    await db.refresh(repo)

    background_tasks.add_task(process_repository_indexing, repo.id)
    return repo


@router.post("/upload-zip", response_model=RepositoryResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_zip_repo(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only .zip files are supported")

    repo_name = os.path.splitext(file.filename)[0]
    temp_zip_path = os.path.join(settings.STORAGE_DIR, f"temp_{current_user.id}_{file.filename}")
    storage_path = os.path.join(settings.STORAGE_DIR, f"{current_user.id}_{repo_name}")

    try:
        with open(temp_zip_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        success, msg = GitService.extract_zip(temp_zip_path, storage_path)
        if not success:
            raise HTTPException(status_code=400, detail=msg)
    finally:
        if os.path.exists(temp_zip_path):
            os.remove(temp_zip_path)

    repo = Repository(
        user_id=current_user.id,
        name=repo_name,
        source_type="zip",
        source_url=None,
        storage_path=storage_path,
        status="pending"
    )
    db.add(repo)
    await db.commit()
    await db.refresh(repo)

    background_tasks.add_task(process_repository_indexing, repo.id)
    return repo


@router.get("/{repo_id}/status", response_model=RepoStatusResponse)
async def get_repo_status(
    repo_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Repository).where(Repository.id == repo_id, Repository.user_id == current_user.id))
    repo = result.scalars().first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    prog = indexing_progress.get(repo_id, {
        "status": repo.status,
        "progress": 100 if repo.status == "ready" else (0 if repo.status == "failed" else 50),
        "step": "Ready" if repo.status == "ready" else repo.status
    })

    return {
        "id": repo.id,
        "status": repo.status,
        "progress_percentage": prog.get("progress", 0),
        "current_step": prog.get("step", ""),
        "error_message": repo.error_message
    }


@router.post("/{repo_id}/reindex")
async def reindex_repository(
    repo_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Repository).where(Repository.id == repo_id, Repository.user_id == current_user.id))
    repo = result.scalars().first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    background_tasks.add_task(process_repository_indexing, repo.id)
    return {"message": "Re-indexing started in background"}


@router.get("/{repo_id}/tree", response_model=List[FileTreeNode])
async def get_file_tree(
    repo_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Repository).where(Repository.id == repo_id, Repository.user_id == current_user.id))
    repo = result.scalars().first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    files_res = await db.execute(select(RepoFile).where(RepoFile.repo_id == repo.id).order_by(RepoFile.file_path))
    files = files_res.scalars().all()

    tree_nodes = []
    for f in files:
        tree_nodes.append({
            "path": f.file_path,
            "name": os.path.basename(f.file_path),
            "type": "file",
            "size_bytes": f.size_bytes,
            "language": f.language
        })

    return tree_nodes


@router.get("/{repo_id}/file", response_model=FileContentResponse)
async def get_file_content(
    repo_id: str,
    path: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Repository).where(Repository.id == repo_id, Repository.user_id == current_user.id))
    repo = result.scalars().first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    # Prevent path traversal
    normalized_path = os.path.normpath(path).lstrip("/\\")
    full_path = os.path.abspath(os.path.join(repo.storage_path, normalized_path))
    repo_storage_abs = os.path.abspath(repo.storage_path)

    if not full_path.startswith(repo_storage_abs) or not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="File not found")

    try:
        with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()

        lang = detect_language(normalized_path)
        return {
            "path": normalized_path,
            "content": content,
            "language": lang,
            "line_count": len(content.splitlines())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read file: {str(e)}")


@router.post("/{repo_id}/explain-symbol")
async def explain_symbol(
    repo_id: str,
    req: ExplainSymbolRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Repository).where(Repository.id == repo_id, Repository.user_id == current_user.id))
    repo = result.scalars().first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    snippet = req.code_snippet
    start_line = req.start_line or 1
    end_line = req.end_line or 1

    # If code snippet not provided, read lines directly from disk
    if not snippet or not snippet.strip():
        normalized_path = os.path.normpath(req.file_path).lstrip("/\\")
        full_path = os.path.abspath(os.path.join(repo.storage_path, normalized_path))
        repo_storage_abs = os.path.abspath(repo.storage_path)
        if full_path.startswith(repo_storage_abs) and os.path.exists(full_path):
            try:
                with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                    file_lines = f.readlines()
                    end_line = req.end_line or len(file_lines)
                    s_idx = max(0, start_line - 1)
                    e_idx = min(len(file_lines), end_line)
                    snippet = "".join(file_lines[s_idx:e_idx])
            except Exception:
                pass

    if not snippet or not snippet.strip():
        snippet = "# [File content or line selection empty]"

    prompt = (
        f"Explain the following code snippet from `{req.file_path}` (Lines {start_line}-{end_line}) "
        f"clearly and concisely for a developer. Detail what it accomplishes, its inputs, outputs, and any important edge cases:\n\n"
        f"```\n{snippet}\n```"
    )

    explanation = ""
    async for token in LLMProvider.stream_completion(prompt=prompt, system_prompt="You are an expert code analyst."):
        explanation += token

    return {"explanation": explanation}


@router.delete("/{repo_id}")
async def delete_repository(
    repo_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Repository).where(Repository.id == repo_id, Repository.user_id == current_user.id))
    repo = result.scalars().first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")

    # Clean disk files
    if os.path.exists(repo.storage_path):
        try:
            shutil.rmtree(repo.storage_path)
        except Exception:
            pass

    # Clean vector store and BM25
    VectorService().delete_collection(repo.id)
    BM25Service.delete_index(repo.id)

    await db.delete(repo)
    await db.commit()
    return {"message": "Repository and indexed vectors deleted successfully"}
