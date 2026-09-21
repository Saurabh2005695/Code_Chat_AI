import os
import re
from typing import List, Dict, Any, Optional
from app.utils.file_filters import detect_language

# Try importing tree_sitter_languages
HAS_TREE_SITTER = False
try:
    from tree_sitter_languages import get_language, get_parser
    HAS_TREE_SITTER = True
except Exception:
    HAS_TREE_SITTER = False

TREE_SITTER_QUERIES = {
    "python": """
        (function_definition
            name: (identifier) @symbol_name) @chunk
        (class_definition
            name: (identifier) @symbol_name) @chunk
    """,
    "javascript": """
        (function_declaration
            name: (identifier) @symbol_name) @chunk
        (class_declaration
            name: (identifier) @symbol_name) @chunk
        (method_definition
            name: (property_identifier) @symbol_name) @chunk
    """,
    "typescript": """
        (function_declaration
            name: (identifier) @symbol_name) @chunk
        (class_declaration
            name: (type_identifier) @symbol_name) @chunk
        (method_definition
            name: (property_identifier) @symbol_name) @chunk
        (interface_declaration
            name: (type_identifier) @symbol_name) @chunk
    """,
    "cpp": """
        (function_definition) @chunk
        (class_specifier
            name: (type_identifier) @symbol_name) @chunk
    """,
    "java": """
        (method_declaration
            name: (identifier) @symbol_name) @chunk
        (class_declaration
            name: (identifier) @symbol_name) @chunk
    """,
    "go": """
        (function_declaration
            name: (identifier) @symbol_name) @chunk
        (method_declaration
            name: (field_identifier) @symbol_name) @chunk
    """
}

class ParserService:
    @staticmethod
    def extract_imports(content: str, language: str) -> List[str]:
        """Extracts imported modules or relative files from source code"""
        imports = []
        if language == "python":
            # import foo, from foo.bar import baz
            for line in content.splitlines():
                line = line.strip()
                match1 = re.match(r"^import\s+([a-zA-Z0-9_\.]+)", line)
                if match1:
                    imports.append(match1.group(1))
                match2 = re.match(r"^from\s+([a-zA-Z0-9_\.]+)\s+import", line)
                if match2:
                    imports.append(match2.group(1))
        elif language in ("javascript", "typescript"):
            # import ... from './path', require('./path')
            for line in content.splitlines():
                match1 = re.search(r"import\s+.*?from\s+['\"]([^'\"]+)['\"]", line)
                if match1:
                    imports.append(match1.group(1))
                match2 = re.search(r"require\(\s*['\"]([^'\"]+)['\"]\s*\)", line)
                if match2:
                    imports.append(match2.group(1))
        return list(set(imports))

    @staticmethod
    def chunk_file(file_path: str, content: str, rel_path: str) -> List[Dict[str, Any]]:
        """Parses and chunks code into structured semantic blocks"""
        language = detect_language(file_path)
        chunks: List[Dict[str, Any]] = []

        if not content.strip():
            return []

        lines = content.splitlines()
        total_lines = len(lines)

        # Attempt tree-sitter AST parsing if available and supported
        if HAS_TREE_SITTER and language in TREE_SITTER_QUERIES:
            try:
                lang = get_language(language)
                parser = get_parser(language)
                tree = parser.parse(bytes(content, "utf8"))
                query = lang.query(TREE_SITTER_QUERIES[language])
                captures = query.captures(tree.root_node)

                covered_lines = set()
                
                # Process captured AST nodes
                for node, tag in captures:
                    if tag == "chunk":
                        start_line = node.start_point[0] + 1
                        end_line = node.end_point[0] + 1
                        
                        # Extract symbol name if available
                        symbol_name = "anonymous"
                        for child in node.children:
                            if child.type in ("identifier", "type_identifier", "property_identifier", "field_identifier"):
                                symbol_name = content[child.start_byte:child.end_byte]
                                break

                        chunk_text = content[node.start_byte:node.end_byte]
                        if len(chunk_text.strip()) > 10:
                            chunks.append({
                                "file_path": rel_path,
                                "start_line": start_line,
                                "end_line": end_line,
                                "symbol_name": symbol_name,
                                "language": language,
                                "chunk_type": node.type,
                                "content": chunk_text
                            })
                            for line_idx in range(start_line, end_line + 1):
                                covered_lines.add(line_idx)

                # Fallback for remaining lines (top-level code, imports, configs)
                uncovered_start = None
                for idx in range(1, total_lines + 1):
                    if idx not in covered_lines:
                        if uncovered_start is None:
                            uncovered_start = idx
                    else:
                        if uncovered_start is not None:
                            block_lines = lines[uncovered_start - 1 : idx - 1]
                            block_text = "\n".join(block_lines)
                            if len(block_text.strip()) > 30:
                                chunks.append({
                                    "file_path": rel_path,
                                    "start_line": uncovered_start,
                                    "end_line": idx - 1,
                                    "symbol_name": "module_scope",
                                    "language": language,
                                    "chunk_type": "block",
                                    "content": block_text
                                })
                            uncovered_start = None

                if uncovered_start is not None and uncovered_start <= total_lines:
                    block_lines = lines[uncovered_start - 1 : total_lines]
                    block_text = "\n".join(block_lines)
                    if len(block_text.strip()) > 30:
                        chunks.append({
                            "file_path": rel_path,
                            "start_line": uncovered_start,
                            "end_line": total_lines,
                            "symbol_name": "module_scope",
                            "language": language,
                            "chunk_type": "block",
                            "content": block_text
                        })

                if chunks:
                    return chunks
            except Exception:
                # If tree-sitter fails for any syntax anomaly, use line-based chunking
                pass

        # Robust Line-Based Sliding Window Chunking (for small files, non-AST languages, Markdown, HTML, configs)
        window_size = 50  # lines
        overlap = 10     # lines
        
        start = 0
        while start < total_lines:
            end = min(start + window_size, total_lines)
            chunk_lines = lines[start:end]
            chunk_text = "\n".join(chunk_lines)

            if chunk_text.strip():
                chunks.append({
                    "file_path": rel_path,
                    "start_line": start + 1,
                    "end_line": end,
                    "symbol_name": f"lines_{start+1}_{end}",
                    "language": language,
                    "chunk_type": "block",
                    "content": chunk_text
                })
            
            if end == total_lines:
                break
            start += (window_size - overlap)

        return chunks
