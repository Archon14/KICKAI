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

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from backend.config import CORS_ORIGINS, USE_MOCK_DATA, OPENROUTER_API_KEY
from backend.routers import (
    ai_coach,
    coach,
    face_acoustic,
    football_v1,
    formations,
    match,
    player,
    tactics,
    training,
    video_analysis,
)
from backend.schemas import HealthResponse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("kickai.backend")

# Simple in-memory rate limiter
from collections import defaultdict
import time as _time

class RateLimitMiddleware:
    def __init__(self, app, limit: int = 10, window: int = 10):
        self.app = app
        self.limit = limit
        self.window = window  # seconds
        self.hits = defaultdict(list)  # ip -> list of timestamps

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        # Get client IP (may be behind proxy; for simplicity use client host)
        client = scope.get("client")
        ip = client[0] if client else "unknown"
        path = scope.get("path", "")
        now = _time.time()
        # Clean old hits
        self.hits[ip] = [t for t in self.hits[ip] if now - t < self.window]
        if len(self.hits[ip]) >= self.limit:
            # Too many requests
            from starlette.responses import JSONResponse
            response = JSONResponse(
                {"detail": "Rate limit exceeded"},
                status_code=429
            )
            await response(scope, receive, send)
            return
        self.hits[ip].append(now)
        await self.app(scope, receive, send)



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


# Rate limit middleware
app.add_middleware(RateLimitMiddleware, limit=20, window=10)  # 20 req/10 sec per IP

# WebSocket endpoint for real-time tactical collaboration
@app.websocket("/ws/tactical")
async def tactical_ws(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Collaborative update: {data}")
    except:
        await websocket.close()

# Register API routers
app.include_router(tactics.router)
app.include_router(formations.router)
app.include_router(match.router)
app.include_router(player.router)
app.include_router(training.router)
app.include_router(coach.router)
app.include_router(ai_coach.router)
app.include_router(football_v1.router)
app.include_router(video_analysis.router)
app.include_router(face_acoustic.router)


@app.get("/api/export/{report_type}")
async def export_report(report_type: str):
    return {
        "status": "export_available",
        "report_type": report_type,
        "format": "json",
        "note": "In production, this would render HTML/PDF using a template engine."
    }

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
