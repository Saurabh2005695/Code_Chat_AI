import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_ENV: str = "development"
    SECRET_KEY: str = "change-this-to-a-super-secret-key-32-chars-minimum"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    
    DATABASE_URL: str = "sqlite+aiosqlite:///./codechat.db"
    
    STORAGE_DIR: str = "./data/repos"
    CHROMA_PERSIST_DIR: str = "./data/chroma"
    
    EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"
    
    # LLM Provider settings: 'gemini' | 'groq' | 'ollama'
    LLM_PROVIDER: str = "gemini"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"
    
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama3-70b-8192"
    
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "codellama:7b"

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()

# Ensure directories exist
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
