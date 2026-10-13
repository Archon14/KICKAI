# KICKAI engineering status

## DONE
- Existing Streamlit features preserved: Match Simulations, Pose Analysis, Knowledge Hub, Future Solutions, homepage identity.
- Shared `KickAIEngine`: world state, geometry/physics, xG logistic, DTW, Elo helper, tactical options, training coach, coach override, provenance.
- VideoSource abstraction (file/webcam/RTSP/network/phone URL).
- ESTIMATED HOG+Hough tracking; off-camera coordinates not invented.
- API: `python -m api.server` (`/health`, `/v1/lab`, `/v1/analyze`, `/v1/redteam`).
- Themes: BLACK SIGNATURE, WHITE SIGNATURE, ARMY BLUE.
- Unit tests: `python -m unittest tests.test_core`.
- Shot-level Bernoulli Monte Carlo restored from research notebook (labeled experimental).

## IN PROGRESS
- Live webcam/RTSP on Windows (depends on local devices).
- Pitch calibration (image→metre). Identity association.

## BLOCKED
- League-calibrated xG / broadcast tracking weights (no licensed tracking feed).
- ST-GCN ONNX in `extra/` is gitignored; not a product default.
- Android APK / Windows EXE not produced on this machine (scripts + docs only).

## EXPERIMENTAL
- Tactical probabilities from geometry+xG+fatigue.
- Adaptive training difficulty.
- Red-team chaotic worlds.

## NEEDS REAL DATA
- Player identity, ball spin, weather, audio comms, biometric fatigue.

## KNOWN LIMITATIONS
- HOG is not a football detector; far-side players missing.
- Simulated lab world is labeled SIMULATED.
- Pose analysis still single-person MediaPipe VIDEO mode.
- Knowledge Hub is keyword retrieval, not an LLM.

## NEXT PRIORITIES
1. Optional YOLO if present, else keep HOG.
2. Homography calibration from 4 pitch clicks.
3. ByteTrack-style association when detections exist.
4. PyInstaller smoke build on Windows with a working venv.
