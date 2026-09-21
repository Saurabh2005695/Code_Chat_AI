import time
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.evaluation import EvaluationRun, EvaluationResult
from app.services.rag_service import RAGService
from app.schemas.evaluation import TestCase

class EvalService:
    @staticmethod
    async def run_evaluation(
        repo_id: str,
        test_cases: List[TestCase],
        db: AsyncSession
    ) -> Dict[str, Any]:
        """Evaluates hybrid retrieval precision@5, MRR, and response latency"""
        rag_service = RAGService()
        
        total_queries = len(test_cases)
        hits = 0
        reciprocal_ranks = []
        latencies = []
        detailed_results = []

        for tc in test_cases:
            start_time = time.perf_counter()
            retrieved_chunks = rag_service.hybrid_search(repo_id, tc.query, top_k=5)
            latency_ms = (time.perf_counter() - start_time) * 1000
            latencies.append(latency_ms)

            retrieved_files = [c["file_path"] for c in retrieved_chunks]
            
            # Check if any expected file was retrieved in top 5
            is_hit = False
            first_rank = None
            for idx, r_file in enumerate(retrieved_files):
                for exp_file in tc.expected_files:
                    if exp_file.lower() in r_file.lower() or r_file.lower() in exp_file.lower():
                        is_hit = True
                        if first_rank is None:
                            first_rank = idx + 1
                        break

            if is_hit:
                hits += 1
                reciprocal_ranks.append(1.0 / first_rank if first_rank else 0.0)
            else:
                reciprocal_ranks.append(0.0)

            detailed_results.append({
                "query": tc.query,
                "expected_files": tc.expected_files,
                "retrieved_files": retrieved_files,
                "is_hit": is_hit,
                "latency_ms": round(latency_ms, 2)
            })

        precision_at_5 = (hits / total_queries) if total_queries > 0 else 0.0
        mrr_score = (sum(reciprocal_ranks) / total_queries) if total_queries > 0 else 0.0
        avg_latency_ms = (sum(latencies) / total_queries) if total_queries > 0 else 0.0

        # Save run and results to database
        run = EvaluationRun(
            repo_id=repo_id,
            precision_at_5=round(precision_at_5, 4),
            mrr_score=round(mrr_score, 4),
            avg_latency_ms=round(avg_latency_ms, 2),
            total_queries=total_queries
        )
        db.add(run)
        await db.flush()

        for item in detailed_results:
            res_entry = EvaluationResult(
                run_id=run.id,
                query=item["query"],
                expected_files=item["expected_files"],
                retrieved_files=item["retrieved_files"],
                is_hit=item["is_hit"],
                latency_ms=item["latency_ms"]
            )
            db.add(res_entry)

        await db.commit()

        return {
            "id": run.id,
            "repo_id": repo_id,
            "precision_at_5": precision_at_5,
            "mrr_score": mrr_score,
            "avg_latency_ms": avg_latency_ms,
            "total_queries": total_queries,
            "created_at": run.created_at,
            "results": detailed_results
        }
