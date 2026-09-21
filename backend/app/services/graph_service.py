import os
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.repository import Repository, RepoFile
from app.services.llm_provider import LLMProvider
from app.config import settings

class GraphService:
    @staticmethod
    async def build_dependency_graph(repo_id: str, db: AsyncSession) -> Dict[str, Any]:
        """Builds interactive node-edge dependency graph from stored file metadata"""
        result = await db.execute(select(RepoFile).where(RepoFile.repo_id == repo_id))
        files = result.scalars().all()

        nodes: List[Dict[str, Any]] = []
        edges: List[Dict[str, Any]] = []

        file_paths = {f.file_path for f in files}

        for f in files:
            nodes.append({
                "id": f.file_path,
                "label": os.path.basename(f.file_path),
                "language": f.language or "text",
                "line_count": f.line_count,
                "type": "file"
            })

            # Check imports
            for imp in (f.imports or []):
                matched_target = None
                for target_path in file_paths:
                    normalized_imp = imp.replace(".", "/").replace("\\", "/")
                    if normalized_imp in target_path or os.path.splitext(target_path)[0].endswith(normalized_imp):
                        matched_target = target_path
                        break

                if matched_target and matched_target != f.file_path:
                    edges.append({
                        "source": f.file_path,
                        "target": matched_target,
                        "type": "imports"
                    })

        return {"nodes": nodes, "edges": edges}

    @staticmethod
    async def generate_readme_and_onboarding(repo: Repository, db: AsyncSession) -> Dict[str, str]:
        """Auto-generates a comprehensive, production-grade technical README & architecture guide"""
        result = await db.execute(select(RepoFile).where(RepoFile.repo_id == repo.id).order_by(RepoFile.line_count.desc()))
        files = result.scalars().all()

        # Categorize files by extension/type
        categories: Dict[str, List[RepoFile]] = {}
        for f in files:
            ext = os.path.splitext(f.file_path)[1].lower() or "other"
            categories.setdefault(ext, []).append(f)

        # File summary table
        file_table_rows = []
        for f in files[:25]:
            imports_summary = ", ".join(f.imports[:3]) if f.imports else "None"
            file_table_rows.append(f"| `{f.file_path}` | {f.language or 'text'} | {f.line_count} | {imports_summary} |")

        file_table = (
            "| File Path | Language | Lines | Key Imports |\n"
            "| :--- | :--- | :--- | :--- |\n" +
            "\n".join(file_table_rows)
        )

        prompt = (
            f"Generate a rigorous, professional, enterprise-grade software architecture document and README for the repository '{repo.name}'.\n\n"
            f"Repository Summary:\n"
            f"- Total Files: {repo.total_files}\n"
            f"- Total Chunks: {repo.total_chunks}\n"
            f"- Source: {repo.source_type}\n\n"
            f"Key Code Files:\n{file_table}\n\n"
            f"RULES:\n"
            f"1. Absolutely DO NOT include any emojis.\n"
            f"2. Structure with:\n"
            f"   - 1. Executive Project Summary\n"
            f"   - 2. System Architecture & Component Design\n"
            f"   - 3. Module & Directory Breakdown\n"
            f"   - 4. Data Flow & Execution Path\n"
            f"   - 5. Prerequisites & Local Setup Guide\n"
            f"   - 6. Security, Testing & Maintenance"
        )

        full_readme = ""
        if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "your_gemini_api_key_here":
            try:
                async for token in LLMProvider.stream_completion(prompt=prompt, system_prompt="You are a Principal Software Architect writing comprehensive engineering documentation without emojis."):
                    full_readme += token
            except Exception:
                full_readme = ""

        # Comprehensive fallback template if LLM is not active
        if not full_readme.strip():
            lang_breakdown = ", ".join([f"{k} ({len(v)} files)" for k, v in categories.items()])

            full_readme = f"""# {repo.name} - Architecture & Technical Reference

## 1. Project Overview
This repository contains the implementation for **{repo.name}**. It is structured across **{repo.total_files} files** and **{repo.total_chunks} indexed components**, utilizing the following core languages and formats: {lang_breakdown}.

---

## 2. High-Level System Architecture
The application is organized around modular separation of concerns:
- **Routing & Presentation Layer:** Handles user-facing HTTP routes, view rendering, and interface templates.
- **Application & Service Logic:** Encapsulates domain operations, validation rules, and business handlers.
- **Data & Configuration Layer:** Manages data persistence, schema migrations, and environment variable initialization.

```
+-------------------------------------------------------------+
|                      Client / Browser                       |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|               Routing & Controller Endpoints                |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                  Service & Business Logic                   |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|                Database & Persistence Models                |
+-------------------------------------------------------------+
```

---

## 3. Directory & File Inventory

The most significant files by line volume and functional complexity include:

{file_table}

---

## 4. Execution & Installation Workflow

### Prerequisites
- Runtime environment corresponding to the identified technologies ({lang_breakdown}).
- Git package manager for version control.

### Setup Instructions
1. Clone the repository locally:
   ```bash
   git clone {repo.source_url or 'https://github.com/your-username/' + repo.name}
   cd {repo.name}
   ```

2. Configure environment settings:
   - Copy sample environment configuration files if present (`.env.example` -> `.env`).
   - Populate necessary secrets and database connection URIs.

3. Install required dependencies:
   - For Node/JS projects: `npm install`
   - For Python projects: `pip install -r requirements.txt`

4. Run the development server:
   - Execute the standard startup script defined in the root configuration.

---

## 5. Module Dependency Analysis

To inspect interactive module relationships and see which files import which modules, navigate to the **Architecture Graph** view in the application interface.
"""

        return {
            "readme_markdown": full_readme,
            "onboarding_guide": "Refer to the generated technical document above for architecture and setup details."
        }
