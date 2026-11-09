"""Football video analysis using the existing KICKAI YOLO model."""
from pathlib import Path
import subprocess
from uuid import uuid4
import cv2
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from ultralytics import YOLO

router = APIRouter(prefix="/api/video", tags=["video-analysis"])

ROOT = Path(__file__).resolve().parents[2]
MODEL_PATH = ROOT / "external_engines/FootballVision/models/yolov5su/best.pt"
OUTPUT_DIR = ROOT / "backend/video_outputs"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

_model = None

def get_model():
    global _model
    if _model is None:
        _model = YOLO(str(MODEL_PATH))
    return _model

@router.post("/upload")
def upload_clip(file: UploadFile = File(...)):
    extension = Path(file.filename or "").suffix.lower()
    if extension not in {".mp4", ".mov", ".avi", ".mkv"}:
        raise HTTPException(400, "Unsupported video format")

    video_id = uuid4().hex
    input_path = OUTPUT_DIR / f"{video_id}_input{extension}"
    output_path = OUTPUT_DIR / f"{video_id}_annotated.mp4"
    browser_path = OUTPUT_DIR / f"{video_id}_browser.mp4"

    try:
        with input_path.open("wb") as destination:
            size = 0
            while chunk := file.file.read(1024 * 1024):
                size += len(chunk)
                if size > 500 * 1024 * 1024:
                    raise HTTPException(413, "Video exceeds 500 MB")
                destination.write(chunk)

        capture = cv2.VideoCapture(str(input_path))
        if not capture.isOpened():
            raise HTTPException(400, "Cannot read video")

        fps = capture.get(cv2.CAP_PROP_FPS) or 25
        width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
        if width <= 0 or height <= 0:
            raise HTTPException(400, "Invalid video dimensions")

        writer = cv2.VideoWriter(
            str(output_path),
            cv2.VideoWriter_fourcc(*"mp4v"),
            fps,
            (width, height),
        )
        if not writer.isOpened():
            raise HTTPException(500, "Cannot create output video")

        counts = {"ball": 0, "goalkeeper": 0, "player": 0, "referee": 0}
        frames = 0
        try:
            model = get_model()
            while frames < 750:
                ok, frame = capture.read()
                if not ok:
                    break

                result = model.predict(frame, conf=0.25, verbose=False)[0]
                for box in result.boxes:
                    label = result.names[int(box.cls[0])]
                    if label in counts:
                        counts[label] += 1

                writer.write(result.plot())
                frames += 1
        finally:
            capture.release()
            writer.release()

        if frames == 0:
            raise HTTPException(400, "Video contains no readable frames")

        try:
            subprocess.run(
                [
                    "ffmpeg", "-hide_banner", "-loglevel", "error",
                    "-y", "-i", str(output_path),
                    "-c:v", "libx264", "-preset", "ultrafast",
                    "-crf", "23", "-pix_fmt", "yuv420p",
                    "-movflags", "+faststart", str(browser_path),
                ],
                check=True,
                timeout=180,
            )
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired, OSError):
            browser_path.unlink(missing_ok=True)
            raise HTTPException(500, "Browser-compatible video conversion failed")

        return {
            "status": "completed",
            "video_id": video_id,
            "frames_processed": frames,
            "detections_by_class": counts,
            "annotated_video_url": f"/api/video/result/{video_id}",
            "note": "Counts represent detections across frames, not unique objects.",
        }
    finally:
        file.file.close()
        input_path.unlink(missing_ok=True)

@router.get("/result/{video_id}")
async def get_result(video_id: str):
    if len(video_id) != 32 or any(c not in "0123456789abcdef" for c in video_id):
        raise HTTPException(400, "Invalid video ID")
    path = OUTPUT_DIR / f"{video_id}_browser.mp4"
    if not path.is_file():
        raise HTTPException(404, "Video not found")
    return FileResponse(path, media_type="video/mp4")
