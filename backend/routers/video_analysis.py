"""Video analysis router for processing uploaded match clips."""
from fastapi import APIRouter

router = APIRouter(prefix="/api/video", tags=["video-analysis"])

@router.post("/upload")
async def upload_clip():
    return {"status": "Video upload endpoint ready for future integration with core/video.py"}
