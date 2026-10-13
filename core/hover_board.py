"""Interactive pitch: hover a marker to read player/ball stats (Plotly)."""

from __future__ import annotations

from typing import Optional

import numpy as np
import pandas as pd

from core.world import WorldState


def apply_name_map(state: WorldState, names: dict[str, str]) -> WorldState:
    for player in state.players:
        override = names.get(player.profile.player_id, "").strip()
        if override:
            player.profile.name = override
    return state


def coordinate_table(state: WorldState) -> pd.DataFrame:
    rows = []
    if state.ball.xy is not None:
        rows.append(
            {
                "id": "BALL",
                "name": "Ball",
                "team": "—",
                "x": round(float(state.ball.xy[0]), 1),
                "y": round(float(state.ball.xy[1]), 1),
                "origin": state.ball.origin.value,
                "confidence": round(state.ball.confidence, 3),
            }
        )
    else:
        rows.append(
            {
                "id": "BALL",
                "name": "Ball",
                "team": "—",
                "x": None,
                "y": None,
                "origin": "UNAVAILABLE",
                "confidence": 0.0,
            }
        )
    for p in state.players:
        xy = p.xy
        rows.append(
            {
                "id": p.profile.player_id,
                "name": p.profile.name,
                "team": p.profile.team,
                "x": None if xy is None else round(float(xy[0]), 1),
                "y": None if xy is None else round(float(xy[1]), 1),
                "origin": p.origin.value,
                "confidence": round(p.confidence, 3),
            }
        )
    return pd.DataFrame(rows)


def hover_pitch_figure(state: WorldState, title: str = "Hover a player"):
    import plotly.graph_objects as go

    length = state.pitch_length if state.calibrated else 1.0
    width = state.pitch_width if state.calibrated else 1.0
    fig = go.Figure()

    if state.calibrated:
        fig.add_shape(type="rect", x0=0, y0=0, x1=length, y1=width, line=dict(color="#21d47b", width=2))
        fig.add_shape(type="line", x0=length / 2, y0=0, x1=length / 2, y1=width, line=dict(color="#1b3a2b"))

    xs, ys, texts, colors, custom = [], [], [], [], []
    for p in state.visible_players():
        x, y = float(p.xy[0]), float(p.xy[1])
        speed = float(np.linalg.norm(p.velocity)) if p.velocity is not None else None
        hover = (
            f"<b>{p.profile.name}</b> ({p.profile.player_id})<br>"
            f"Team: {p.profile.team}<br>"
            f"Role: {p.profile.role_fluid}<br>"
            f"x,y: {x:.1f}, {y:.1f}<br>"
            f"Speed: {'n/a' if speed is None else f'{speed:.2f}'}<br>"
            f"Fatigue: {p.fatigue:.2f}<br>"
            f"Finishing {p.profile.finishing:.2f} · Pass {p.profile.passing:.2f}<br>"
            f"Action: {p.current_action}<br>"
            f"Origin: {p.origin.value} · conf {p.confidence:.2f}"
        )
        xs.append(x)
        ys.append(y)
        texts.append(p.profile.name[:10])
        colors.append("#21d47b" if p.profile.team == "home" else "#5b8cff" if p.profile.team == "away" else "#c8c8c8")
        custom.append(hover)

    fig.add_trace(
        go.Scatter(
            x=xs,
            y=ys,
            mode="markers+text",
            text=texts,
            textposition="top center",
            marker=dict(size=14, color=colors, line=dict(width=1, color="#ffffff")),
            hovertext=custom,
            hoverinfo="text",
            name="Players",
        )
    )
    if state.ball.xy is not None:
        bx, by = float(state.ball.xy[0]), float(state.ball.xy[1])
        fig.add_trace(
            go.Scatter(
                x=[bx],
                y=[by],
                mode="markers",
                marker=dict(size=12, color="#ffe066", symbol="diamond"),
                hovertext=[
                    f"<b>Ball</b><br>x,y: {bx:.1f}, {by:.1f}<br>"
                    f"Origin: {state.ball.origin.value} · conf {state.ball.confidence:.2f}"
                ],
                hoverinfo="text",
                name="Ball",
            )
        )

    fig.update_layout(
        title=title,
        template="plotly_dark",
        height=480,
        margin=dict(l=20, r=20, t=40, b=20),
        xaxis_title="x (pitch m if calibrated, else image px)",
        yaxis_title="y",
        yaxis=dict(scaleanchor="x", scaleratio=1),
        paper_bgcolor="#07110d",
        plot_bgcolor="#0d1b15",
        font=dict(color="#e8f0ec"),
    )
    return fig
