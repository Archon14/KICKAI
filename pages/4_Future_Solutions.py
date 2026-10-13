from __future__ import annotations

import streamlit as st


st.set_page_config(
    page_title="KICKAI | Future Solutions",
    page_icon="🚀",
    layout="wide",
)

st.title("🚀 Future Solutions")

st.caption(
    "Experimental AI capabilities planned for future KICKAI releases."
)

# ---------------------------------------------------------------------
# Modules
# ---------------------------------------------------------------------

modules = [
    (
        "🧠 Tactical Shape Recognition",
        "Automatically identify formations and team shape from match footage.",
        "Computer Vision",
    ),
    (
        "🗺️ Automated Heatmaps",
        "Generate player movement and positional heatmaps from tracking data.",
        "Tracking",
    ),
    (
        "🔗 Passing Network",
        "Build passing networks to identify key playmakers and structural weaknesses.",
        "Event Analytics",
    ),
    (
        "⚡ Sprint Detection",
        "Detect acceleration, sprint phases and high-intensity movement.",
        "Performance",
    ),
    (
        "🎯 Shot Quality Engine",
        "Estimate shot quality using location, angle, pressure and contextual features.",
        "xG",
    ),
    (
        "🤖 AI Training Planner",
        "Convert player weaknesses into personalised football training sessions.",
        "Coaching AI",
    ),
    (
        "👥 Multi-Player Tracking",
        "Track player positions across a full match for tactical analysis.",
        "Computer Vision",
    ),
    (
        "🔍 Opposition Intelligence",
        "Identify recurring opposition patterns, strengths and vulnerabilities.",
        "Scouting",
    ),
]

# ---------------------------------------------------------------------
# Display
# ---------------------------------------------------------------------

for index in range(
    0,
    len(modules),
    2,
):
    left, right = st.columns(2)

    title, description, category = modules[index]

    with left:
        with st.container(border=True):
            st.markdown(f"### {title}")
            st.write(description)
            st.caption(category)

    if index + 1 < len(modules):
        title, description, category = modules[index + 1]

        with right:
            with st.container(border=True):
                st.markdown(f"### {title}")
                st.write(description)
                st.caption(category)

# ---------------------------------------------------------------------
# Roadmap
# ---------------------------------------------------------------------

st.subheader("Now in the product (experimental / labeled)")
st.markdown(
    "- Video Intelligence and Live Match (HOG/Hough ESTIMATED tracking)\n"
    "- Tactical Lab with computed option probabilities\n"
    "- Training Lab with adaptive difficulty\n"
    "- Experimental Lab families + red team"
)

st.divider()

st.subheader("KICKAI Roadmap")

roadmap = {
    "Current": [
        "Monte Carlo match simulation",
        "Elo + xG prediction",
        "PoseLandmarker analysis",
        "Joint-angle analysis",
        "Lightweight football knowledge retrieval",
    ],
    "Next": [
        "DTW benchmark comparison",
        "Player event analytics",
        "Passing networks",
        "Automated heatmaps",
    ],
    "Future": [
        "Multi-player tracking",
        "Tactical recognition",
        "AI-generated training plans",
        "Opposition scouting intelligence",
    ],
}

for phase, items in roadmap.items():
    st.markdown(f"### {phase}")

    for item in items:
        st.markdown(
            f"- {item}"
        )
