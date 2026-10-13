"""Central KICKAI design tokens. Do not scatter colors in components."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Theme:
    name: str
    background: str
    surface: str
    surface_alt: str
    border: str
    accent: str
    text: str
    muted: str
    success: str
    warning: str
    danger: str
    probability_high: str
    probability_mid: str
    probability_low: str


BLACK_SIGNATURE = Theme(
    name="BLACK SIGNATURE",
    background="#07110d",
    surface="#0d1b15",
    surface_alt="#0e1d16",
    border="#1b3a2b",
    accent="#21d47b",
    text="#ffffff",
    muted="#a7b5ae",
    success="#21d47b",
    warning="#e6c35c",
    danger="#e85d5d",
    probability_high="#21d47b",
    probability_mid="#e6c35c",
    probability_low="#e85d5d",
)

WHITE_SIGNATURE = Theme(
    name="WHITE SIGNATURE",
    background="#f4f7f5",
    surface="#ffffff",
    surface_alt="#eef3f0",
    border="#c9d6cf",
    accent="#0d8a4b",
    text="#102018",
    muted="#5c6b64",
    success="#0d8a4b",
    warning="#b8860b",
    danger="#b42318",
    probability_high="#0d8a4b",
    probability_mid="#b8860b",
    probability_low="#b42318",
)

ARMY_BLUE = Theme(
    name="ARMY BLUE",
    background="#0b1520",
    surface="#122233",
    surface_alt="#0f1c2a",
    border="#2a445c",
    accent="#4aa3ff",
    text="#f2f7fb",
    muted="#9bb0c2",
    success="#3dd68c",
    warning="#e6c35c",
    danger="#ff6b6b",
    probability_high="#3dd68c",
    probability_mid="#e6c35c",
    probability_low="#ff6b6b",
)

THEMES = {
    "black": BLACK_SIGNATURE,
    "white": WHITE_SIGNATURE,
    "army_blue": ARMY_BLUE,
}


def streamlit_css(theme: Theme = BLACK_SIGNATURE) -> str:
    return f"""
    <style>
    .main {{ background-color: {theme.background}; }}
    .block-container {{
        padding-top: 2rem;
        padding-bottom: 3rem;
        max-width: 1400px;
    }}
    .kickai-title {{
        font-size: 3.2rem;
        font-weight: 800;
        color: {theme.text};
        margin-bottom: 0;
    }}
    .kickai-green {{ color: {theme.accent}; }}
    .subtitle {{
        color: {theme.muted};
        font-size: 1.1rem;
        margin-bottom: 2rem;
    }}
    .card {{
        background: linear-gradient(145deg, {theme.surface_alt}, {theme.surface});
        border: 1px solid {theme.border};
        border-radius: 16px;
        padding: 1.4rem;
        min-height: 170px;
        margin-bottom: 1rem;
    }}
    .card h3 {{ color: {theme.text}; margin-bottom: 0.5rem; }}
    .card p {{ color: {theme.muted}; }}
    .metric-card {{
        background: {theme.surface};
        border: 1px solid {theme.border};
        border-radius: 12px;
        padding: 1rem;
        text-align: center;
    }}
    .metric-value {{
        font-size: 2rem;
        font-weight: 800;
        color: {theme.accent};
    }}
    .metric-label {{ color: {theme.muted}; font-size: 0.85rem; }}
    .provenance {{
        font-size: 0.75rem;
        letter-spacing: 0.04em;
        color: {theme.muted};
        text-transform: uppercase;
    }}
    </style>
    """
