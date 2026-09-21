import pytest
from app.services.parser_service import ParserService
from app.utils.file_filters import detect_language, is_ignored_path

def test_language_detection():
    assert detect_language("app/main.py") == "python"
    assert detect_language("src/App.jsx") == "javascript"
    assert detect_language("src/types.ts") == "typescript"
    assert detect_language("backend/Dockerfile") == "dockerfile"

def test_ignored_paths():
    assert is_ignored_path("node_modules/react/index.js") is True
    assert is_ignored_path(".git/HEAD") is True
    assert is_ignored_path("dist/bundle.js") is True
    assert is_ignored_path("image.png") is True
    assert is_ignored_path("app/services/rag_service.py") is False

def test_import_extraction_python():
    code = """
import os
import sys
from app.database import get_db
from app.models.user import User
"""
    imports = ParserService.extract_imports(code, "python")
    assert "os" in imports
    assert "sys" in imports
    assert "app.database" in imports
    assert "app.models.user" in imports

def test_chunking_python_code():
    code = """
def calculate_area(radius: float) -> float:
    \"\"\"Calculates circle area.\"\"\"
    import math
    return math.pi * (radius ** 2)

class VectorMath:
    def add(self, a, b):
        return a + b
"""
    chunks = ParserService.chunk_file("math_utils.py", code, "math_utils.py")
    assert len(chunks) >= 2
    for chunk in chunks:
        assert "file_path" in chunk
        assert "start_line" in chunk
        assert "end_line" in chunk
        assert chunk["start_line"] <= chunk["end_line"]
        assert len(chunk["content"].strip()) > 0
