import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Repository(Base):
    __tablename__ = "repositories"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    source_type = Column(String(50), nullable=False)  # 'github' or 'zip'
    source_url = Column(String(512), nullable=True)
    storage_path = Column(String(512), nullable=False)
    default_branch = Column(String(100), default="main")
    status = Column(String(50), default="pending")  # pending, indexing, ready, failed
    error_message = Column(Text, nullable=True)
    total_files = Column(Integer, default=0)
    total_chunks = Column(Integer, default=0)
    last_indexed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="repositories")
    files = relationship("RepoFile", back_populates="repository", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="repository", cascade="all, delete-orphan")
    evaluations = relationship("EvaluationRun", back_populates="repository", cascade="all, delete-orphan")


class RepoFile(Base):
    __tablename__ = "repo_files"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    repo_id = Column(String(36), ForeignKey("repositories.id", ondelete="CASCADE"), nullable=False)
    file_path = Column(String(512), nullable=False, index=True)
    language = Column(String(50), nullable=True)
    line_count = Column(Integer, default=0)
    size_bytes = Column(Integer, default=0)
    file_hash = Column(String(64), nullable=True)
    imports = Column(JSON, default=list)  # list of imported paths/modules

    repository = relationship("Repository", back_populates="files")
