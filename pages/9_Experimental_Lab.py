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
from core.limitations import LIMITATION_STRATEGIES
from core.redteam import run_red_team

st.set_page_config(page_title="KICKAI | Experimental Lab", page_icon="🚀", layout="wide")
st.markdown(streamlit_css(BLACK_SIGNATURE), unsafe_allow_html=True)

st.title("🚀 Experimental Lab")
st.caption("Research area. Families are SIMULATED against a labeled synthetic world.")

engine = KickAIEngine()
lab = engine.lab(seed=int(st.number_input("Seed", 0, 9999, 7)))

rows = []
for name, payload in lab["families"].items():
    rec = payload.get("recommendation") or {}
    rows.append(
        {
            "Family": name,
            "Action": rec.get("action"),
            "EV": rec.get("expected_value"),
            "Risk": rec.get("risk"),
            "Confidence": rec.get("confidence"),
            "Claim": payload.get("claim"),
        }
    )
st.dataframe(pd.DataFrame(rows), use_container_width=True, hide_index=True)

st.subheader("Negative space")
st.dataframe(pd.DataFrame(lab["negative_space"]), use_container_width=True, hide_index=True)

st.subheader("Red team")
if st.button("Run adversarial scenarios"):
    st.json(run_red_team())

st.subheader("24 TacticAI-class limitations — implemented strategies")
st.dataframe(
    pd.DataFrame(
        [{"id": k, "strategy": v} for k, v in LIMITATION_STRATEGIES.items()]
    ),
    use_container_width=True,
    hide_index=True,
)
