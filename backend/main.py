"""Main FastAPI application for Kick AI football intelligence platform."""

from __future__ import annotations

import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path

# Add project root to sys.path so core.* and analytics.* imports resolve cleanly
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import CORS_ORIGINS, USE_MOCK_DATA
from backend.routers import (
    ai_coach,
    coach,
    football_v1,
    formations,
    match,
    player,
    tactics,
    training,
)
from backend.schemas import HealthResponse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("kickai.backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle events."""
    logger.info("Initializing Kick AI Backend Engine...")
    logger.info(f"Mock Mode: {USE_MOCK_DATA}")
    logger.info(f"Project root added to path: {PROJECT_ROOT}")
    yield
    logger.info("Shutting down Kick AI Backend Engine...")


app = FastAPI(
    title="Kick AI Backend API",
    description="High-performance football intelligence backend serving tactical analysis, simulations, and AI coaching.",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(tactics.router)
app.include_router(formations.router)
app.include_router(match.router)
app.include_router(player.router)
app.include_router(training.router)
app.include_router(coach.router)
app.include_router(ai_coach.router)
app.include_router(football_v1.router)


@app.get("/", response_model=HealthResponse, tags=["health"])
@app.get("/health", response_model=HealthResponse, tags=["health"])
@app.get("/api/health", response_model=HealthResponse, tags=["health"])
async def health_check() -> HealthResponse:
    """System health check endpoint."""
    return HealthResponse(
        status="ok",
        version="1.0.0",
        app="Kick AI Football Intelligence API",
        mock_mode=USE_MOCK_DATA,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
