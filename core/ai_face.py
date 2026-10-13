"""Holographic coach: speech, lip-sync, expressions, optional microphone."""

from __future__ import annotations

import base64
import json
from functools import lru_cache
from pathlib import Path

import streamlit.components.v1 as components

FACE_PATH = Path(__file__).resolve().parents[1] / "assets" / "kickai_hologram_face.png"


@lru_cache(maxsize=1)
def _face_data_uri() -> str:
    if not FACE_PATH.exists():
        return ""
    encoded = base64.b64encode(FACE_PATH.read_bytes()).decode("ascii")
    return f"data:image/png;base64,{encoded}"


def holographic_face_html(
    name: str = "KICKAI",
    speech: str = "",
    expression: str = "idle",
    autoplay: bool = False,
) -> str:
    """Static-card HTML (no scripts). Prefer render_talking_face for speech."""
    uri = _face_data_uri()
    label = name.upper()
    if not uri:
        return f"<div style='color:#8be9ff;text-align:center'>{label} face asset missing</div>"
    return f"""
<div class="kickai-face-wrap">
  <div class="kickai-face-card expr-{expression}">
    <img class="kickai-face-img" src="{uri}" alt="{label} holographic coach"/>
    <div class="kickai-face-name">{label}</div>
  </div>
</div>
"""


def render_talking_face(
    *,
    name: str = "KICKAI",
    speech: str = "",
    expression: str = "idle",
    autoplay: bool = False,
    enable_mic: bool = True,
    height: int = 430,
) -> None:
    """Browser TTS + lip-sync + expressions. Mic uses Web Speech Recognition when allowed."""
    uri = _face_data_uri()
    payload = json.dumps(
        {
            "name": name,
            "speech": speech or "",
            "expression": expression or "idle",
            "autoplay": bool(autoplay and speech),
            "enableMic": bool(enable_mic),
            "image": uri,
        }
    )
    components.html(_talking_document(payload), height=height, scrolling=False)


def _talking_document(payload_json: str) -> str:
    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
html,body {{ margin:0; background:transparent; font-family: system-ui, sans-serif; }}
.wrap {{ display:flex; flex-direction:column; align-items:center; }}
.card {{
  position:relative; width:260px; height:260px; border-radius:28px; overflow:hidden;
  background:#050814;
  box-shadow: 0 0 28px rgba(140,90,255,.4);
  transition: filter .35s, transform .35s;
}}
.card img {{ width:100%; height:100%; object-fit:cover; display:block; }}
.scan {{
  position:absolute; inset:0; pointer-events:none;
  background: linear-gradient(180deg, transparent 0%, rgba(160,210,255,.14) 46%, transparent 58%);
  background-size: 100% 220%;
  animation: scan 3.4s linear infinite;
}}
.dot {{ position:absolute; left:14px; bottom:16px; width:8px; height:8px; border-radius:50%; background:#5dff9a; box-shadow:0 0 8px #5dff9a; }}
.name {{ position:absolute; right:12px; bottom:12px; color:#c9b8ff; letter-spacing:.28em; font-size:11px; }}
.mouth {{
  position:absolute; left:50%; top:62%; width:46px; height:10px; margin-left:-23px;
  border:2px solid rgba(200,230,255,.85); border-top:none; border-radius:0 0 24px 24px;
  transform-origin:50% 0%; opacity:.9; filter: drop-shadow(0 0 6px #8cf);
}}
.eyes {{
  position:absolute; left:0; right:0; top:42%; height:18px; pointer-events:none;
}}
.eye {{
  position:absolute; width:14px; height:14px; border-radius:50%;
  background: radial-gradient(circle at 40% 35%, #fff, #8cf 45%, #3af 80%);
  box-shadow: 0 0 12px #8cf;
}}
.eye.l {{ left:38%; }} .eye.r {{ right:38%; }}
.lids {{ position:absolute; left:0; right:0; top:42%; height:18px; background:transparent; }}
.status {{ margin-top:8px; color:#9bb0c2; font-size:12px; min-height:16px; }}
.row {{ display:flex; gap:8px; margin-top:8px; }}
button {{
  background:#122233; color:#cfe8ff; border:1px solid #4aa3ff; border-radius:10px;
  padding:6px 10px; cursor:pointer; font-size:12px;
}}
button:hover {{ background:#1a3350; }}
.card.idle {{ filter:saturate(1.05); }}
.card.listening {{ filter: hue-rotate(20deg) brightness(1.15); box-shadow:0 0 36px #5dff9a; }}
.card.thinking {{ filter: hue-rotate(-10deg) saturate(1.2); }}
.card.speaking {{ filter: brightness(1.2) saturate(1.25); }}
.card.confident {{ filter: hue-rotate(-25deg) saturate(1.3); }}
.card.uncertain {{ filter: grayscale(.2) brightness(.95); }}
.card.concerned {{ filter: hue-rotate(200deg) saturate(1.2); }}
.card.happy {{ filter: brightness(1.25) saturate(1.15); }}
@keyframes scan {{ 0% {{background-position:0 -80%}} 100% {{background-position:0 180%}} }}
@keyframes blink {{ 0%,92%,100% {{ transform:scaleY(1)}} 96% {{ transform:scaleY(.08)}} }}
.eye {{ animation: blink 5.5s infinite; }}
</style>
</head>
<body>
<div class="wrap">
  <div class="card idle" id="card">
    <img id="face" alt="KICKAI face"/>
    <div class="scan"></div>
    <div class="eyes"><div class="eye l"></div><div class="eye r"></div></div>
    <div class="mouth" id="mouth"></div>
    <div class="dot"></div>
    <div class="name" id="label">KICKAI</div>
  </div>
  <div class="status" id="status">idle</div>
  <div class="row">
    <button id="btnSpeak">Speak</button>
    <button id="btnStop">Mute</button>
    <button id="btnMic">Listen</button>
  </div>
</div>
<script>
const CFG = {payload_json};
const card = document.getElementById('card');
const mouth = document.getElementById('mouth');
const statusEl = document.getElementById('status');
const face = document.getElementById('face');
document.getElementById('label').textContent = (CFG.name || 'KICKAI').toUpperCase();
if (CFG.image) face.src = CFG.image;

let speaking = false;
let mouthTick = 0;
let rec = null;

function setExpr(name) {{
  card.className = 'card ' + (name || 'idle');
  statusEl.textContent = name || 'idle';
}}
setExpr(CFG.expression || 'idle');

function setMouth(open) {{
  const v = Math.max(0.15, Math.min(1.4, open));
  mouth.style.height = (8 * v) + 'px';
  mouth.style.transform = 'scaleY(' + v + ')';
}}
setMouth(0.25);

function pickVoice() {{
  const voices = speechSynthesis.getVoices();
  return voices.find(v => /en-GB|en-US|English/i.test(v.lang) && /female|natural|Google|Microsoft/i.test(v.name))
      || voices.find(v => /^en/i.test(v.lang))
      || voices[0]
      || null;
}}

function speak(text, expr) {{
  if (!text || !window.speechSynthesis) {{
    statusEl.textContent = 'speech unavailable';
    return;
  }}
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 1.02; u.pitch = 0.92; u.volume = 1;
  const voice = pickVoice();
  if (voice) u.voice = voice;
  u.onstart = () => {{ speaking = true; setExpr(expr || 'speaking'); }};
  u.onend = () => {{ speaking = false; setMouth(0.25); setExpr(CFG.expression || 'idle'); }};
  u.onerror = () => {{ speaking = false; setMouth(0.25); setExpr('concerned'); }};
  u.onboundary = (e) => {{
    if (e.name === 'word' || e.charIndex >= 0) {{
      setMouth(0.6 + Math.random() * 0.8);
    }}
  }};
  speechSynthesis.speak(u);
}}

function loop() {{
  if (speaking) {{
    mouthTick += 0.35;
    setMouth(0.35 + Math.abs(Math.sin(mouthTick)) * 0.95);
  }}
  requestAnimationFrame(loop);
}}
loop();

document.getElementById('btnSpeak').onclick = () => speak(CFG.speech || 'KICKAI online. Ask me a football question.', 'speaking');
document.getElementById('btnStop').onclick = () => {{ speechSynthesis.cancel(); speaking = false; setMouth(0.25); setExpr('idle'); }};

function wikiAnswer(q) {{
  setExpr('thinking');
  const url = 'https://en.wikipedia.org/w/api.php?origin=*&action=query&format=json&prop=extracts&exintro=1&explaintext=1&list=search&srsearch='
    + encodeURIComponent(q + ' football') + '&srlimit=1';
  fetch(url).then(r => r.json()).then(data => {{
    const hits = (data.query && data.query.search) || [];
    const title = hits.length ? hits[0].title : q;
    return fetch('https://en.wikipedia.org/w/api.php?origin=*&action=query&format=json&prop=extracts&exintro=1&explaintext=1&titles=' + encodeURIComponent(title));
  }}).then(r => r.json()).then(data => {{
    const pages = data.query && data.query.pages ? Object.values(data.query.pages) : [];
    const extract = pages[0] && pages[0].extract ? pages[0].extract.slice(0, 380) : 'I could not retrieve a web answer.';
    speak(extract, 'confident');
  }}).catch(() => speak('I heard you, but the network lookup failed.', 'concerned'));
}}

document.getElementById('btnMic').onclick = () => {{
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR || !CFG.enableMic) {{
    speak('Microphone speech recognition is not available in this browser. Type your question instead.', 'concerned');
    return;
  }}
  if (rec) {{ rec.stop(); rec = null; setExpr('idle'); return; }}
  rec = new SR();
  rec.lang = 'en-US';
  rec.interimResults = false;
  rec.onstart = () => setExpr('listening');
  rec.onerror = () => {{ rec = null; setExpr('concerned'); speak('I could not hear that.', 'concerned'); }};
  rec.onresult = (e) => {{
    rec = null;
    const t = e.results[0][0].transcript;
    statusEl.textContent = 'heard: ' + t;
    setExpr('thinking');
    wikiAnswer(t);
  }};
  rec.start();
}};

if (CFG.autoplay && CFG.speech) {{
  const start = () => speak(CFG.speech, CFG.expression === 'idle' ? 'speaking' : CFG.expression);
  if (speechSynthesis.getVoices().length) start();
  else speechSynthesis.onvoiceschanged = start;
}}
</script>
</body>
</html>"""
