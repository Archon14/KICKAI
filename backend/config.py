"""Configuration and environment variables for Kick AI backend."""

from __future__ import annotations

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from backend directory or project root
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent
ENV_PATH = BACKEND_DIR / ".env"

if ENV_PATH.exists():
    load_dotenv(dotenv_path=ENV_PATH)
else:
    load_dotenv()

OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
USE_MOCK_DATA: bool = os.getenv("USE_MOCK_DATA", "true").lower() in ("true", "1", "yes", "t")
OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "anthropic/claude-3.5-sonnet")

_cors_env = os.getenv("CORS_ORIGINS")
if _cors_env:
    CORS_ORIGINS = [origin.strip() for origin in _cors_env.split(",")]
else:
    CORS_ORIGINS = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
