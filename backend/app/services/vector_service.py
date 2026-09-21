import os
import gc
import httpx
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings as ChromaSettings
from app.config import settings

class VectorService:
    _instance = None
    _embedder = None
    _client = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(VectorService, cls).__new__(cls)
            cls._client = chromadb.PersistentClient(
                path=settings.CHROMA_PERSIST_DIR,
                settings=ChromaSettings(anonymized_telemetry=False)
            )
        return cls._instance

    @classmethod
    def _get_local_embedder(cls):
        """Lazy loads SentenceTransformer with single-thread and memory safety"""
        if cls._embedder is None:
            try:
                import torch
                torch.set_num_threads(1)
            except Exception:
                pass
            from sentence_transformers import SentenceTransformer
            cls._embedder = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)
        return cls._embedder

    def get_collection_name(self, repo_id: str) -> str:
        return f"repo_{repo_id.replace('-', '_')}"

    def _generate_gemini_embeddings(self, texts: List[str]) -> Optional[List[List[float]]]:
        """Generates embeddings via Google Gemini text-embedding-004 API (0MB local RAM)"""
        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "your_gemini_api_key_here":
            return None

        url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents?key={settings.GEMINI_API_KEY}"
        embeddings = []
        batch_size = 50  # Gemini API limit per batch

        try:
            with httpx.Client(timeout=30.0) as client:
                for i in range(0, len(texts), batch_size):
                    batch_texts = texts[i : i + batch_size]
                    payload = {
                        "requests": [
                            {
                                "model": "models/text-embedding-004",
                                "content": {"parts": [{"text": t[:2048]}]}
                            }
                            for t in batch_texts
                        ]
                    }
                    resp = client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        for item in data.get("embeddings", []):
                            embeddings.append(item["values"])
                    else:
                        # Fallback if API fails
                        return None
            return embeddings if len(embeddings) == len(texts) else None
        except Exception:
            return None

    def _generate_single_gemini_embedding(self, query: str) -> Optional[List[float]]:
        """Generates a single query embedding via Gemini API"""
        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "your_gemini_api_key_here":
            return None

        url = f"https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key={settings.GEMINI_API_KEY}"
        try:
            with httpx.Client(timeout=15.0) as client:
                payload = {
                    "model": "models/text-embedding-004",
                    "content": {"parts": [{"text": query[:2048]}]}
                }
                resp = client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    return data.get("embedding", {}).get("values")
        except Exception:
            pass
        return None

    def _generate_local_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generates embeddings locally with low memory footprint and chunking"""
        embedder = self._get_local_embedder()
        all_embeddings = []
        batch_size = 16  # Low batch size to prevent Render OOM

        try:
            import torch
            with torch.no_grad():
                for i in range(0, len(texts), batch_size):
                    batch_texts = texts[i : i + batch_size]
                    embs = embedder.encode(batch_texts, show_progress_bar=False, batch_size=16)
                    all_embeddings.extend(embs.tolist())
                    gc.collect()
        except Exception:
            for i in range(0, len(texts), batch_size):
                batch_texts = texts[i : i + batch_size]
                embs = embedder.encode(batch_texts, show_progress_bar=False, batch_size=16)
                all_embeddings.extend(embs.tolist())

        return all_embeddings

    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Tries Gemini API embedding first for fast & zero-RAM execution; falls back to local SentenceTransformer"""
        if not texts:
            return []
        
        # 1. Try Gemini Cloud Embeddings (0 MB RAM)
        cloud_embeddings = self._generate_gemini_embeddings(texts)
        if cloud_embeddings:
            return cloud_embeddings

        # 2. Fallback to Local Embeddings (Memory Safe)
        return self._generate_local_embeddings(texts)

    def generate_query_embedding(self, query: str) -> List[float]:
        """Generates embedding for a search query"""
        cloud_emb = self._generate_single_gemini_embedding(query)
        if cloud_emb:
            return cloud_emb

        embedder = self._get_local_embedder()
        return embedder.encode([query])[0].tolist()

    def index_chunks(self, repo_id: str, chunks: List[Dict[str, Any]]):
        """Generates embeddings and inserts chunks into ChromaDB collection"""
        if not chunks:
            return

        collection_name = self.get_collection_name(repo_id)
        
        # Delete existing collection if re-indexing
        try:
            self._client.delete_collection(collection_name)
        except Exception:
            pass

        collection = self._client.get_or_create_collection(
            name=collection_name,
            metadata={"repo_id": repo_id, "hnsw:space": "cosine"}
        )

        texts = [chunk["content"] for chunk in chunks]
        embeddings = self.generate_embeddings(texts)

        ids = [f"{chunk['file_path']}#L{chunk['start_line']}-L{chunk['end_line']}" for chunk in chunks]
        metadatas = [
            {
                "file_path": chunk["file_path"],
                "start_line": int(chunk["start_line"]),
                "end_line": int(chunk["end_line"]),
                "symbol_name": str(chunk.get("symbol_name", "")),
                "language": str(chunk.get("language", "text")),
                "chunk_type": str(chunk.get("chunk_type", "block"))
            }
            for chunk in chunks
        ]

        batch_size = 50
        for i in range(0, len(chunks), batch_size):
            collection.add(
                ids=ids[i : i + batch_size],
                documents=texts[i : i + batch_size],
                embeddings=embeddings[i : i + batch_size],
                metadatas=metadatas[i : i + batch_size]
            )

        gc.collect()

    def search(self, repo_id: str, query: str, top_k: int = 10) -> List[Dict[str, Any]]:
        """Dense vector search in ChromaDB"""
        collection_name = self.get_collection_name(repo_id)
        try:
            collection = self._client.get_collection(collection_name)
        except Exception:
            return []

        if collection.count() == 0:
            return []

        query_embedding = self.generate_query_embedding(query)
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=min(top_k, collection.count())
        )

        formatted_results = []
        if results and results.get("documents") and len(results["documents"]) > 0:
            for idx in range(len(results["documents"][0])):
                doc = results["documents"][0][idx]
                meta = results["metadatas"][0][idx]
                distance = results["distances"][0][idx] if "distances" in results and results["distances"] else 0.5
                similarity = max(0.0, 1.0 - float(distance))
                
                formatted_results.append({
                    "id": results["ids"][0][idx],
                    "content": doc,
                    "file_path": meta["file_path"],
                    "start_line": meta["start_line"],
                    "end_line": meta["end_line"],
                    "symbol_name": meta.get("symbol_name", ""),
                    "language": meta.get("language", "text"),
                    "score": similarity
                })

        return formatted_results

    def delete_collection(self, repo_id: str):
        """Removes a repository collection when deleted"""
        collection_name = self.get_collection_name(repo_id)
        try:
            self._client.delete_collection(collection_name)
        except Exception:
            pass
