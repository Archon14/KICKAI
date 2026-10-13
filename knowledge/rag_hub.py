from __future__ import annotations

from dataclasses import dataclass
from typing import Optional
import re

import streamlit as st


# ============================================================
# DOCUMENT MODEL
# ============================================================

@dataclass(frozen=True)
class KnowledgeDocument:
    title: str
    category: str
    content: str
    source: str


# ============================================================
# STOP WORDS
# ============================================================

STOP_WORDS = {
    "a",
    "an",
    "the",
    "is",
    "are",
    "was",
    "were",
    "be",
    "to",
    "of",
    "and",
    "or",
    "in",
    "on",
    "for",
    "with",
    "how",
    "can",
    "i",
    "my",
    "me",
    "what",
    "why",
    "do",
    "does",
    "should",
}


# ============================================================
# DEFAULT KNOWLEDGE
# ============================================================

DEFAULT_DOCUMENTS = [

    KnowledgeDocument(
        title="Offside basics",
        category="IFAB Rules",
        content=(
            "A player is in an offside position if any part of "
            "the head, body or feet is in the opponents' half "
            "and any part of the head, body or feet is nearer "
            "to the opponents' goal line than both the ball "
            "and the second-last opponent. Being in an offside "
            "position is not itself an offence."
        ),
        source="IFAB Laws of the Game",
    ),

    KnowledgeDocument(
        title="Passing technique",
        category="Technical Skills",
        content=(
            "For a controlled short pass, the supporting foot "
            "should be placed beside the ball. The ankle of "
            "the striking foot should remain relatively firm. "
            "The inside of the foot can be used when accuracy "
            "is the priority. Players should scan before "
            "receiving and passing."
        ),
        source="KICKAI Coaching Library",
    ),

    KnowledgeDocument(
        title="First touch",
        category="Technical Skills",
        content=(
            "A strong first touch should move the ball into "
            "useful space rather than simply stopping it. "
            "Players should scan before receiving and attempt "
            "to control the ball away from pressure. The body "
            "should be positioned so the next action can be "
            "performed quickly."
        ),
        source="KICKAI Coaching Library",
    ),

    KnowledgeDocument(
        title="Shooting mechanics",
        category="Finishing",
        content=(
            "Effective shooting combines body balance, plant "
            "foot position, contact point and follow-through. "
            "Players should practice finishing from different "
            "angles and body positions. The plant foot should "
            "help establish balance and direction."
        ),
        source="KICKAI Coaching Library",
    ),

    KnowledgeDocument(
        title="Defensive transition",
        category="Tactics",
        content=(
            "Immediately after losing possession, a team should "
            "assess whether to press the ball, delay the opponent "
            "or recover into defensive shape. Players closest "
            "to the ball can apply pressure while teammates "
            "cover dangerous spaces."
        ),
        source="KICKAI Tactical Library",
    ),

    KnowledgeDocument(
        title="Pressing principles",
        category="Tactics",
        content=(
            "Effective pressing requires coordination between "
            "the player applying pressure and teammates covering "
            "passing lanes. The pressing player should attempt "
            "to control the direction of play rather than "
            "simply sprint toward the ball."
        ),
        source="KICKAI Tactical Library",
    ),

    KnowledgeDocument(
        title="Scanning before receiving",
        category="Technical Skills",
        content=(
            "Players should scan their surroundings before "
            "receiving the ball. Checking shoulders can provide "
            "information about pressure, available space and "
            "the location of teammates and opponents."
        ),
        source="KICKAI Coaching Library",
    ),

]


# ============================================================
# TOKENIZER
# ============================================================

def tokenize(text: str) -> list[str]:
    """
    Lightweight tokenizer.

    No NLP libraries are required, keeping RAM usage low.
    """

    words = re.findall(
        r"[a-zA-Z0-9]+",
        text.lower(),
    )

    return [
        word
        for word in words
        if word not in STOP_WORDS
    ]


# ============================================================
# SIMPLE WORD NORMALIZATION
# ============================================================

def normalize_word(word: str) -> str:
    """
    Very lightweight stemming.

    This intentionally avoids installing NLTK,
    spaCy or another NLP package.
    """

    suffixes = (
        "ing",
        "ed",
        "es",
        "s",
    )

    for suffix in suffixes:

        if (
            len(word) > len(suffix) + 2
            and word.endswith(suffix)
        ):
            return word[:-len(suffix)]

    return word


def normalized_tokens(text: str) -> list[str]:

    return [
        normalize_word(token)
        for token in tokenize(text)
    ]


# ============================================================
# KNOWLEDGE ENGINE
# ============================================================

class KnowledgeHub:

    def __init__(
        self,
        documents: Optional[
            list[KnowledgeDocument]
        ] = None,
    ):

        self.documents = (
            documents
            if documents is not None
            else DEFAULT_DOCUMENTS
        )

        self.document_tokens = []
        self.title_tokens = []
        self.category_tokens = []

        for document in self.documents:

            self.document_tokens.append(
                set(
                    normalized_tokens(
                        document.content
                    )
                )
            )

            self.title_tokens.append(
                set(
                    normalized_tokens(
                        document.title
                    )
                )
            )

            self.category_tokens.append(
                set(
                    normalized_tokens(
                        document.category
                    )
                )
            )


    # ========================================================
    # SCORE DOCUMENT
    # ========================================================

    def score_document(
        self,
        query: str,
        document_index: int,
    ) -> float:

        query_tokens = set(
            normalized_tokens(query)
        )

        if not query_tokens:
            return 0.0

        document_tokens = self.document_tokens[
            document_index
        ]

        title_tokens = self.title_tokens[
            document_index
        ]

        category_tokens = self.category_tokens[
            document_index
        ]

        score = 0.0

        for token in query_tokens:

            # Normal content match
            if token in document_tokens:
                score += 1.0

            # Title is more important
            if token in title_tokens:
                score += 3.0

            # Category is also useful
            if token in category_tokens:
                score += 2.0

        return score


    # ========================================================
    # SEARCH
    # ========================================================

    def search(
        self,
        query: str,
        top_k: int = 3,
    ) -> list[tuple[KnowledgeDocument, float]]:

        if not query.strip():
            return []

        results = []

        for index, document in enumerate(
            self.documents
        ):

            score = self.score_document(
                query,
                index,
            )

            if score > 0:

                results.append(
                    (
                        document,
                        score,
                    )
                )

        results.sort(
            key=lambda item: item[1],
            reverse=True,
        )

        return results[:top_k]


    # ========================================================
    # ANSWER
    # ========================================================

    def answer(
        self,
        query: str,
        top_k: int = 3,
        search_internet: bool = True,
        include_match_prediction: bool = True,
    ) -> dict:
        extra_blocks: list[str] = []
        sources: list[dict] = []

        if include_match_prediction:
            try:
                from analytics.auto_predict import auto_predict_match
                from knowledge.web_search import detect_match_query

                teams = detect_match_query(query)
                if teams:
                    home, away = teams
                    auto = auto_predict_match(home, away, simulations=5000, seed=42)
                    p = auto.prediction
                    extra_blocks.append(
                        "### Match prediction (automatic)\n\n"
                        f"**{auto.matchup.home.clubelo_name}** vs **{auto.matchup.away.clubelo_name}** "
                        f"(Elo {auto.matchup.home.elo:.0f} vs {auto.matchup.away.elo:.0f}, "
                        f"xG estimate {auto.matchup.home_xg:.2f}–{auto.matchup.away_xg:.2f})\n\n"
                        f"- {auto.matchup.home.clubelo_name} win: **{p.home_win_probability:.1%}**\n"
                        f"- Draw: **{p.draw_probability:.1%}**\n"
                        f"- {auto.matchup.away.clubelo_name} win: **{p.away_win_probability:.1%}**\n"
                        f"- Most likely score: **{p.most_likely_score[0]}–{p.most_likely_score[1]}**\n\n"
                        f"_Monte Carlo ({p.simulations:,} runs). {auto.matchup.xg_notes}_"
                    )
                    sources.append(
                        {
                            "title": "KICKAI MatchPredictor",
                            "category": "Prediction",
                            "source": "analytics/match_predictor + ClubElo",
                            "score": 10.0,
                        }
                    )
            except Exception:
                pass

        results = self.search(query=query, top_k=top_k)
        local_answer = ""
        if results:
            best_document = results[0][0]
            local_answer = f"### {best_document.title}\n\n{best_document.content}"
            for document, score in results:
                sources.append(
                    {
                        "title": document.title,
                        "category": document.category,
                        "source": document.source,
                        "score": round(score, 2),
                    }
                )

        web_payload = None
        if search_internet:
            try:
                from knowledge.web_search import format_web_answer, search_internet

                hits = search_internet(query, max_results=top_k)
                web_payload = format_web_answer(query, hits)
                sources.extend(web_payload.get("sources", []))
            except Exception as exc:
                if not local_answer and not extra_blocks:
                    return {
                        "answer": f"Web search failed: {exc}",
                        "sources": [],
                        "origin": "UNAVAILABLE",
                    }

        parts = []
        if extra_blocks:
            parts.extend(extra_blocks)
        if web_payload and web_payload.get("answer"):
            parts.append(web_payload["answer"])
        if local_answer:
            parts.append(local_answer)

        if not parts:
            return {
                "answer": "No local or web results were found for that question.",
                "sources": [],
                "origin": "UNAVAILABLE",
            }

        origin = "MIXED"
        if web_payload and not local_answer and not extra_blocks:
            origin = web_payload.get("origin", "OBSERVED")
        elif extra_blocks and not web_payload:
            origin = "PREDICTED"

        return {
            "answer": "\n\n---\n\n".join(parts),
            "sources": sources,
            "origin": origin,
        }


# ============================================================
# STREAMLIT CACHE
# ============================================================

def _all_documents() -> list[KnowledgeDocument]:
    docs = list(DEFAULT_DOCUMENTS)
    try:
        from knowledge.web_ingest import load_stored_documents

        web_docs = load_stored_documents()
        seen = {(d.title, d.source) for d in docs}
        for doc in web_docs:
            key = (doc.title, doc.source)
            if key not in seen:
                docs.append(doc)
                seen.add(key)
    except Exception:
        pass
    return docs


@st.cache_resource(
    show_spinner=False,
)
def get_knowledge_hub() -> KnowledgeHub:

    return KnowledgeHub(documents=_all_documents())


def reload_knowledge_hub() -> KnowledgeHub:
    """Call after web ingest so Streamlit picks up new documents."""
    get_knowledge_hub.clear()  # type: ignore[attr-defined]
    return get_knowledge_hub()
