FROM python:3.11-slim

WORKDIR /app

# Memory & performance settings for low-RAM cloud instances (Render 512MB)
ENV MALLOC_ARENA_MAX=2 \
    OMP_NUM_THREADS=1 \
    PYTHONUNBUFFERED=1 \
    TOKENIZERS_PARALLELISM=false

# Install system dependencies for git and tree-sitter C compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
