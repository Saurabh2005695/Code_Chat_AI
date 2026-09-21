import os
from typing import Optional

IGNORED_DIRS = {
    "node_modules", ".git", ".github", ".svn", ".hg",
    ".venv", "venv", "env", "__pycache__", ".pytest_cache",
    "dist", "build", "out", ".next", ".nuxt", "target", "bin", "obj",
    ".idea", ".vscode", "coverage", ".mypy_cache", ".turbo"
}

IGNORED_EXTENSIONS = {
    # Binaries & compiled
    ".exe", ".dll", ".so", ".dylib", ".bin", ".pyc", ".pyd", ".pyo", ".class", ".o", ".a",
    # Archives
    ".zip", ".tar", ".gz", ".7z", ".rar", ".bz2", ".xz",
    # Images & Media
    ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".webp", ".mp3", ".mp4", ".wav", ".avi", ".pdf",
    # Fonts
    ".ttf", ".otf", ".woff", ".woff2", ".eot",
    # Locks & Large data
    ".lock", ".map", ".min.js", ".min.css", ".parquet", ".csv", ".tsv", ".sqlite", ".db"
}

EXTENSION_TO_LANGUAGE = {
    ".py": "python",
    ".js": "javascript",
    ".jsx": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".java": "java",
    ".cpp": "cpp",
    ".c": "c",
    ".h": "c",
    ".hpp": "cpp",
    ".go": "go",
    ".rs": "rust",
    ".php": "php",
    ".rb": "ruby",
    ".cs": "csharp",
    ".html": "html",
    ".css": "css",
    ".scss": "scss",
    ".json": "json",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".md": "markdown",
    ".sql": "sql",
    ".sh": "bash",
    ".bash": "bash",
    ".dockerfile": "dockerfile"
}

def is_ignored_path(path: str) -> bool:
    """Checks if a relative path traverses any ignored directories or matches ignored filenames"""
    parts = os.path.normpath(path).split(os.sep)
    for part in parts:
        if part in IGNORED_DIRS or part.startswith(".git"):
            return True
    
    filename = parts[-1] if parts else ""
    if filename.startswith(".") and filename not in {".env.example", ".gitignore"}:
        return True
        
    _, ext = os.path.splitext(filename.lower())
    if ext in IGNORED_EXTENSIONS:
        return True
        
    return False

def detect_language(file_path: str) -> Optional[str]:
    """Detects programming language from file extension or special filename"""
    filename = os.path.basename(file_path).lower()
    if filename == "dockerfile":
        return "dockerfile"
        
    _, ext = os.path.splitext(filename)
    return EXTENSION_TO_LANGUAGE.get(ext.lower(), "text")

def is_binary_file(file_path: str) -> bool:
    """Checks if file contains null bytes (heuristic for binary files)"""
    try:
        with open(file_path, "tr", encoding="utf-8") as f:
            f.read(1024)
            return False
    except Exception:
        return True
