from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd
import streamlit as st

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from core.design import BLACK_SIGNATURE, streamlit_css
from core.engine import KickAIEngine
from core.memory import TacticalMemory
from core.formations import recommend_formations
from core.hover_board import apply_name_map, coordinate_table, hover_pitch_figure
from core.world import simulated_attacking_third

st.set_page_config(page_title="KICKAI | Tactical Lab", page_icon="🧠", layout="wide")
st.markdown(streamlit_css(BLACK_SIGNATURE), unsafe_allow_html=True)

st.title("🧠 Tactical Lab")
st.caption("Options are computed from world geometry, reachability, xG, fatigue and opponent momentum.")

st.warning("Default snapshot is SIMULATED. It is not a tracked match.")

engine = KickAIEngine()
state = simulated_attacking_third(int(st.number_input("Scenario seed", 0, 9999, 7)))
if "player_names" not in st.session_state:
    st.session_state["player_names"] = {}
with st.expander("Rename players"):
    for player in state.team_players("home")[:6]:
        val = st.text_input(
            player.profile.player_id,
            value=st.session_state["player_names"].get(player.profile.player_id, player.profile.name),
            key=f"tac_name_{player.profile.player_id}",
        )
        st.session_state["player_names"][player.profile.player_id] = val
state = apply_name_map(state, st.session_state["player_names"])

st.plotly_chart(hover_pitch_figure(state, "Hover a player for stats"), use_container_width=True)
st.dataframe(coordinate_table(state), use_container_width=True, hide_index=True)

st.subheader("Best formations")
form = recommend_formations(state, "home")
st.success(f"Suggested shape: {form['best']} — {form['claim']}")
st.dataframe(pd.DataFrame(form["options"]), use_container_width=True, hide_index=True)
family = st.selectbox("Solution family", ["balanced", "historical", "safe", "aggressive", "creative", "experimental"])
level = st.radio("Explanation", ["quick", "coach", "analyst", "technical"], horizontal=True)

raw = engine.tactics.decide(state, family=family)
report = engine.analyze_state(state, family=family)

if not report["recommendation"]:
    st.error("No recommendation: " + "; ".join(report["failure_modes"]))
    st.stop()

rec = report["recommendation"]
st.subheader(f"Recommendation — {rec['action']}")
c1, c2, c3 = st.columns(3)
c1.metric("Expected value", f"{rec['expected_value']:.3f}")
c2.metric("Confidence", f"{rec['confidence']:.2f}")
c3.metric("Claim", report["claim"])
st.write(rec["why"][level])
st.caption("Uncertainty: " + "; ".join(rec["uncertainty"] or ["none listed"]))

rows = []
for opt in report["options"]:
    row = {"Action": opt["action"], "EV": opt["expected_value"], "Risk": opt["risk"], "Confidence": opt["confidence"]}
    for o in opt["outcomes"]:
        row[o["label"]] = o["probability"]
    rows.append(row)
st.dataframe(pd.DataFrame(rows), use_container_width=True, hide_index=True)

st.subheader("Coach override")
action = st.selectbox("Decision", raw.coach_controls)
note = st.text_input("Coach note")
alt = st.selectbox("Alternative family", ["safe", "aggressive", "creative", "experimental"])
if st.button("Apply coach control", type="primary"):
    updated, record = engine.coach_override.apply(
        state, raw, action, option_id=rec["id"], note=note, family=alt if action == "Simulate alternative" else None
    )
    mem = TacticalMemory(ROOT / "data" / "tactical_memory.json")
    mem.append({"action": action, "note": note, "provenance": record.provenance, "recommendation": rec})
    st.success(f"Stored with provenance {record.provenance['record_id']}")
    if updated.recommendation:
        st.write("Now recommending:", updated.recommendation.action)

st.caption("Players off-camera: " + str(report["players_off_camera"]) + " (coordinates not invented).")
