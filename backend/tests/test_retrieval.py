import pytest
from app.services.bm25_service import BM25Service
from app.core.security import get_password_hash, verify_password, create_access_token
from jose import jwt
from app.config import settings

def test_password_hashing():
    password = "SuperSecretPassword123!"
    hashed = get_password_hash(password)
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_jwt_token_generation():
    user_id = "test-user-uuid-1234"
    token = create_access_token(subject=user_id)
    assert token is not None
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert payload.get("sub") == user_id

def test_bm25_tokenization():
    code_text = "def authenticateUser_withJWT(tokenString): return True"
    tokens = BM25Service.tokenize(code_text)
    assert "authenticate" in tokens or "authenticate_user" in tokens or "user" in tokens
    assert "token" in tokens or "jwt" in tokens or "string" in tokens

def test_bm25_indexing_and_search():
    repo_id = "test_repo_1"
    chunks = [
        {
            "file_path": "auth.py",
            "start_line": 1,
            "end_line": 10,
            "symbol_name": "authenticate_user",
            "language": "python",
            "content": "def authenticate_user(token: str): return verify_jwt(token)"
        },
        {
            "file_path": "database.py",
            "start_line": 1,
            "end_line": 10,
            "symbol_name": "connect_db",
            "language": "python",
            "content": "def connect_database(): return create_engine('postgresql://localhost')"
        }
    ]
    BM25Service.index_chunks(repo_id, chunks)
    results = BM25Service.search(repo_id, "jwt token authentication", top_k=5)
    assert len(results) > 0
    assert results[0]["file_path"] == "auth.py"
