import json
import re
import httpx
import asyncio
from typing import AsyncGenerator
from app.config import settings

class LLMProvider:
    @staticmethod
    async def stream_completion(prompt: str, system_prompt: str = "") -> AsyncGenerator[str, None]:
        """Streams response tokens from configured LLM provider (Gemini, Groq, Ollama, or Local AST Synthesizer)"""
        provider = settings.LLM_PROVIDER.lower().strip()

        # If user has configured Gemini with an API key
        if provider == "gemini" and settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "your_gemini_api_key_here":
            async for token in LLMProvider._stream_gemini(prompt, system_prompt):
                yield token
        # If user configured Groq
        elif provider == "groq" and settings.GROQ_API_KEY:
            async for token in LLMProvider._stream_groq(prompt, system_prompt):
                yield token
        # If user configured Ollama
        elif provider == "ollama":
            async for token in LLMProvider._stream_ollama(prompt, system_prompt):
                yield token
        # Fallback: Deep local AST Code Synthesizer
        else:
            async for token in LLMProvider._synthesize_local_response(prompt):
                yield token

    @staticmethod
    async def _synthesize_local_response(prompt: str) -> AsyncGenerator[str, None]:
        """Synthesizes an in-depth, professional code analysis directly from retrieved AST chunks or code snippets"""
        # Check if this is a direct code snippet / symbol explanation request
        snippet_match = re.search(
            r'Explain the following code snippet from [`\'"]?(.*?)[`\'"]?\s*\(Lines (\d+)-(\d+)\)[\s\S]*?```(?:[a-zA-Z0-9_-]*\n)?([\s\S]*?)```',
            prompt
        )

        if snippet_match:
            file_path = snippet_match.group(1).strip()
            start_line = int(snippet_match.group(2))
            end_line = int(snippet_match.group(3))
            code = snippet_match.group(4).rstrip()

            async for token in LLMProvider._synthesize_snippet_explanation(file_path, start_line, end_line, code):
                yield token
            return

        # Check if generic code block is provided without RAG context
        generic_code_match = re.search(r'```(?:[a-zA-Z0-9_-]*\n)?([\s\S]+?)```', prompt)
        context_matches = re.findall(
            r'--- FILE: (.*?) \(Lines (\d+)-(\d+)\) ---\n([\s\S]*?)(?=--- FILE:|\n\nDEVELOPER QUESTION:|$)',
            prompt
        )

        if not context_matches and generic_code_match and "Explain" in prompt:
            code = generic_code_match.group(1).rstrip()
            async for token in LLMProvider._synthesize_snippet_explanation("source_code", 1, len(code.splitlines()), code):
                yield token
            return

        question_match = re.search(r'DEVELOPER QUESTION:\s*(.*?)(?=\n\nANSWER|\n\nAnswer|$)', prompt, re.DOTALL)
        question = question_match.group(1).strip() if question_match else "Codebase Query Analysis"

        # Check if query is in Hinglish or Hindi
        hinglish_words = {
            "kaise", "kya", "kare", "karna", "batao", "samjhao", "hai", "hain", "karo", "bhai",
            "chahiye", "hota", "hoti", "hote", "isme", "ismein", "kyu", "kyun", "kab", "kahan",
            "konsa", "wala", "wali", "wale", "kuch", "shuru", "madad", "bhasha", "hindi", "hinglish"
        }
        tokens = set(re.findall(r'\b[a-zA-Z]+\b', question.lower()))
        is_hinglish = len(tokens.intersection(hinglish_words)) > 0

        if not context_matches:
            msg = (
                "Is codebase mein is sawal ke liye koi relevant context nahi mila."
                if is_hinglish else
                "The provided codebase does not contain sufficient context to answer this query."
            )
            yield msg
            return

        first_file = context_matches[0][0].split("/")[-1]

        # 1. Direct Answer
        if is_hinglish:
            output = f"### Direct Answer\n\nIs codebase mein **\"{question}\"** ke liye yeh core implementation use ho rahi hai:\n\n"
            output += "### How It Works (Step-by-Step)\n\n"
            for idx, (file_path, start_line, end_line, code) in enumerate(context_matches[:3]):
                file_name = file_path.split("/")[-1]
                citation = f"[{file_path}:L{start_line}-L{end_line}]"
                definitions = re.findall(r'(?:def|class|function|const|let|var)\s+([a-zA-Z0-9_]+)', code)
                symbol_str = f" (`{', '.join(definitions[:3])}`)" if definitions else ""
                output += f"- **Step {idx + 1} ({file_name}):** {citation}{symbol_str} is feature ki main logic ko execute karta hai.\n"
        else:
            output = f"### Direct Answer\n\nBased on codebase analysis for **\"{question}\"**, here is how it is implemented:\n\n"
            output += "### How It Works (Step-by-Step)\n\n"
            for idx, (file_path, start_line, end_line, code) in enumerate(context_matches[:3]):
                file_name = file_path.split("/")[-1]
                citation = f"[{file_path}:L{start_line}-L{end_line}]"
                definitions = re.findall(r'(?:def|class|function|const|let|var)\s+([a-zA-Z0-9_]+)', code)
                symbol_str = f" (`{', '.join(definitions[:3])}`)" if definitions else ""
                output += f"- **Step {idx + 1} ({file_name}):** {citation}{symbol_str} handles the core logic.\n"

        output += "\n---\n\n### Key Code Snippet\n\n"
        file_path, start_line, end_line, code = context_matches[0]
        file_name = file_path.split("/")[-1]
        citation = f"[{file_path}:L{start_line}-L{end_line}]"
        clean_lines = [l for l in code.strip().splitlines() if l.strip()]
        preview_code = "\n".join(clean_lines[:10])
        lang = "python" if file_path.endswith(".py") else ("javascript" if file_path.endswith((".js", ".jsx", ".ts", ".tsx")) else "text")

        output += f"#### `{file_name}` {citation}\n```{lang}\n{preview_code}\n```\n\n"
        output += "### Referenced Files\n\n"
        for idx, (f_path, s_line, e_line, _) in enumerate(context_matches):
            output += f"- `{f_path}` ([Lines {s_line}-{e_line}](file:///{f_path}))\n"

        # Fast stream in word slices
        words = output.split(" ")
        for i, word in enumerate(words):
            yield word + (" " if i < len(words) - 1 else "")
            if i % 6 == 0:
                await asyncio.sleep(0.001)

    @staticmethod
    async def _synthesize_snippet_explanation(file_path: str, start_line: int, end_line: int, code: str) -> AsyncGenerator[str, None]:
        """Generates a comprehensive line-by-line and symbol explanation for a code snippet without emojis"""
        file_name = file_path.split("/")[-1] if "/" in file_path else (file_path.split("\\")[-1] if "\\" in file_path else file_path)
        
        # Detect Language
        lang = "python" if file_path.endswith(".py") else (
            "javascript" if file_path.endswith((".js", ".jsx")) else (
                "typescript" if file_path.endswith((".ts", ".tsx")) else (
                    "html" if file_path.endswith(".html") else (
                        "css" if file_path.endswith(".css") else (
                            "sql" if file_path.endswith(".sql") else "generic"
                        )
                    )
                )
            )
        )

        # Extract symbols
        func_defs = re.findall(r'(?:async\s+)?def\s+([a-zA-Z0-9_]+)\s*\((.*?)\)', code)
        js_func_defs = re.findall(r'(?:function\s+([a-zA-Z0-9_]+)|(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?\((.*?)\))', code)
        class_defs = re.findall(r'class\s+([a-zA-Z0-9_]+)(?:\((.*?)\))?:', code)
        decorators = re.findall(r'@([a-zA-Z0-9_\.]+)(?:\(.*?\))?', code)
        imports = re.findall(r'(?:import|from|require)\s+[\'"]?([a-zA-Z0-9_\.\/]+)', code)
        returns = re.findall(r'return\s+(.*)', code)

        lines = [l for l in code.splitlines()]
        non_empty_lines = [l for l in lines if l.strip()]

        # Section 1: Overview & Scope
        output = f"### Code Explanation: `{file_name}` (Lines {start_line}-{end_line})\n\n"
        output += f"**File:** `{file_path}`  \n"
        output += f"**Language:** {lang.capitalize()}  \n\n"
        output += "---\n\n"

        # Section 2: Direct Purpose & Symbols
        output += "### 1. Purpose & Defined Symbols\n\n"
        if class_defs:
            for cls_name, base in class_defs:
                base_str = f" (inherits from `{base}`)" if base else ""
                output += f"- **Class:** `{cls_name}`{base_str} — defines data model or component structure.\n"
        if func_defs:
            for fn_name, params in func_defs:
                output += f"- **Function:** `{fn_name}({params.strip()})` — executes core application logic for this module.\n"
        if js_func_defs:
            for f1, f2, p in js_func_defs:
                fn_name = f1 or f2
                output += f"- **Function:** `{fn_name}({p.strip() if p else ''})` — handles component behavior or handler flow.\n"
        if not class_defs and not func_defs and not js_func_defs:
            output += "- **Block:** Core procedural logic and variable initializations.\n"

        output += "\n---\n\n"

        # Section 3: Simple Step-by-Step Logic
        output += "### 2. Step-by-Step Logic\n\n"
        if len(non_empty_lines) == 0:
            output += "The selected code section is empty.\n\n"
        else:
            step_count = 1
            for i, line in enumerate(non_empty_lines[:8]):
                stripped = line.strip()
                if stripped.startswith(("@", "def ", "class ", "async def ", "function ")):
                    desc = "Declares the function or class signature with access control."
                elif stripped.startswith(("import ", "from ")):
                    desc = "Imports necessary module dependencies."
                elif "return " in stripped:
                    desc = f"Returns the computed result to the caller."
                elif stripped.startswith(("if ", "elif ", "else:")):
                    desc = "Checks conditions or validates input data."
                elif stripped.startswith(("try:", "except ", "catch ")):
                    desc = "Handles potential errors safely."
                elif "=" in stripped and not stripped.startswith("=="):
                    desc = "Initializes or updates local state."
                elif "await " in stripped:
                    desc = "Performs an asynchronous operation (e.g. database or network)."
                else:
                    desc = "Executes core statement."
                
                output += f"- **Step {step_count}:** `{stripped[:50]}` — *{desc}*\n"
                step_count += 1

        output += "\n---\n\n"

        # Section 4: Inputs & Outputs
        output += "### 3. Inputs & Returns\n\n"
        if func_defs or js_func_defs:
            all_params = [p.strip() for _, p in func_defs if p.strip()]
            output += f"- **Inputs:** `{', '.join(all_params) if all_params else 'None'}`\n"
        if returns:
            output += f"- **Returns:** `{', '.join([r.strip() for r in returns[:2]])}`\n"
        else:
            output += "- **Returns:** No explicit return value (runs state side-effects).\n"

        # Stream output in word chunks
        words = output.split(" ")
        for i, word in enumerate(words):
            yield word + (" " if i < len(words) - 1 else "")
            if i % 4 == 0:
                await asyncio.sleep(0.005)

    @staticmethod
    async def _stream_gemini(prompt: str, system_prompt: str) -> AsyncGenerator[str, None]:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:streamGenerateContent?key={settings.GEMINI_API_KEY}&alt=sse"
        
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": f"{system_prompt}\n\nUser Request: {prompt}"}]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 2048
            }
        }

        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(2.5, connect=1.5)) as client:
                async with client.stream("POST", url, json=payload, headers={"Content-Type": "application/json"}) as response:
                    if response.status_code != 200:
                        async for token in LLMProvider._synthesize_local_response(prompt):
                            yield token
                        return

                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data_str = line[6:].strip()
                            if not data_str:
                                continue
                            try:
                                data_json = json.loads(data_str)
                                candidates = data_json.get("candidates", [])
                                if candidates and "content" in candidates[0]:
                                    parts = candidates[0]["content"].get("parts", [])
                                    for part in parts:
                                        if "text" in part:
                                            yield part["text"]
                            except Exception:
                                pass
        except Exception:
            async for token in LLMProvider._synthesize_local_response(prompt):
                yield token

    @staticmethod
    async def _stream_groq(prompt: str, system_prompt: str) -> AsyncGenerator[str, None]:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": settings.GROQ_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.2,
            "stream": True
        }

        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(3.0, connect=1.5)) as client:
                async with client.stream("POST", url, json=payload, headers=headers) as response:
                    if response.status_code != 200:
                        async for token in LLMProvider._synthesize_local_response(prompt):
                            yield token
                        return

                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data_str = line[6:].strip()
                            if data_str == "[DONE]":
                                break
                            try:
                                data_json = json.loads(data_str)
                                delta = data_json["choices"][0].get("delta", {})
                                if "content" in delta and delta["content"]:
                                    yield delta["content"]
                            except Exception:
                                pass
        except Exception:
            async for token in LLMProvider._synthesize_local_response(prompt):
                yield token

    @staticmethod
    async def _stream_ollama(prompt: str, system_prompt: str) -> AsyncGenerator[str, None]:
        url = f"{settings.OLLAMA_BASE_URL}/api/chat"
        payload = {
            "model": settings.OLLAMA_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "stream": True,
            "options": {"temperature": 0.2}
        }

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                async with client.stream("POST", url, json=payload) as response:
                    if response.status_code != 200:
                        async for token in LLMProvider._synthesize_local_response(prompt):
                            yield token
                        return

                    async for line in response.aiter_lines():
                        if line.strip():
                            try:
                                data_json = json.loads(line)
                                msg = data_json.get("message", {})
                                if "content" in msg:
                                    yield msg["content"]
                            except Exception:
                                pass
        except Exception:
            async for token in LLMProvider._synthesize_local_response(prompt):
                yield token
