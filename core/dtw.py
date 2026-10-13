"""Vectorized DTW used for pose/skill comparison (from existing research notebook)."""

from __future__ import annotations

import numpy as np


def compute_dtw_distance(user_seq, expert_seq) -> tuple[float, float]:
    user = np.asarray(user_seq, dtype=np.float32)
    expert = np.asarray(expert_seq, dtype=np.float32)
    if user.ndim == 1:
        user = user[:, None]
    if expert.ndim == 1:
        expert = expert[:, None]
    n, m = len(user), len(expert)
    if n == 0 or m == 0:
        return float("inf"), 0.0
    dists = np.linalg.norm(user[:, None, :] - expert[None, :, :], axis=2)
    cost = np.full((n + 1, m + 1), np.inf, dtype=np.float32)
    cost[0, 0] = 0.0
    for i in range(1, n + 1):
        di = dists[i - 1]
        for j in range(1, m + 1):
            cost[i, j] = di[j - 1] + min(
                cost[i - 1, j],
                cost[i, j - 1],
                cost[i - 1, j - 1],
            )
    distance = float(cost[n, m])
    score = max(0.0, 100.0 - (distance / (n + m) * 10.0))
    return distance, score
