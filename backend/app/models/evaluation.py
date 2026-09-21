import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class EvaluationRun(Base):
    __tablename__ = "evaluation_runs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    repo_id = Column(String(36), ForeignKey("repositories.id", ondelete="CASCADE"), nullable=False)
    precision_at_5 = Column(Float, default=0.0)
    mrr_score = Column(Float, default=0.0)
    avg_latency_ms = Column(Float, default=0.0)
    total_queries = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    repository = relationship("Repository", back_populates="evaluations")
    results = relationship("EvaluationResult", back_populates="run", cascade="all, delete-orphan")


class EvaluationResult(Base):
    __tablename__ = "evaluation_results"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    run_id = Column(String(36), ForeignKey("evaluation_runs.id", ondelete="CASCADE"), nullable=False)
    query = Column(String(512), nullable=False)
    expected_files = Column(JSON, default=list)
    retrieved_files = Column(JSON, default=list)
    is_hit = Column(Boolean, default=False)
    latency_ms = Column(Float, default=0.0)

    run = relationship("EvaluationRun", back_populates="results")
