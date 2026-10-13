from __future__ import annotations

import sys
import time
from pathlib import Path

import cv2
import pandas as pd
import streamlit as st

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from core.ai_face import render_talking_face
from core.design import BLACK_SIGNATURE, streamlit_css
from core.engine import KickAIEngine
from core.formations import recommend_formations
from core.hover_board import apply_name_map, coordinate_table, hover_pitch_figure
from core.overlay import render_overlay
from core.tracking import FrameTracker
from core.video import open_source

st.set_page_config(page_title="KICKAI | Live Match", page_icon="📡", layout="wide")
st.markdown(streamlit_css(BLACK_SIGNATURE), unsafe_allow_html=True)

left, right = st.columns([3, 1])
with left:
    st.title("📡 Live Match")
    st.caption(
        "Live ball/player coordinates from HOG + Hough. Hover the plot for stats. "
        "Rename tracks in the text boxes. Coordinates are image pixels unless calibrated."
    )
with right:
    render_talking_face(
        speech="Live match mode. I will react if tracking quality drops.",
        expression="idle",
        autoplay=False,
        enable_mic=True,
        height=400,
    )

if "player_names" not in st.session_state:
    st.session_state["player_names"] = {}

kind = st.selectbox("Source", ["webcam", "rtsp", "network", "phone"])
target = st.text_input("Device index or URL", value="0" if kind == "webcam" else "rtsp://")
frames = st.slider("Max frames this run", 5, 60, 12)
stride = st.slider("Stride", 1, 5, 2)

if st.button("Start live sample", type="primary"):
    engine = KickAIEngine()
    tracker = FrameTracker()
    placeholder = st.empty()
    stats = st.empty()
    try:
        tgt: str | int = int(target) if kind == "webcam" else target
        src = open_source(kind, tgt)
        src.open()
        i = 0
        kept = 0
        t0 = time.perf_counter()
        last_world = None
        try:
            while kept < frames:
                t1 = time.perf_counter()
                ok, frame = src.read()
                if not ok or frame is None:
                    engine.diagnostics.dropped_frames += 1
                    break
                if i % stride != 0:
                    i += 1
                    continue
                world = tracker.world_from_frame(
                    frame,
                    time.perf_counter() - t0,
                    engine.diagnostics,
                    name_map=st.session_state["player_names"],
                )
                last_world = world
                vis = render_overlay(frame, world)
                placeholder.image(cv2.cvtColor(vis, cv2.COLOR_BGR2RGB), use_container_width=True)
                engine.diagnostics.mark_frame((time.perf_counter() - t1) * 1000)
                stats.json(engine.diagnostics.as_dict())
                kept += 1
                i += 1
        finally:
            src.close()
        if kept == 0:
            st.error("Capture produced no frames. Check camera permissions or the RTSP URL.")
        else:
            st.session_state["live_world"] = last_world
            st.info("Live sample complete. Tracking remains ESTIMATED (HOG/Hough).")
    except Exception as exc:
        st.error(f"Live source failed: {exc}")

world = st.session_state.get("live_world")
if world is not None:
    world = apply_name_map(world, st.session_state["player_names"])
    st.subheader("Live coordinates")
    st.dataframe(coordinate_table(world), use_container_width=True, hide_index=True)
    st.plotly_chart(hover_pitch_figure(world, "Hover a player for stats"), use_container_width=True)

    st.subheader("Rename players")
    cols = st.columns(min(4, max(1, len(world.players))))
    for i, player in enumerate(world.players):
        with cols[i % len(cols)]:
            new_name = st.text_input(
                player.profile.player_id,
                value=st.session_state["player_names"].get(
                    player.profile.player_id, player.profile.name
                ),
                key=f"name_{player.profile.player_id}",
            )
            st.session_state["player_names"][player.profile.player_id] = new_name

    st.subheader("Best formations (experimental catalog)")
    rec = recommend_formations(world, "unknown")
    st.write(f"Suggested: **{rec['best']}** ({rec['claim']})")
    st.dataframe(
        pd.DataFrame(rec["options"]),
        use_container_width=True,
        hide_index=True,
    )
