from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd
import streamlit as st

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from analytics.auto_predict import auto_predict_match
from analytics.match_predictor import MatchPredictor


st.set_page_config(
    page_title="KICKAI | Match Simulations",
    page_icon="🎯",
    layout="wide",
)

st.title("🎯 Match Simulations")
st.caption(
    "Fetches ClubElo from the internet, estimates match xG, and runs Monte Carlo automatically."
)

auto_mode = st.checkbox(
    "Automatic mode (fetch + predict)",
    value=True,
    help="Looks up teams online and runs MatchPredictor without a second click.",
)

with st.sidebar:
    st.header("Simulation Settings")
    simulations = st.slider("Monte Carlo simulations", 1_000, 50_000, 10_000, 1_000)
    seed = st.number_input("Random seed", 0, 999_999, 42, 1)

left, right = st.columns(2)
with left:
    st.subheader("Home Team")
    home_team = st.text_input("Team name", value="Arsenal", key="home_team")
    home_elo = st.number_input(
        "Elo rating",
        500.0,
        3000.0,
        float(st.session_state.get("home_elo", 1550.0)),
        10.0,
        key="home_elo_input",
    )
    home_xg = st.number_input(
        "Expected goals (match)",
        0.0,
        8.0,
        float(st.session_state.get("home_xg", 1.65)),
        0.05,
        key="home_xg_input",
    )
with right:
    st.subheader("Away Team")
    away_team = st.text_input("Team name", value="Liverpool", key="away_team")
    away_elo = st.number_input(
        "Elo rating",
        500.0,
        3000.0,
        float(st.session_state.get("away_elo", 1500.0)),
        10.0,
        key="away_elo_input",
    )
    away_xg = st.number_input(
        "Expected goals (match)",
        0.0,
        8.0,
        float(st.session_state.get("away_xg", 1.20)),
        0.05,
        key="away_xg_input",
    )

fetch = st.button("🌐 Refresh from internet", use_container_width=True)

def _signature() -> str:
    return f"{home_team}|{away_team}|{simulations}|{seed}"


def _run_pipeline(use_internet: bool) -> None:
    if use_internet:
        result = auto_predict_match(
            home_team,
            away_team,
            simulations=simulations,
            seed=int(seed),
            force_lookup=True,
        )
        st.session_state["home_elo"] = result.matchup.home.elo
        st.session_state["away_elo"] = result.matchup.away.elo
        st.session_state["home_xg"] = result.matchup.home_xg
        st.session_state["away_xg"] = result.matchup.away_xg
        st.session_state["home_elo_input"] = float(result.matchup.home.elo)
        st.session_state["away_elo_input"] = float(result.matchup.away.elo)
        st.session_state["home_xg_input"] = float(result.matchup.home_xg)
        st.session_state["away_xg_input"] = float(result.matchup.away_xg)
        st.session_state["matchup_meta"] = {
            "home_club": result.matchup.home.clubelo_name,
            "away_club": result.matchup.away.clubelo_name,
            "xg_origin": result.matchup.xg_origin,
            "xg_notes": result.matchup.xg_notes,
            "notes": result.matchup.home.notes + result.matchup.away.notes,
        }
        prediction = result.prediction
        distribution = result.score_distribution
    else:
        predictor = MatchPredictor(home_elo=home_elo, away_elo=away_elo)
        prediction = predictor.simulate(home_xg, away_xg, simulations, int(seed))
        distribution = predictor.score_distribution(home_xg, away_xg, simulations, int(seed))

    st.session_state["match_prediction"] = prediction
    st.session_state["score_distribution"] = distribution
    st.session_state["predict_signature"] = _signature()


sig = _signature()
should_run = fetch or (auto_mode and st.session_state.get("predict_signature") != sig)

if should_run:
    with st.spinner("Fetching ratings and running Monte Carlo..."):
        try:
            _run_pipeline(use_internet=fetch or auto_mode)
            st.rerun()
        except Exception as exc:
            st.error(f"Automatic prediction failed: {exc}")

meta = st.session_state.get("matchup_meta")
if meta:
    st.info(
        f"**{meta['home_club']}** Elo {st.session_state.get('home_elo', home_elo):.0f} · "
        f"**{meta['away_club']}** Elo {st.session_state.get('away_elo', away_elo):.0f} · "
        f"xG {st.session_state.get('home_xg', home_xg):.2f}–{st.session_state.get('away_xg', away_xg):.2f} "
        f"({meta['xg_origin']})"
    )
    st.caption(meta["xg_notes"])

prediction = st.session_state.get("match_prediction")

if prediction is not None:
    st.success(f"Automatic prediction — {prediction.simulations:,} simulations")

    st.subheader("Match Outcome")
    c1, c2, c3 = st.columns(3)
    c1.metric(f"{home_team} Win", f"{prediction.home_win_probability:.1%}")
    c2.metric("Draw", f"{prediction.draw_probability:.1%}")
    c3.metric(f"{away_team} Win", f"{prediction.away_win_probability:.1%}")

    st.subheader("Projected Goals")
    g1, g2, g3 = st.columns(3)
    g1.metric(home_team, f"{prediction.expected_home_goals:.2f}")
    g2.metric("Most Likely Score", f"{prediction.most_likely_score[0]} - {prediction.most_likely_score[1]}")
    g3.metric(away_team, f"{prediction.expected_away_goals:.2f}")

    probability_df = pd.DataFrame(
        {
            "Outcome": [home_team, "Draw", away_team],
            "Probability": [
                prediction.home_win_probability,
                prediction.draw_probability,
                prediction.away_win_probability,
            ],
        }
    )
    st.subheader("Probability Distribution")
    st.bar_chart(probability_df.set_index("Outcome"))

    score_distribution = st.session_state.get("score_distribution", [])
    if score_distribution:
        st.subheader("Most Likely Scorelines")
        score_df = pd.DataFrame(score_distribution)
        score_df["Probability (%)"] = (score_df["Probability"] * 100).round(2)
        st.dataframe(
            score_df[["Score", "Probability (%)", "Count"]],
            use_container_width=True,
            hide_index=True,
        )
elif not auto_mode:
    st.info("Turn on **Automatic mode** or click **Refresh from internet** to predict.")

with st.expander("Shot-level Monte Carlo (optional, experimental)"):
    home_shots = st.text_input("Home shot xG list", "0.35, 0.12, 0.08, 0.65, 0.04", key="home_shots")
    away_shots = st.text_input("Away shot xG list", "0.05, 0.18, 0.22", key="away_shots")
    if st.button("Run shot-level simulation"):
        def _parse(text: str) -> list[float]:
            return [float(x.strip()) for x in text.split(",") if x.strip()]
        try:
            he = float(st.session_state.get("home_elo", home_elo))
            ae = float(st.session_state.get("away_elo", away_elo))
            st.json(
                MatchPredictor(he, ae).simulate_shots(
                    _parse(home_shots), _parse(away_shots), simulations, int(seed)
                )
            )
        except Exception as exc:
            st.error(str(exc))

st.caption("Predictions are probabilistic. xG from Elo is ESTIMATED unless shot data is added later.")
