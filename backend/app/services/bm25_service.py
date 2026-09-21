import re
from typing import List, Dict, Any
from rank_bm25 import BM25Okapi

class BM25Service:
    _indexes: Dict[str, BM25Okapi] = {}
    _chunks_map: Dict[str, List[Dict[str, Any]]] = {}

    @staticmethod
    def tokenize(text: str) -> List[str]:
        """Custom code tokenizer splitting by camelCase, snake_case, and non-alphanumeric"""
        # Split camelCase and snake_case
        s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', text)
        s2 = re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()
        tokens = re.findall(r'[a-zA-Z0-9_]+', s2)
        return [token for token in tokens if len(token) > 1]

    @classmethod
    def index_chunks(cls, repo_id: str, chunks: List[Dict[str, Any]]):
        """Builds an in-memory BM25 index for the repository"""
        if not chunks:
            return
        
        tokenized_corpus = [cls.tokenize(chunk["content"]) for chunk in chunks]
        cls._indexes[repo_id] = BM25Okapi(tokenized_corpus)
        cls._chunks_map[repo_id] = chunks

    @classmethod
    def search(cls, repo_id: str, query: str, top_k: int = 10) -> List[Dict[str, Any]]:
        """Searches BM25 index using code-aware tokenization"""
        if repo_id not in cls._indexes or repo_id not in cls._chunks_map:
            return []

        bm25 = cls._indexes[repo_id]
        chunks = cls._chunks_map[repo_id]

        tokenized_query = cls.tokenize(query)
        if not tokenized_query:
            return []

        doc_scores = bm25.get_scores(tokenized_query)
        top_indices = sorted(range(len(doc_scores)), key=lambda i: doc_scores[i], reverse=True)[:top_k]

        results = []
        max_score = max(doc_scores) if len(doc_scores) > 0 and max(doc_scores) > 0 else 1.0
        
        for idx in top_indices:
            score = doc_scores[idx]
            if score > 0:
                chunk = chunks[idx]
                results.append({
                    "id": f"{chunk['file_path']}#L{chunk['start_line']}-L{chunk['end_line']}",
                    "content": chunk["content"],
                    "file_path": chunk["file_path"],
                    "start_line": chunk["start_line"],
                    "end_line": chunk["end_line"],
                    "symbol_name": chunk.get("symbol_name", ""),
                    "language": chunk.get("language", "text"),
                    "score": float(score / max_score)
                })

        return results

    @classmethod
    def delete_index(cls, repo_id: str):
        if repo_id in cls._indexes:
            del cls._indexes[repo_id]
        if repo_id in cls._chunks_map:
            del cls._chunks_map[repo_id]
