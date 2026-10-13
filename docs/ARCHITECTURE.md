# KICKAI architecture

```
                    KICKAI CORE (Python)
                         |
       ┌─────────────────┼──────────────────┐
       │                 │                  │
   Streamlit UI       api.server       Local engine
       │                 │                  │
   Windows shell      Android client     Linux/Tauri
```

## Core engine

- `core/world.py` — synchronized `WorldState` (players, ball, environment, tactics, quality).
- `core/math_engine.py` — geometry, probability, kinematics, 3D parabola.
- `core/physics_engine.py` — F=ma, momentum, energy, inertia / turning radius.
- `core/tactics.py` — options, EV, explanations (quick/coach/analyst/technical).
- `core/xg.py` — logistic xG (distance, angle, defender density) from existing research export.
- `core/video.py` — `VideoSource` implementations.
- `core/tracking.py` — detection/association with `Origin` + `Visibility`.
- `core/training.py` — adaptive drills; audio never required.
- `core/provenance.py` — OBSERVED / INFERRED / ESTIMATED / SIMULATED / PREDICTED / UNAVAILABLE.
- `core/engine.py` — facade used by UI and API.

## Data flow

```
VideoSource.read()
  → FrameTracker.world_from_frame()   # or CSV ingest / SIMULATED snapshot
  → WorldState
  → TacticalEngine.decide()
  → DecisionReport + overlay + coach override + memory
```

LLM policy: none in the numeric path. Knowledge Hub remains local retrieval.

## Model boundaries

| Task | Model | Claim |
| --- | --- | --- |
| Pose | MediaPipe PoseLandmarker lite | OBSERVED landmarks |
| People | OpenCV HOG | ESTIMATED |
| Ball | Hough circles | ESTIMATED, often UNAVAILABLE |
| Match | Elo + Poisson xG MC | EXPERIMENTAL |
| Shot MC | Bernoulli per xG | EXPERIMENTAL |
| Skill DTW | NumPy DTW | EXPERIMENTAL |
| ST-GCN | `extra/` only | RESEARCH, not default |

## Uncertainty

Every `DecisionReport` includes confidence, quality, failure modes, and provenance. Off-camera `xy` is `None`.

## Clients

All clients should call `KickAIEngine` or HTTP `/v1/*`. Do not reimplement tactics in the APK/EXE.
