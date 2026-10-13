"""MediaPipe Pose is 33 landmarks. Extra points are ESTIMATED, not model outputs."""

from __future__ import annotations

import numpy as np

MEDIAPIPE_LANDMARKS = 33
KICKAI_LANDMARKS = 35

LANDMARK_NAMES = {
    0: "Nose",
    11: "Left Shoulder",
    12: "Right Shoulder",
    13: "Left Elbow",
    14: "Right Elbow",
    15: "Left Wrist",
    16: "Right Wrist",
    23: "Left Hip",
    24: "Right Hip",
    25: "Left Knee",
    26: "Right Knee",
    27: "Left Ankle",
    28: "Right Ankle",
    31: "Left Foot",
    32: "Right Foot",
    33: "Cranial apex (ESTIMATED)",
    34: "Strike foot (ESTIMATED)",
}


def extend_landmarks(landmarks: np.ndarray) -> np.ndarray:
    """
    Append two derived points:
      33 — cranial apex (above the nose, using ear/shoulder geometry)
      34 — strike-foot proxy (ahead of the dominant foot index)

    Input shape (..., 33, 4) or (33, 4). Output last dim stays 4: x,y,z,visibility.
    """
    arr = np.asarray(landmarks, dtype=np.float32)
    if arr.ndim == 2:
        arr = arr[None, ...]
        squeeze = True
    else:
        squeeze = False
    if arr.shape[-2] >= KICKAI_LANDMARKS:
        return arr[0] if squeeze else arr
    if arr.shape[-2] != MEDIAPIPE_LANDMARKS:
        raise ValueError(f"Expected 33 landmarks, got {arr.shape[-2]}")

    n = arr.shape[0]
    extra = np.zeros((n, 2, 4), dtype=np.float32)

    nose = arr[:, 0]
    l_ear = arr[:, 7]
    r_ear = arr[:, 8]
    ear_mid = 0.5 * (l_ear + r_ear)
    up = nose - ear_mid
    extra[:, 0, :3] = nose[:, :3] + up[:, :3]
    extra[:, 0, 3] = np.minimum(nose[:, 3], 0.5 * (l_ear[:, 3] + r_ear[:, 3])) * 0.7

    l_foot = arr[:, 31]
    r_foot = arr[:, 32]
    l_ankle = arr[:, 27]
    r_ankle = arr[:, 28]
    left_conf = l_foot[:, 3]
    use_left = left_conf >= r_foot[:, 3]
    foot = np.where(use_left[:, None], l_foot, r_foot)
    ankle = np.where(use_left[:, None], l_ankle, r_ankle)
    forward = foot[:, :3] - ankle[:, :3]
    extra[:, 1, :3] = foot[:, :3] + 0.35 * forward
    extra[:, 1, 3] = np.minimum(foot[:, 3], ankle[:, 3]) * 0.65

    out = np.concatenate([arr, extra], axis=1)
    return out[0] if squeeze else out
