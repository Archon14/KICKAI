"""Turn answers into spoken lines and facial expressions."""

from __future__ import annotations

import re
from typing import Optional


def strip_markdown(text: str, limit: int = 420) -> str:
    text = re.sub(r"[#*_`]+", " ", text)
    text = re.sub(r"\[(.*?)\]\([^)]+\)", r"\1", text)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) > limit:
        text = text[:limit].rsplit(" ", 1)[0] + "."
    return text


def expression_for(query: str, origin: Optional[str] = None, failed: bool = False) -> str:
    q = (query or "").lower()
    if failed or origin == "UNAVAILABLE":
        return "concerned"
    if "vs" in q or "predict" in q or "who will win" in q:
        return "confident"
    if any(w in q for w in ("why", "how", "explain")):
        return "thinking"
    if origin in {"PREDICTED", "MIXED"}:
        return "confident"
    if "?" in (query or ""):
        return "speaking"
    return "idle"


def speech_for_answer(query: str, answer: str, origin: Optional[str] = None) -> str:
    spoken = strip_markdown(answer)
    if not spoken:
        return "I could not find a confident answer for that."
    if origin == "UNAVAILABLE":
        return "I am not confident. " + spoken
    return spoken
