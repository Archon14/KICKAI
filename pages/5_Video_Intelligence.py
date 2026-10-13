from __future__ import annotations

import cv2
import numpy as np
import pandas as pd
import streamlit as st
from pathlib import Path
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from core.design import BLACK_SIGNATURE, streamlit_css
from core.engine import KickAIEngine
from core.formations import recommend_formations
from core.hover_board import apply_name_map, coordinate_table, hover_pitch_figure
from core.overlay import render_overlay
from core.tracking import FrameTracker
from core.video import FileVideoSource
from core.world import simulated_attacking_third

st.set_page_config(page_title="KICKAI | Video Intelligence", page_icon="🎬", layout="wide")
st.markdown(streamlit_css(BLACK_SIGNATURE), unsafe_allow_html=True)

st.title("🎬 Video Intelligence")
st.caption(
    "Upload a clip. Detection uses OpenCV HOG (people) and Hough circles (ball). "
    "Outputs are ESTIMATED image-space tracks — not broadcast-quality identities."
)

uploaded = st.file_uploader("Match / training clip", type=["mp4", "mov", "avi", "mkv"])
use_sim = st.checkbox("Show SIMULATED tactical overlay (no tracking required)", value=not bool(uploaded))

if "player_names" not in st.session_state:
    st.session_state["player_names"] = {}

engine = KickAIEngine()

if use_sim:
    state = apply_name_map(simulated_attacking_third(7), st.session_state["player_names"])
    report = engine.analyze_state(state)
    canvas = render_overlay(
        np.zeros((420, 680, 3), dtype=np.uint8) + 12,
        state,
        engine.tactics.decide(state).recommendation,
    )
    st.image(canvas[:, :, ::-1], caption=f"Origin: {state.provenance.origin.value}")
    st.dataframe(coordinate_table(state), use_container_width=True, hide_index=True)
    st.plotly_chart(hover_pitch_figure(state, "Hover a player"), use_container_width=True)
    if report["recommendation"]:
        st.success(f"Recommendation: {report['recommendation']['action']}")
        st.write(report["recommendation"]["why"]["quick"])
        st.caption("Claim: " + report["claim"])
    rec = recommend_formations(state, "home")
    st.caption(f"Best formation (experimental): {rec['best']}")
    st.dataframe(pd.DataFrame(rec["options"][:4]), hide_index=True, use_container_width=True)

if uploaded is not None:
    suffix = Path(uploaded.name).suffix.lower() or ".mp4"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(uploaded.getbuffer())
        path = tmp.name
    src = FileVideoSource(path)
    meta = src.metadata()
    st.write(f"{meta.width}×{meta.height} @ {meta.fps:.1f} fps ({meta.source_type})")
    stride = st.slider("Frame stride", 1, 8, 3)
    if st.button("Estimate tracks on sample frames", type="primary"):
        tracker = FrameTracker()
        frames_out = []
        last_issues: list[str] = []
        src.open()
        try:
            i = 0
            kept = 0
            while kept < 6:
                ok, frame = src.read()
                if not ok:
                    break
                if i % stride == 0:
                    world = tracker.world_from_frame(
                        frame,
                        i / max(meta.fps, 1.0),
                        engine.diagnostics,
                        name_map=st.session_state["player_names"],
                    )
                    st.session_state["video_world"] = world
                    last_issues = world.quality.issues
                    frames_out.append(render_overlay(frame, world))
                    kept += 1
                i += 1
        finally:
            src.close()
        if not frames_out:
            st.error("No frames decoded.")
        else:
            if last_issues:
                st.warning(last_issues[0])
            for img in frames_out:
                st.image(cv2.cvtColor(img, cv2.COLOR_BGR2RGB), use_container_width=True)
            st.json(engine.diagnostics.as_dict())
            st.caption("Ball/player IDs are ESTIMATED. Off-camera players are not invented.")
            world = st.session_state.get("video_world")
            if world is not None:
                st.dataframe(coordinate_table(world), use_container_width=True, hide_index=True)
                st.plotly_chart(hover_pitch_figure(world), use_container_width=True)
