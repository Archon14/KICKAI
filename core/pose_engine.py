from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterator, Optional

import cv2
import numpy as np

try:
    import streamlit as st
except ImportError:  # core must load without Streamlit (API / tests)
    st = None


# ---------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------

MAX_WIDTH = 640
MAX_HEIGHT = 480
DEFAULT_FRAME_STRIDE = 2
DEFAULT_MAX_FRAMES = 1500


@dataclass
class PoseFrame:
    frame_index: int
    timestamp_ms: int
    landmarks: np.ndarray


@dataclass
class PoseAnalysisResult:
    fps: float
    frame_count: int
    processed_frames: int
    duration_seconds: float
    landmarks: np.ndarray
    timestamps_ms: np.ndarray


# ---------------------------------------------------------------------
# MediaPipe lazy import
# ---------------------------------------------------------------------

def _import_mediapipe():
    try:
        import mediapipe as mp
    except ImportError as exc:
        raise RuntimeError(
            "MediaPipe is not installed. "
            "Run: pip install mediapipe"
        ) from exc

    return mp


# ---------------------------------------------------------------------
# Model
# ---------------------------------------------------------------------

def _cache_resource(fn):
    if st is None:
        return fn
    return st.cache_resource(show_spinner=False)(fn)


@_cache_resource
def load_pose_landmarker(
    model_path: str,
    min_detection_confidence: float = 0.5,
    min_presence_confidence: float = 0.5,
    min_tracking_confidence: float = 0.5,
):
    """
    Load MediaPipe once per Streamlit process.

    Cached as a resource because the landmarker is an expensive native
    resource and should not be recreated on every Streamlit rerun.
    """

    model_file = Path(model_path)

    if not model_file.exists():
        raise FileNotFoundError(
            f"Pose model not found: {model_file}"
        )

    mp = _import_mediapipe()

    base_options = mp.tasks.BaseOptions(
        model_asset_path=str(model_file)
    )

    options = mp.tasks.vision.PoseLandmarkerOptions(
        base_options=base_options,
        running_mode=mp.tasks.vision.RunningMode.VIDEO,
        num_poses=1,
        min_pose_detection_confidence=min_detection_confidence,
        min_pose_presence_confidence=min_presence_confidence,
        min_tracking_confidence=min_tracking_confidence,
        output_segmentation_masks=False,
    )

    try:
        landmarker = mp.tasks.vision.PoseLandmarker.create_from_options(
            options
        )
    except Exception as exc:
        raise RuntimeError(
            f"Unable to initialize MediaPipe PoseLandmarker: {exc}"
        ) from exc

    return landmarker


# ---------------------------------------------------------------------
# Frame utilities
# ---------------------------------------------------------------------

def resize_frame(
    frame: np.ndarray,
    max_width: int = MAX_WIDTH,
    max_height: int = MAX_HEIGHT,
) -> np.ndarray:
    """
    Downscale frame without enlarging small frames.
    """

    if frame is None or frame.size == 0:
        raise ValueError("Invalid video frame.")

    height, width = frame.shape[:2]

    scale = min(
        max_width / width,
        max_height / height,
        1.0,
    )

    if scale >= 1.0:
        return frame

    new_width = max(1, int(width * scale))
    new_height = max(1, int(height * scale))

    return cv2.resize(
        frame,
        (new_width, new_height),
        interpolation=cv2.INTER_AREA,
    )


def _landmarks_to_array(pose_landmarks) -> np.ndarray:
    """
    Convert MediaPipe landmarks to a compact float32 array.

    Shape:
        (33, 4)

    Columns:
        x, y, z, visibility
    """

    output = np.zeros(
        (33, 4),
        dtype=np.float32,
    )

    count = min(len(pose_landmarks), 33)

    for i in range(count):
        landmark = pose_landmarks[i]

        output[i, 0] = float(landmark.x)
        output[i, 1] = float(landmark.y)
        output[i, 2] = float(landmark.z)

        visibility = getattr(
            landmark,
            "visibility",
            1.0,
        )

        output[i, 3] = float(visibility)

    return output


# ---------------------------------------------------------------------
# Video iterator
# ---------------------------------------------------------------------

def iter_pose_frames(
    video_path: str,
    landmarker,
    frame_stride: int = DEFAULT_FRAME_STRIDE,
    max_frames: int = DEFAULT_MAX_FRAMES,
) -> Iterator[PoseFrame]:
    """
    Stream pose results frame-by-frame.

    Important:
        No complete video is loaded into RAM.
    """

    if frame_stride < 1:
        raise ValueError("frame_stride must be >= 1.")

    capture = cv2.VideoCapture(video_path)

    if not capture.isOpened():
        raise RuntimeError(
            "Could not open the uploaded video."
        )

    fps = capture.get(cv2.CAP_PROP_FPS)

    if not fps or fps <= 0:
        fps = 30.0

    frame_index = 0
    processed = 0

    mp = _import_mediapipe()

    try:
        while processed < max_frames:
            success, frame = capture.read()

            if not success:
                break

            current_index = frame_index
            frame_index += 1

            if current_index % frame_stride != 0:
                continue

            frame = resize_frame(frame)

            # OpenCV BGR -> RGB.
            rgb = cv2.cvtColor(
                frame,
                cv2.COLOR_BGR2RGB,
            )

            # MediaPipe owns this image during the call.
            mp_image = mp.Image(
                image_format=mp.ImageFormat.SRGB,
                data=rgb,
            )

            timestamp_ms = int(
                (current_index / fps) * 1000
            )

            try:
                result = landmarker.detect_for_video(
                    mp_image,
                    timestamp_ms,
                )
            except Exception:
                # Skip corrupt/problematic frame rather than killing
                # the entire analysis.
                continue

            if result.pose_landmarks:
                landmarks = _landmarks_to_array(
                    result.pose_landmarks[0]
                )

                yield PoseFrame(
                    frame_index=current_index,
                    timestamp_ms=timestamp_ms,
                    landmarks=landmarks,
                )

            processed += 1

            # Explicit references help long-running jobs release memory.
            del rgb
            del frame
            del mp_image

    finally:
        capture.release()


# ---------------------------------------------------------------------
# Complete analysis
# ---------------------------------------------------------------------

def analyze_video(
    video_path: str,
    model_path: str,
    frame_stride: int = DEFAULT_FRAME_STRIDE,
    max_frames: int = DEFAULT_MAX_FRAMES,
    min_detection_confidence: float = 0.5,
    min_presence_confidence: float = 0.5,
    min_tracking_confidence: float = 0.5,
    progress_callback=None,
) -> PoseAnalysisResult:

    if not Path(video_path).exists():
        raise FileNotFoundError(video_path)

    if frame_stride < 1:
        raise ValueError(
            "frame_stride must be >= 1."
        )

    landmarker = load_pose_landmarker(
        model_path=model_path,
        min_detection_confidence=min_detection_confidence,
        min_presence_confidence=min_presence_confidence,
        min_tracking_confidence=min_tracking_confidence,
    )

    capture = cv2.VideoCapture(video_path)

    if not capture.isOpened():
        raise RuntimeError("Unable to inspect video.")

    fps = capture.get(cv2.CAP_PROP_FPS)
    total_frames = capture.get(cv2.CAP_PROP_FRAME_COUNT)

    capture.release()

    if not fps or fps <= 0:
        fps = 30.0

    if not total_frames or total_frames <= 0:
        total_frames = 1

    # We intentionally keep only compact landmark arrays.
    landmark_rows = []
    timestamp_rows = []

    processed = 0

    try:
        for pose_frame in iter_pose_frames(
            video_path=video_path,
            landmarker=landmarker,
            frame_stride=frame_stride,
            max_frames=max_frames,
        ):
            landmark_rows.append(pose_frame.landmarks)
            timestamp_rows.append(pose_frame.timestamp_ms)

            processed += 1

            if progress_callback:
                estimated = min(
                    1.0,
                    (
                        pose_frame.frame_index
                        / max(total_frames, 1)
                    ),
                )
                progress_callback(estimated)

    except Exception as exc:
        raise RuntimeError(
            f"Pose analysis failed: {exc}"
        ) from exc

    if landmark_rows:
        landmarks = np.stack(
            landmark_rows
        ).astype(
            np.float32,
            copy=False,
        )
        from core.pose_extend import extend_landmarks

        landmarks = extend_landmarks(landmarks)

        timestamps = np.asarray(
            timestamp_rows,
            dtype=np.int32,
        )
    else:
        landmarks = np.empty(
            (0, 35, 4),
            dtype=np.float32,
        )

        timestamps = np.empty(
            (0,),
            dtype=np.int32,
        )

    duration = float(total_frames / fps)

    return PoseAnalysisResult(
        fps=float(fps),
        frame_count=int(total_frames),
        processed_frames=int(processed),
        duration_seconds=duration,
        landmarks=landmarks,
        timestamps_ms=timestamps,
    )


# ---------------------------------------------------------------------
# Visualization
# ---------------------------------------------------------------------

def draw_pose(
    frame: np.ndarray,
    landmarks: np.ndarray,
) -> np.ndarray:
    """
    Draw a compact skeleton using OpenCV.

    Does not require MediaPipe drawing utilities.
    """

    output = frame.copy()

    if landmarks.ndim != 2 or landmarks.shape[0] < 33 or landmarks.shape[1] != 4:
        return output

    height, width = output.shape[:2]

    connections = [
        (11, 12),
        (11, 13),
        (13, 15),
        (12, 14),
        (14, 16),
        (11, 23),
        (12, 24),
        (23, 24),
        (23, 25),
        (24, 26),
        (25, 27),
        (26, 28),
        (27, 31),
        (28, 32),
    ]

    extra = [(0, 33), (31, 34), (32, 34)] if landmarks.shape[0] >= 35 else []
    connections = connections + extra

    for start, end in connections:
        x1 = int(landmarks[start, 0] * width)
        y1 = int(landmarks[start, 1] * height)
        x2 = int(landmarks[end, 0] * width)
        y2 = int(landmarks[end, 1] * height)
        cv2.line(output, (x1, y1), (x2, y2), (0, 220, 120), 2)

    for i in range(min(landmarks.shape[0], 35)):
        visibility = landmarks[i, 3]
        if visibility < 0.3:
            continue
        x = int(landmarks[i, 0] * width)
        y = int(landmarks[i, 1] * height)
        cv2.circle(output, (x, y), 3, (255, 255, 255), -1)

    return output
