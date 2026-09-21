import os
import chromadb
from chromadb.config import Settings as ChromaSettings
from typing import List, Dict, Any
from sentence_transformers import SentenceTransformer
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
            # Load local free embedding model
            cls._embedder = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)
        return cls._instance

    def get_collection_name(self, repo_id: str) -> str:
        # ChromaDB collection names must be valid identifiers
        return f"repo_{repo_id.replace('-', '_')}"

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
        embeddings = self._embedder.encode(texts, show_progress_bar=False).tolist()

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

        # Batch insert to avoid huge single payload
        batch_size = 100
        for i in range(0, len(chunks), batch_size):
            collection.add(
                ids=ids[i : i + batch_size],
                documents=texts[i : i + batch_size],
                embeddings=embeddings[i : i + batch_size],
                metadatas=metadatas[i : i + batch_size]
            )

    def search(self, repo_id: str, query: str, top_k: int = 10) -> List[Dict[str, Any]]:
        """Dense vector search in ChromaDB"""
        collection_name = self.get_collection_name(repo_id)
        try:
            collection = self._client.get_collection(collection_name)
        except Exception:
            return []

        query_embedding = self._embedder.encode([query]).tolist()
        results = collection.query(
            query_embeddings=query_embedding,
            n_results=min(top_k, collection.count()) if collection.count() > 0 else 0
        )

        formatted_results = []
        if results and results.get("documents") and len(results["documents"]) > 0:
            for idx in range(len(results["documents"][0])):
                doc = results["documents"][0][idx]
                meta = results["metadatas"][0][idx]
                distance = results["distances"][0][idx] if "distances" in results and results["distances"] else 0.5
                # Convert cosine distance to similarity score
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
