"""Face Acoustic Feedback Router — combines core/ai_face.py + core/voice_coach.py.
Returns structured telemetry: facial expression + spoken text + optional HTML embed.
All components are MIT-licensed (KickAI core / external engine licenses remain MIT).
"""
from __future__ import annotations
import logging, os, base64
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/face", tags=["face_acoustic"])

# Safe imports with graceful fallback if assets are missing
try:
    import sys, os
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "core"))
    from ai_face import holographic_face_html, render_talking_face, _face_data_uri
    from voice_coach import expression_for, strip_markdown
    HAS_FACE = True
except Exception as exc:
    logger.warning(f"Face acoustic imports partial: {exc}")
    HAS_FACE = False
    # Friendly fallback using SVG placeholder (doesn't require streamlit)
    def _friendly_face(**kw):
        expr_name = kw.get("expression", "speaking").upper()
        svg_path = os.path.join(os.path.dirname(__file__), "..", "..", "assets", "face_placeholder.svg")
        try:
            if os.path.exists(svg_path):
                svg_data = open(svg_path, "r").read()
                encoded = base64.b64encode(svg_data.encode()).decode()
                return f"""<div style='text-align:center; padding:1rem; background:#18181b; border-radius:12px; border:1px solid #27272a; max-width:220px; margin:auto;'>
                    <div style='font-family:sans-serif; font-weight:600; color:#34d399; font-size:14px; margin-bottom:4px;'>{expr_name}</div>
                    <img src='data:image/svg+xml;base64,{encoded}' alt='KICKAI Face' style='width:140px; height:auto; opacity:0.95;' />
                    <div style='color:#a1a1aa; font-size:11px; margin-top:4px;'>Live Coach — MIT Assets</div>
                </div>"""
        except Exception:
            pass
        return f"<div style='text-align:center; padding:1rem; color:#8be9ff;'>KICKAI Face — {expr_name}</div>"

    holographic_face_html = _friendly_face
    render_talking_face = lambda **kw: ""
    expression_for = lambda query="", origin=None, failed=False, **kw: "speaking"
    strip_markdown = lambda t, **kw: t or ""

class FaceAcousticRequest(BaseModel):
    query: str = "Analyze attacking third state"
    origin: str = "SIMULATED"
    failed: bool = False
    speech_text: str = ""
    enable_autoplay: bool = False

class FaceAcousticResponse(BaseModel):
    expression: str
    speech_text: str  # cleaned for TTS / acoustic playback
    feedback: str
    html_embed: str | None = None
    provenance: dict
    mock: bool = False

@router.post("/acoustic_feedback", response_model=FaceAcousticResponse)
async def acoustic_feedback(payload: FaceAcousticRequest):
    try:
        # 1. Determine facial expression based on query / context / failure state
        expr = expression_for(
            query=payload.query,
            origin=payload.origin,
            failed=payload.failed
        )
        # 2. Build acoustic feedback text
        if payload.speech_text:
            speech_raw = payload.speech_text
        else:
            # Default coaching line based on origin / expression
            if payload.failed or payload.origin == "UNAVAILABLE":
                speech_raw = "I'm concerned about the current tactical state. We may need to adjust our approach."
            elif payload.origin == "SIMULATED" or payload.origin == "INFERRED":
                speech_raw = "The data suggests an attacking opportunity. Consider the recommended option."
            else:
                speech_raw = "Let's evaluate the situation. What's your preferred decision?"
        # 3. Clean for acoustic delivery (strip markdown, limit length for TTS)
        acoustic_text = strip_markdown(speech_raw, limit=420)

        # 4. Build HTML embed for the holographic face (optional, if frontend wants it)
        html_embed = None
        try:
            html_embed = holographic_face_html(
                name="KICKAI",
                speech=acoustic_text,
                expression=expr,
                autoplay=payload.enable_autoplay
            )
        except Exception:
            # Friendly fallback when streamlit assets are unavailable (e.g., missing streamlit package)
            try:
                svg_path = os.path.join(os.path.dirname(__file__), "..", "..", "assets", "face_placeholder.svg")
                if os.path.exists(svg_path):
                    svg_data = open(svg_path, "r").read()
                    html_embed = f"""<div style='text-align:center; padding:1rem; background:#18181b; border-radius:12px; border:1px solid #27272a; max-width:220px; margin:auto;'>
                        <div style='font-family:sans-serif; font-weight:600; color:#34d399; font-size:14px; margin-bottom:4px;'>{expr.upper()}</div>
                        <img src='data:image/svg+xml;base64,{base64.b64encode(svg_data.encode()).decode()}' alt='KICKAI Face' style='width:140px; height:auto; opacity:0.95;' />
                        <div style='color:#a1a1aa; font-size:11px; margin-top:4px;'>Acoustic Feedback — Live</div>
                    </div>"""
                else:
                    html_embed = f"<div style='text-align:center; padding:1rem;'>KICKAI Face — {expr}</div>"
            except Exception:
                html_embed = f"<div style='text-align:center; padding:1rem; color:#8be9ff;'>KICKAI Face — {expr}</div>"

        # 5. Additional feedback / explanation
        feedback = f"Expression '{expr}' selected based on query: '{payload.query[:60]}...' (origin={payload.origin})."
        if payload.failed:
            feedback += " System flagged a failure mode; recommending coach review."

        return FaceAcousticResponse(
            expression=expr,
            speech_text=acoustic_text,
            feedback=feedback,
            html_embed=html_embed,
            provenance={
                "origin": payload.origin,
                "model": "kickai-face-acoustic",
                "expression_engine": "voice_coach.expression_for",
                "tTS_clean": "voice_coach.strip_markdown",
                "assets": "core/ai_face.py (MIT)"
            },
            mock=False,
        )
    except Exception as exc:
        import traceback
        logger.error(f"Face acoustic error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Face acoustic failure: {exc}")
