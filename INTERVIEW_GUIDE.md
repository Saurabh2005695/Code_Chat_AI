# CodeChat AI — Technical Architecture & System Design Guide

This guide details the technical architecture, design decisions, and deep-dive engineering solutions behind CodeChat AI (ConSentinel).

---

## ⚡ 60-Second Elevator Pitch

> *"CodeChat AI is a full-stack, developer-first RAG assistant that lets software engineers connect any GitHub repository or ZIP file and ask natural-language questions about the codebase.*
> 
> *Standard RAG models blindly split code every few hundred characters, cutting functions and if-statements in half. To solve this, I designed an **AST-aware pipeline using Tree-Sitter** to chunk code into complete, syntactically valid functions and classes with line number metadata.*
> 
> *For retrieval, I implemented **Hybrid Search combining Dense Vector Embeddings with Sparse BM25 via Reciprocal Rank Fusion (RRF)**. Answers are streamed in real time with exact, clickable citations that open the built-in syntax-highlighted code viewer.*
> 
> *The backend is built with **FastAPI, ChromaDB, and Python**, with a **React 18 + Tailwind CSS** frontend featuring interactive dependency graph visualization and a retrieval evaluation benchmarking dashboard."*

---

## 🎯 Top 10 Technical Interview Questions & Answers

### 1. Why did you choose Tree-Sitter AST chunking over naive character or recursive character splitting?
**Answer:**
> *"Naive text splitters split code based on character counts or newlines, which frequently fractures function signatures, splits loops, or separates docstrings from their implementations. Tree-Sitter generates a concrete Abstract Syntax Tree (AST), allowing us to extract complete function declarations, classes, and interfaces as atomic semantic units.*
> 
> *This ensures that every retrieved chunk provided to the LLM represents a complete, compilable logic block with exact start and end line numbers for precise citation."*

---

### 2. How does your Hybrid Retrieval work, and why not use pure vector search?
**Answer:**
> *"Dense vector embeddings (`all-MiniLM-L6-v2`) excel at capturing conceptual meaning (e.g. mapping 'identity check' to `def authenticate()`). However, code search often involves exact identifiers, such as error codes (`ERR_401`), specific variable names (`user_session_id`), or library imports.*
> 
> *BM25 excels at exact token matching. By combining both with **Reciprocal Rank Fusion (RRF)**, where each document gets a score of $\sum \frac{1}{60 + \text{rank}}$, we achieve superior recall and precision without needing to manually tune arbitrary score weights."*

---

### 3. How do you prevent AI hallucinations in your application?
**Answer:**
> *"We prevent hallucinations through a multi-layered approach:*
> 1. *Strict System Prompting: The LLM is explicitly constrained to answer ONLY using provided code snippets.*
> 2. *Fallback Trigger: If the retrieved chunks have low relevance or lack the answer, the LLM is instructed to output: 'The provided codebase does not contain enough information to answer this question.'*
> 3. *Forced Citations: The model is required to cite every factual claim with `[filepath:L<start>-L<end>]`.*
> 4. *Grounding: In the UI, every citation badge is verified against the actual repository file system before the user can click it."*

---

### 4. How did you handle security regarding ZIP file uploads and Git cloning?
**Answer:**
> *"For ZIP uploads, I guarded against **Zip-Slip (path traversal vulnerabilities)** by validating that the canonicalized destination path of every archive member starts within the intended repository storage directory.*
> 
> *I also enforce a 50MB file size ceiling to prevent Zip-Bomb Denial of Service attacks. For GitHub cloning, URLs are sanitized to prevent shell injection, and clones use `--depth=1` to minimize network overhead and disk usage."*

---

### 5. Why did you choose Server-Sent Events (SSE) over WebSockets for streaming responses?
**Answer:**
> *"For AI text generation, communication is predominantly unidirectional—the client sends a prompt, and the server streams tokens back. SSE runs over standard HTTP/1.1 or HTTP/2, requires no special handshake, reconnects automatically, works seamlessly through corporative firewalls and Nginx proxies, and has built-in event-type multiplexing (`citations`, `token`, `done`). WebSockets introduce unnecessary bidirectional protocol overhead for this use case."*

---

### 6. What metrics did you use to evaluate your RAG system's retrieval performance?
**Answer:**
> *"I built a dedicated Evaluation Dashboard calculating two standard Information Retrieval metrics:*
> - **Precision@5:** The fraction of queries where at least one of the expected ground-truth files was retrieved in the top 5 chunks.
> - **Mean Reciprocal Rank (MRR):** Measures where the first relevant file appeared in the ranking ($\frac{1}{\text{rank}}$).
> - **Average Latency:** Benchmarks search speed across vector distance computation and BM25 scoring in milliseconds."*

---

### 7. How does the Dependency Graph feature work?
**Answer:**
> *"During AST parsing, the system extracts all module imports and relative require statements (e.g. `import ... from './auth'`). When a repository is loaded in the architecture view, the backend matches these imported identifiers against indexed file paths to construct a directed graph $(V, E)$ where $V$ is files and $E$ is import edges. The frontend renders this interactively using ReactFlow."*

---

### 8. What is the database design and how does it support multi-tenancy?
**Answer:**
> *"The relational schema uses SQLAlchemy with UUID primary keys. All entities (`Repository`, `ChatSession`, `ChatMessage`, `EvaluationRun`) are linked via foreign keys to the authenticated `User` record with cascading deletes. In ChromaDB, each repository is partitioned into an isolated collection named `repo_{repo_id}`, ensuring strict data isolation across users."*

---

### 9. Why did you use `sentence-transformers` locally instead of OpenAI or cloud embeddings?
**Answer:**
> *"Using local `sentence-transformers/all-MiniLM-L6-v2` has three major benefits:*
> 1. *Zero ongoing cost — runs completely free on CPU without API rate limits.*
> 2. *Privacy & security — source code embeddings are computed locally without transmitting proprietary code to third parties.*
> 3. *Low latency — eliminates external HTTP roundtrips during indexing."*

---

### 10. If you had another 2 weeks, what architectural enhancements would you add?
**Answer:**
> *"I would add:*
> 1. *Incremental re-indexing via Git commit diffs ($O(\Delta)$ instead of full re-index).*
> 2. *Cross-encoder reranking (e.g. `bge-reranker-large`) on the top 15 RRF candidates.*
> 3. *Multi-turn query expansion / HyDE (Hypothetical Document Embeddings) to convert user questions into hypothetical code snippets before embedding."*

---
