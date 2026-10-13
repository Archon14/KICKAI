from __future__ import annotations

import sys
import tempfile
from pathlib import Path

import cv2
import numpy as np
import pandas as pd
import streamlit as st

ROOT = Path(__file__).resolve().parents[1]

if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from core.math_engine import angle_abc
from core.pose_engine import (
    MAX_HEIGHT,
    MAX_WIDTH,
    analyze_video,
)
from core.pose_extend import LANDMARK_NAMES, KICKAI_LANDMARKS
from core.training import AdaptiveCoach


st.set_page_config(
    page_title="KICKAI | Pose Analysis",
    page_icon="🦵",
    layout="wide",
)

st.title("🦵 Pose Analysis")
st.caption(
    "Computer-vision movement analysis using MediaPipe PoseLandmarker."
)

# ---------------------------------------------------------------------
# Locate model
# ---------------------------------------------------------------------

MODEL_PATH = (
    ROOT
    / "assets"
    / "pose_landmarker_lite.task"
)

# ---------------------------------------------------------------------
# Sidebar
# ---------------------------------------------------------------------

with st.sidebar:
    st.header("Analysis Settings")

    frame_stride = st.slider(
        "Frame stride",
        min_value=1,
        max_value=5,
        value=2,
        help=(
            "Process every Nth frame. Higher values reduce "
            "CPU and memory pressure."
        ),
    )

    max_frames = st.slider(
        "Maximum processed frames",
        min_value=100,
        max_value=1500,
        value=800,
        step=100,
    )

    detection_confidence = st.slider(
        "Detection confidence",
        min_value=0.1,
        max_value=0.9,
        value=0.5,
        step=0.05,
    )

    st.info(
        "Recommended cloud settings: 640×480 maximum resolution "
        "and frame stride 2."
    )

# ---------------------------------------------------------------------
# Model status
# ---------------------------------------------------------------------

if not MODEL_PATH.exists():
    st.error(
        "MediaPipe model is missing."
    )

    st.code(
        "assets/pose_landmarker_lite.task"
    )

    st.info(
        "Place the PoseLandmarker model at the path above before "
        "running pose analysis."
    )

    st.stop()

st.success(
    "PoseLandmarker model detected."
)

# ---------------------------------------------------------------------
# Upload
# ---------------------------------------------------------------------

uploaded_file = st.file_uploader(
    "Upload football training video",
    type=[
        "mp4",
        "mov",
        "avi",
        "mkv",
    ],
    help=(
        "For low-resource deployment, short clips are recommended."
    ),
)

if uploaded_file is None:
    st.info(
        "Upload a video to begin analysis."
    )
    st.stop()

# ---------------------------------------------------------------------
# Save upload temporarily
# ---------------------------------------------------------------------

try:
    suffix = Path(
        uploaded_file.name
    ).suffix.lower() or ".mp4"

    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=suffix,
    ) as temp_file:
        temp_file.write(
            uploaded_file.getbuffer()
        )
        temp_video_path = temp_file.name

except Exception as exc:
    st.error(
        f"Unable to save uploaded video: {exc}"
    )
    st.stop()

# ---------------------------------------------------------------------
# Basic video information
# ---------------------------------------------------------------------

capture = cv2.VideoCapture(
    temp_video_path
)

if not capture.isOpened():
    st.error(
        "The uploaded file could not be opened as a video."
    )
    st.stop()

fps = capture.get(cv2.CAP_PROP_FPS)
frame_count = capture.get(
    cv2.CAP_PROP_FRAME_COUNT
)
width = int(
    capture.get(cv2.CAP_PROP_FRAME_WIDTH)
)
height = int(
    capture.get(cv2.CAP_PROP_FRAME_HEIGHT)
)

capture.release()

if not fps or fps <= 0:
    fps = 30.0

duration = (
    frame_count / fps
    if frame_count > 0
    else 0
)

m1, m2, m3, m4 = st.columns(4)

with m1:
    st.metric(
        "Resolution",
        f"{width}×{height}",
    )

with m2:
    st.metric(
        "FPS",
        f"{fps:.1f}",
    )

with m3:
    st.metric(
        "Duration",
        f"{duration:.1f}s",
    )

with m4:
    st.metric(
        "Frames",
        f"{int(frame_count):,}",
    )

st.video(
    uploaded_file
)

# ---------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------

if st.button(
    "🔍 Analyse Movement",
    type="primary",
    use_container_width=True,
):

    progress = st.progress(
        0.0,
        text="Preparing pose analysis...",
    )

    try:

        def update_progress(value: float):
            progress.progress(
                min(max(value, 0.0), 1.0),
                text=(
                    f"Processing video... "
                    f"{value:.0%}"
                ),
            )

        with st.spinner(
            "Running MediaPipe PoseLandmarker..."
        ):
            result = analyze_video(
                video_path=temp_video_path,
                model_path=str(MODEL_PATH),
                frame_stride=frame_stride,
                max_frames=max_frames,
                min_detection_confidence=(
                    detection_confidence
                ),
                min_presence_confidence=(
                    detection_confidence
                ),
                min_tracking_confidence=(
                    detection_confidence
                ),
                progress_callback=update_progress,
            )

        progress.progress(
            1.0,
            text="Analysis complete.",
        )

        if result.processed_frames == 0:
            st.warning(
                "No usable poses were detected. "
                "Try a clearer video with the player fully visible."
            )
            st.stop()

        st.session_state["pose_result"] = result

    except Exception as exc:
        progress.empty()

        st.error(
            f"Pose analysis failed: {exc}"
        )

result = st.session_state.get(
    "pose_result"
)

if result is None:
    st.stop()

# ---------------------------------------------------------------------
# Results
# ---------------------------------------------------------------------

st.divider()

st.subheader("Analysis Summary")

c1, c2, c3, c4 = st.columns(4)

with c1:
    st.metric(
        "Processed Frames",
        f"{result.processed_frames:,}",
    )

with c2:
    st.metric(
        "Pose Detection Rate",
        (
            f"{(
                result.processed_frames
                / max(
                    1,
                    int(result.frame_count / frame_stride),
                )
            ):.1%}"
        ),
    )

with c3:
    st.metric(
        "Landmarks / Frame",
        str(KICKAI_LANDMARKS),
    )

with c4:
    st.metric(
        "Processing Resolution",
        f"≤{MAX_WIDTH}×{MAX_HEIGHT}",
    )

# ---------------------------------------------------------------------
# Landmark data
# ---------------------------------------------------------------------

landmarks = result.landmarks

if landmarks.size == 0:
    st.warning(
        "No landmark data available."
    )
    st.stop()

# MediaPipe 33 + 2 estimated extras.
# LANDMARK_NAMES imported from core.pose_extend

# ---------------------------------------------------------------------
# Hip/knee movement curves
# ---------------------------------------------------------------------

st.subheader("Movement Curves")

selected_joint = st.selectbox(
    "Joint",
    options=list(
        LANDMARK_NAMES.keys()
    ),
    format_func=lambda x: LANDMARK_NAMES[x],
)

joint_y = landmarks[:, selected_joint, 1]

curve_df = pd.DataFrame(
    {
        "Frame": np.arange(
            len(joint_y)
        ),
        "Normalized Y": joint_y,
    }
)

st.line_chart(
    curve_df.set_index("Frame")
)

# ---------------------------------------------------------------------
# Joint angles
# ---------------------------------------------------------------------

def calculate_angle(
    a: np.ndarray,
    b: np.ndarray,
    c: np.ndarray,
) -> np.ndarray:
    return angle_abc(a, b, c)


st.subheader("Biomechanics")

joint_choice = st.selectbox(
    "Angle",
    [
        "Left Knee",
        "Right Knee",
        "Left Elbow",
        "Right Elbow",
    ],
)

angle_map = {
    "Left Knee": (23, 25, 27),
    "Right Knee": (24, 26, 28),
    "Left Elbow": (11, 13, 15),
    "Right Elbow": (12, 14, 16),
}

a, b, c = angle_map[
    joint_choice
]

angles = calculate_angle(
    landmarks[:, a, :3],
    landmarks[:, b, :3],
    landmarks[:, c, :3],
)

angle_df = pd.DataFrame(
    {
        "Frame": np.arange(
            len(angles)
        ),
        "Angle": angles,
    }
)

st.line_chart(
    angle_df.set_index("Frame")
)

a1, a2, a3 = st.columns(3)

with a1:
    st.metric(
        "Mean Angle",
        f"{np.mean(angles):.1f}°",
    )

with a2:
    st.metric(
        "Minimum",
        f"{np.min(angles):.1f}°",
    )

with a3:
    st.metric(
        "Maximum",
        f"{np.max(angles):.1f}°",
    )

# ---------------------------------------------------------------------
# Coaching feedback
# ---------------------------------------------------------------------

st.subheader("AI Coaching Insights")

mean_angle = float(
    np.mean(angles)
)

angle_range = float(
    np.max(angles) - np.min(angles)
)

if "Knee" in joint_choice:

    if mean_angle < 100:
        feedback = (
            "The selected knee shows a relatively compact average "
            "angle. Consider checking whether the movement requires "
            "greater extension."
        )

    elif mean_angle > 160:
        feedback = (
            "The selected knee remains relatively extended. "
            "For explosive actions, examine whether sufficient "
            "flexion occurs during loading."
        )

    else:
        feedback = (
            "The selected knee demonstrates a moderate movement "
            "range. Compare the curve against a benchmark movement "
            "for more meaningful coaching feedback."
        )

else:
    feedback = (
        "Upper-limb movement has been extracted. Compare the "
        "movement curve with a benchmark execution to identify "
        "timing and range differences."
    )

st.info(
    feedback
)

plan = AdaptiveCoach().from_pose_angles(angles, joint_choice)
st.caption(
    f"Training lab suggestion ({plan.claim.value}): {plan.drill.name} — {plan.feedback}"
)

st.caption(
    "MediaPipe Pose outputs 33 landmarks. Points 33 (cranial apex) and 34 (strike foot) "
    "are ESTIMATED from those 33 — they are not extra cameras or a 35-point MediaPipe model."
)
