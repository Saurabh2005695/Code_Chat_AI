import json
from typing import List, Dict, Any, AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.vector_service import VectorService
from app.services.bm25_service import BM25Service
from app.services.llm_provider import LLMProvider
from app.models.chat import ChatMessage

class RAGService:
    def __init__(self):
        self.vector_service = VectorService()

    def hybrid_search(self, repo_id: str, query: str, top_k: int = 6) -> List[Dict[str, Any]]:
        """Combines Vector Search & BM25 Keyword Search using Reciprocal Rank Fusion (RRF)"""
        dense_results = self.vector_service.search(repo_id, query, top_k=10)
        sparse_results = BM25Service.search(repo_id, query, top_k=10)

        # RRF scoring formula: 1 / (60 + rank)
        rrf_k = 60
        scores: Dict[str, float] = {}
        chunks_map: Dict[str, Dict[str, Any]] = {}

        # Process dense rankings
        for rank, res in enumerate(dense_results):
            cid = res["id"]
            scores[cid] = scores.get(cid, 0.0) + (1.0 / (rrf_k + rank + 1))
            chunks_map[cid] = res

        # Process sparse rankings
        for rank, res in enumerate(sparse_results):
            cid = res["id"]
            scores[cid] = scores.get(cid, 0.0) + (1.0 / (rrf_k + rank + 1))
            if cid not in chunks_map:
                chunks_map[cid] = res

        # Sort by final fused RRF score
        sorted_cids = sorted(scores.keys(), key=lambda k: scores[k], reverse=True)[:top_k]
        
        fused_results = []
        for cid in sorted_cids:
            chunk = chunks_map[cid]
            chunk["fused_score"] = scores[cid]
            fused_results.append(chunk)

        return fused_results

    async def stream_rag_response(
        self,
        repo_id: str,
        session_id: str,
        query: str,
        db: AsyncSession
    ) -> AsyncGenerator[str, None]:
        """Executes Hybrid RAG pipeline and yields Server-Sent Events (SSE) with ultra-fast streaming and Hinglish support"""
        clean_q = query.strip().lower()
        is_greeting = any(clean_q.startswith(w) or clean_q == w for w in [
            "hi", "hello", "hey", "namaste", "kaise ho", "kya haal hai", "kya hal hai", 
            "who are you", "what can you do", "help", "kya kar sakte ho", "bhai", "batao", "intro"
        ]) and len(clean_q.split()) <= 5

        # Handle quick conversational greetings instantly
        if is_greeting:
            is_hinglish = any(w in clean_q for w in ["kaise", "kya", "bhai", "namaste", "haal", "hal", "ho", "kar", "batao"])
            if is_hinglish:
                reply = "Namaste! Main CodeChat AI hoon — aapka intelligent codebase assistant. Aap is repository ke kisi bhi code, architecture, function, ya file ke baare mein Hindi, Hinglish, ya English mein pooch sakte hain. Main simple language aur exact line citations ke saath samjhaunga."
            else:
                reply = "Hello! I am CodeChat AI, your codebase intelligence assistant. You can ask me anything about the architecture, functions, data flow, or specific files in this repository. I provide simple, clear answers with exact line citations."

            yield f"data: {json.dumps({'type': 'citations', 'citations': []})}\n\n"
            yield f"data: {json.dumps({'type': 'token', 'content': reply})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

            bot_msg = ChatMessage(session_id=session_id, role="assistant", content=reply, citations=[])
            db.add(bot_msg)
            await db.commit()
            return

        # Step 1: Retrieve context chunks
        chunks = self.hybrid_search(repo_id, query, top_k=5)

        citations = []
        context_blocks = []

        for c in chunks:
            citation_item = {
                "file_path": c["file_path"],
                "start_line": c["start_line"],
                "end_line": c["end_line"],
                "score": round(float(c.get("fused_score", c.get("score", 0.0))), 4),
                "language": c.get("language", "text"),
                "snippet": c["content"][:250] + "..." if len(c["content"]) > 250 else c["content"]
            }
            citations.append(citation_item)
            
            block = f"--- FILE: {c['file_path']} (Lines {c['start_line']}-{c['end_line']}) ---\n{c['content']}\n"
            context_blocks.append(block)

        # Emit citations first so UI can prepare citation badges immediately
        yield f"data: {json.dumps({'type': 'citations', 'citations': citations})}\n\n"

        # If no chunks found at all
        if not chunks:
            is_hinglish = any(w in clean_q for w in ["kaise", "kya", "bhai", "batao", "samjhao", "hai", "karo"])
            no_info_msg = (
                "Is query se related koi relevant code file ya snippet repository mein nahi mila."
                if is_hinglish else
                "The indexed codebase does not contain any relevant files or code snippets matching your query."
            )
            yield f"data: {json.dumps({'type': 'token', 'content': no_info_msg})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            
            # Save to DB
            bot_msg = ChatMessage(session_id=session_id, role="assistant", content=no_info_msg, citations=[])
            db.add(bot_msg)
            await db.commit()
            return

        combined_context = "\n".join(context_blocks)

        system_prompt = (
            "You are CodeChat AI, an intelligent, ultra-fast codebase assistant.\n"
            "Your objective is to provide simple, clear, and easy-to-understand explanations of code without unnecessary complexity.\n\n"
            "RESPONSE GUIDELINES:\n"
            "1. Language & Tone: Match the language of the user query (English, Hinglish, or Hindi). If the user asks in Hinglish (e.g. 'Ye kaise kaam karta hai?'), respond in clear, natural Hinglish. If in Hindi, respond in Hindi. If in English, respond in English.\n"
            "2. Speed & Simplicity: Keep explanations simple, direct, and concise.\n"
            "3. No Emojis: Do not use emojis anywhere in the response.\n"
            "4. Citations: Every code reference or file explanation must include exact citation tags like `[file_path:L<start>-L<end>]` (e.g., `[users/views.py:L10-L25]`).\n"
            "5. Structure:\n"
            "   - **Direct Answer**: 1-2 simple sentences directly explaining what this is and what it does.\n"
            "   - **How It Works**: Clear, simple step-by-step bullet points explaining the execution flow.\n"
            "   - **Key Files & Citations**: Concise list of relevant files and lines."
        )

        user_prompt = (
            f"CONTEXT FROM CODEBASE:\n{combined_context}\n\n"
            f"DEVELOPER QUESTION:\n{query}\n\n"
            f"ANSWER (respond in user's language - Hinglish/English/Hindi, with exact citations, fast and no emojis):"
        )

        # Step 2: Stream tokens from LLM
        full_response_text = ""
        async for token in LLMProvider.stream_completion(prompt=user_prompt, system_prompt=system_prompt):
            full_response_text += token
            yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"

        yield f"data: {json.dumps({'type': 'done'})}\n\n"

        # Step 3: Persist assistant message to database
        try:
            bot_message = ChatMessage(
                session_id=session_id,
                role="assistant",
                content=full_response_text,
                citations=citations
            )
            db.add(bot_message)
            await db.commit()
        except Exception:
            pass
