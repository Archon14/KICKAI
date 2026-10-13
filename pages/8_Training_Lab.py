from __future__ import annotations

import sys
from pathlib import Path

import streamlit as st

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from core.design import BLACK_SIGNATURE, streamlit_css
from core.training import TEAM_THEMES, AdaptiveCoach

st.set_page_config(page_title="KICKAI | Training Lab", page_icon="🏋️", layout="wide")
st.markdown(streamlit_css(BLACK_SIGNATURE), unsafe_allow_html=True)

st.title("🏋️ Training Lab")
st.caption("Audio cues are optional. Visual timers, arrows and flashing zones always work.")

if "coach" not in st.session_state:
    st.session_state["coach"] = AdaptiveCoach()

coach: AdaptiveCoach = st.session_state["coach"]
mode = st.radio("Feedback channel", ["Visual only (no audio)", "Visual + optional audio"], horizontal=True)
audio_ok = mode.startswith("Visual +")

col1, col2 = st.columns(2)
with col1:
    if st.button("Mark success", type="primary", use_container_width=True):
        st.session_state["plan"] = coach.observe(True)
with col2:
    err = st.selectbox("If failed, likely error", list(
        ["late", "heavy_touch", "closed_body", "no_scan", "overhit", "underhit"]
    ))
    if st.button("Mark failure", use_container_width=True):
        st.session_state["plan"] = coach.observe(False, err)

plan = st.session_state.get("plan")
if plan:
    st.subheader(plan.drill.name)
    st.metric("Difficulty", f"{plan.next_difficulty:.2f}")
    st.write(plan.feedback)
    st.write("Repetitions:", plan.drill.repetitions)
    st.write("Visual cues:", ", ".join(plan.drill.visual_cues))
    if audio_ok:
        st.write("Optional audio:", ", ".join(plan.drill.audio_cues))
    else:
        st.info("Microphone/headphones not required. Using visual cues only.")
    st.caption(f"Audio required? {plan.audio_required} | {plan.claim.value}")

st.divider()
st.subheader("Team themes")
st.write(", ".join(TEAM_THEMES))
