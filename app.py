from __future__ import annotations

import streamlit as st

from core.ai_face import render_talking_face
from core.design import THEMES, streamlit_css
from core.voice_coach import expression_for, speech_for_answer

st.set_page_config(
    page_title="KICKAI | Football Intelligence",
    page_icon="⚽",
    layout="wide",
    initial_sidebar_state="expanded",
)

if "kickai_theme" not in st.session_state:
    st.session_state["kickai_theme"] = "black"

with st.sidebar:
    theme_key = st.selectbox(
        "Signature theme",
        options=list(THEMES.keys()),
        format_func=lambda k: THEMES[k].name,
        index=["black", "white", "army_blue"].index(st.session_state["kickai_theme"]),
    )
    st.session_state["kickai_theme"] = theme_key

theme = THEMES[st.session_state["kickai_theme"]]
st.markdown(streamlit_css(theme), unsafe_allow_html=True)

st.markdown(
    '<div class="kickai-title">⚽ <span class="kickai-green">KICK</span>AI</div>',
    unsafe_allow_html=True,
)

st.markdown(
    """
    <div class="subtitle">
        Football intelligence and coaching OS — player, ball, space, time, uncertainty.
    </div>
    """,
    unsafe_allow_html=True,
)

hero_left, hero_right = st.columns([2.2, 1])

with hero_left:
    st.markdown("## Football intelligence. Built for action.")
    st.write(
        """
        KICKAI combines probabilistic match simulation, player analytics,
        computer-vision pose analysis, video tracking and a physics-aware
        tactical engine into one coaching platform.
        """
    )
    st.success(
        "Use the sidebar to open Match Simulations, Pose Analysis, Knowledge Hub, "
        "Video Intelligence, Live Match, Tactical Lab and Training Lab."
    )

with hero_right:
    if "kickai_speech" not in st.session_state:
        st.session_state["kickai_speech"] = (
            "KICKAI online. Ask me a football question, or press Listen and speak."
        )
        st.session_state["kickai_expr"] = "idle"
        st.session_state["kickai_autoplay"] = False
    render_talking_face(
        speech=st.session_state["kickai_speech"],
        expression=st.session_state["kickai_expr"],
        autoplay=st.session_state["kickai_autoplay"],
        enable_mic=True,
    )
    face_q = st.text_input("Ask KICKAI", placeholder="e.g. Arsenal vs Liverpool prediction")
    if st.button("Talk", type="primary", use_container_width=True) and face_q.strip():
        try:
            from knowledge.rag_hub import get_knowledge_hub

            result = get_knowledge_hub().answer(face_q.strip(), search_internet=True)
            st.session_state["kickai_speech"] = speech_for_answer(
                face_q, result.get("answer", ""), result.get("origin")
            )
            st.session_state["kickai_expr"] = expression_for(
                face_q, result.get("origin")
            )
            st.session_state["kickai_autoplay"] = True
            st.rerun()
        except Exception as exc:
            st.session_state["kickai_speech"] = f"I hit a problem: {exc}"
            st.session_state["kickai_expr"] = "concerned"
            st.session_state["kickai_autoplay"] = True
            st.rerun()
    st.caption("Audio uses the browser voice. Click Speak if the browser blocks autoplay. Listen needs Chrome/Edge mic permission.")
    st.markdown(
        """
        <div class="card">
            <h3> KICKAI CORE</h3>
            <p>Shared engine for Streamlit, API, desktop and mobile clients.
            Geometry and probability are computed in code — not by an LLM.</p>
        </div>
        """,
        unsafe_allow_html=True,
    )

st.markdown("## Platform")

modules = [
    ("🎯 Match Simulations", "Elo + xG + Monte Carlo match projection."),
    ("🦵 Pose Analysis", "MediaPipe PoseLandmarker, joint angles, DTW-ready coaching."),
    ("📚 Knowledge Hub", "Local football rules and coaching retrieval."),
    ("🎬 Video Intelligence", "Pluggable video sources, estimated tracking, overlays."),
    ("📡 Live Match", "Webcam/RTSP/network loop into the same world model."),
    ("🧠 Tactical Lab", "Options, expected value, explanations, coach override."),
    ("🏋️ Training Lab", "Adaptive drills; audio optional, visual always available."),
    ("🚀 Experimental Lab", "Families, red-team, TacticAI limitation strategies."),
]

cols = st.columns(2)
for i, (title, desc) in enumerate(modules):
    with cols[i % 2]:
        st.markdown(
            f"""
            <div class="card">
                <h3>{title}</h3>
                <p>{desc}</p>
            </div>
            """,
            unsafe_allow_html=True,
        )

st.markdown("## KICKAI architecture")

m1, m2, m3, m4 = st.columns(4)
metrics = [
    ("10,000", "Monte Carlo simulations"),
    ("640×480", "Pose processing resolution"),
    ("2×", "Default frame stride"),
    ("33+2", "Pose landmarks (2 estimated)"),
]
for column, (value, label) in zip((m1, m2, m3, m4), metrics):
    with column:
        st.markdown(
            f"""
            <div class="metric-card">
                <div class="metric-value">{value}</div>
                <div class="metric-label">{label}</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

st.markdown("---")
st.caption(
    "KICKAI is an analytical and coaching support system. "
    "Predictions are probabilistic. Simulated/estimated outputs are labeled. "
    "The AI is not the authority — coaches can reject or replace any recommendation. "
    f"Active theme: {theme.name}."
)
