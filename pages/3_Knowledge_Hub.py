from __future__ import annotations

import sys
from pathlib import Path

import streamlit as st


# ============================================================
# PROJECT PATH
# ============================================================

ROOT = Path(__file__).resolve().parents[1]

if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


# ============================================================
# KICKAI KNOWLEDGE ENGINE
# ============================================================

from knowledge.rag_hub import get_knowledge_hub, reload_knowledge_hub
from knowledge.web_ingest import refresh_knowledge_base, stored_metadata
from core.ai_face import render_talking_face
from core.voice_coach import expression_for, speech_for_answer


# ============================================================
# PAGE CONFIG
# ============================================================

st.set_page_config(
    page_title="KICKAI | Knowledge Hub",
    page_icon="📚",
    layout="wide",
    initial_sidebar_state="expanded",
)


# ============================================================
# CUSTOM CSS
# ============================================================

st.markdown(
    """
    <style>

    .knowledge-hero {
        background: linear-gradient(
            135deg,
            #0b2117,
            #102d20
        );

        border: 1px solid #1c5738;
        border-radius: 18px;

        padding: 30px;

        margin-bottom: 25px;
    }

    .knowledge-title {
        color: #21d47b;
        font-size: 2.7rem;
        font-weight: 800;
        margin-bottom: 5px;
    }

    .knowledge-subtitle {
        color: #a7b5ae;
        font-size: 1.05rem;
    }

    .source-card {
        background: #0d1b15;
        border: 1px solid #1b3a2b;
        border-radius: 12px;
        padding: 15px;
        margin-bottom: 10px;
    }

    .source-title {
        color: #21d47b;
        font-weight: 700;
    }

    </style>
    """,
    unsafe_allow_html=True,
)


# ============================================================
# HEADER
# ============================================================

st.markdown(
    """
    <div class="knowledge-hero">

        <div class="knowledge-title">
            📚 KICKAI Knowledge Hub
        </div>

        <div class="knowledge-subtitle">
            Football rules, technical skills, tactics and coaching intelligence.
        </div>

    </div>
    """,
    unsafe_allow_html=True,
)


# ============================================================
# WEB INGEST (Wikipedia)
# ============================================================

with st.sidebar:
    st.header("Internet knowledge")
    meta = stored_metadata()
    st.caption(
        f"Stored web articles: {meta.get('count', 0)}"
        + (f" · updated {meta['updated']}" if meta.get("updated") else "")
    )
    player_name = st.text_input(
        "Add player from Wikipedia",
        placeholder="e.g. Jude Bellingham",
    )
    if st.button("🌐 Update from internet", use_container_width=True):
        with st.spinner("Fetching Wikipedia articles (techniques + players)..."):
            try:
                extra = [player_name] if player_name.strip() else []
                summary = refresh_knowledge_base(extra_players=extra)
                reload_knowledge_hub()
                st.success(
                    f"Saved {summary['saved']} articles to the local knowledge index."
                )
            except Exception as exc:
                st.error(f"Web ingest failed: {exc}")
    st.session_state["search_internet"] = st.checkbox(
        "Search the internet on every question",
        value=st.session_state.get("search_internet", True),
    )
    st.caption(
        "Wikipedia articles are cached locally. Live questions also search the web via DuckDuckGo."
    )


# ============================================================
# LOAD KNOWLEDGE ENGINE
# ============================================================

try:
    hub = get_knowledge_hub()

except Exception as exc:

    st.error(
        f"Knowledge Hub could not be initialized: {exc}"
    )

    st.stop()


# ============================================================
# SESSION STATE
# ============================================================

if "knowledge_query" not in st.session_state:
    st.session_state["knowledge_query"] = ""
if "search_internet" not in st.session_state:
    st.session_state["search_internet"] = True


# ============================================================
# SEARCH INPUT
# ============================================================

st.subheader("Ask KICKAI")

face_col, ask_col = st.columns([1, 2])
with face_col:
    render_talking_face(
        speech=st.session_state.get("kickai_speech", "Ask a football question and I will speak the answer."),
        expression=st.session_state.get("kickai_expr", "idle"),
        autoplay=st.session_state.get("kickai_autoplay", False),
        enable_mic=True,
        height=400,
    )

query = st.text_input(
    "Football question",
    value=st.session_state.get(
        "knowledge_query",
        "",
    ),
    placeholder=(
        "Example: How can I improve my first touch?"
    ),
    label_visibility="collapsed",
)


# ============================================================
# SEARCH CONTROLS
# ============================================================

col1, col2 = st.columns(
    [3, 1]
)

with col1:

    search_button = st.button(
        "🔎 Ask (local + internet)",
        type="primary",
        use_container_width=True,
    )

with col2:

    top_k = st.selectbox(
        "Sources",
        options=[1, 2, 3, 4, 5],
        index=2,
    )


# ============================================================
# SEARCH
# ============================================================

if search_button:

    if not query.strip():

        st.warning(
            "Please enter a football question first."
        )

    else:

        st.session_state[
            "knowledge_query"
        ] = query

        with st.spinner(
            "Searching KICKAI knowledge..."
        ):

            try:

                result = hub.answer(
                    query=query,
                    top_k=top_k,
                    search_internet=st.session_state.get(
                        "search_internet",
                        True,
                    ),
                    include_match_prediction=True,
                )

            except Exception as exc:

                st.error(
                    f"Search failed: {exc}"
                )

                result = None

        if result:
            st.session_state["kickai_speech"] = speech_for_answer(
                query, result.get("answer", ""), result.get("origin")
            )
            st.session_state["kickai_expr"] = expression_for(
                query, result.get("origin")
            )
            st.session_state["kickai_autoplay"] = True
            st.session_state["last_knowledge_result"] = result
            st.rerun()

        elif result is None:
            st.session_state["kickai_speech"] = "Search failed. Please try again."
            st.session_state["kickai_expr"] = "concerned"
            st.session_state["kickai_autoplay"] = True

result = st.session_state.get("last_knowledge_result")
if result:

            st.divider()

            # ------------------------------------------------
            # ANSWER
            # ------------------------------------------------

            st.subheader("💡 KICKAI Answer")

            st.markdown(
                result["answer"]
            )

            # ------------------------------------------------
            # SOURCES
            # ------------------------------------------------

            st.divider()

            st.subheader("📖 Retrieved Sources")

            sources = result.get(
                "sources",
                [],
            )

            if not sources:

                st.info(
                    "No matching sources were found."
                )

            else:

                for source in sources:

                    with st.container(
                        border=True
                    ):

                        st.markdown(
                            f"### {source['title']}"
                        )

                        st.caption(
                            source["category"]
                        )

                        st.write(
                            f"**Source:** "
                            f"{source['source']}"
                        )

                        st.caption(
                            f"Retrieval score: "
                            f"{source['score']}"
                        )


# ============================================================
# QUICK TOPICS
# ============================================================

st.divider()

st.subheader("⚡ Quick Topics")

topics = [
    "Offside rules",
    "Passing technique",
    "First touch",
    "Shooting mechanics",
    "Defensive transition",
]


cols = st.columns(
    len(topics)
)


for column, topic in zip(
    cols,
    topics,
):

    with column:

        if st.button(
            topic,
            use_container_width=True,
        ):

            st.session_state[
                "knowledge_query"
            ] = topic

            st.rerun()


# ============================================================
# KNOWLEDGE CATEGORIES
# ============================================================

st.divider()

st.subheader("Knowledge Categories")

cat1, cat2, cat3, cat4 = st.columns(4)


with cat1:

    st.markdown("### 📜")

    st.markdown(
        "**IFAB Rules**"
    )

    st.caption(
        "Laws of the Game and match regulations."
    )


with cat2:

    st.markdown("### ⚽")

    st.markdown(
        "**Technical Skills**"
    )

    st.caption(
        "Passing, receiving, shooting and ball control."
    )


with cat3:

    st.markdown("### 🧠")

    st.markdown(
        "**Tactics**"
    )

    st.caption(
        "Shape, transitions, pressing and positioning."
    )


with cat4:

    st.markdown("### 🏋️")

    st.markdown(
        "**Coaching**"
    )

    st.caption(
        "Training principles and player development."
    )


# ============================================================
# FOOTER
# ============================================================

st.divider()

st.caption(
    "KICKAI Knowledge Hub uses local retrieval over built-in coaching notes plus "
    "Wikipedia articles you fetch from the sidebar. It does not invent player facts."
)
