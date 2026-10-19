"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, Play, Activity, Wand2, AlertCircle, CheckCircle } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const EXAMPLES = [
  { label: "Analyze attack", q: "Analyze attacking third state", hint: "Evaluate opponent formation" },
  { label: "Why pass?", q: "Why recommend a pass?", hint: "Tactical rationale" },
  { label: "Coach override", q: "Should I modify the recommendation?", hint: "Human-in-the-loop" },
] as const;

interface FaceResponse {
  expression: string;
  speech_text: string;
  feedback: string;
  html_embed?: string | null;
  provenance?: Record<string, any>;
  mock?: boolean;
}

function playConfirmationTone() {
  try {
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.connect(g);
    g.connect(ctx.destination);
    g.gain.setValueAtTime(0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // ignore audio errors
  }
}

export default function AIFaceAcoustic() {
  const [query, setQuery] = useState("Analyze attacking third state");
  const [expression, setExpression] = useState<string | null>(null);
  const [speech, setSpeech] = useState("");
  const [feedback, setFeedback] = useState("");
  const [html, setHtml] = useState("");
  const [origin, setOrigin] = useState("SIMULATED");
  const [failed, setFailed] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<FaceResponse | null>(null);
  const lastTimestamp = useRef<number>(0);

  useEffect(() => {
    const CHANNEL = new BroadcastChannel("kickai:face");
    CHANNEL.onmessage = (e: MessageEvent<string>) => {
      try {
        const data: FaceResponse = JSON.parse(e.data);
        applyResult(data);
      } catch {
        // ignore
      }
    };
    return () => CHANNEL.close();
  }, []);

  const applyResult = useCallback((data: FaceResponse) => {
    setExpression(data.expression || "speaking");
    setSpeech(data.speech_text || "");
    setFeedback(data.feedback || "");
    setHtml(data.html_embed || "");
    setLastResult(data);
    lastTimestamp.current = Date.now();
    if (autoplay) playConfirmationTone();
  }, [autoplay]);

  async function handleFeedback() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/face/acoustic_feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          origin,
          failed,
          speech_text: "",
          enable_autoplay: autoplay,
        }),
      });
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
      const data: FaceResponse = await res.json();
      applyResult(data);
      const channel = new BroadcastChannel("kickai:face");
      channel.postMessage(JSON.stringify(data));
      channel.close();
    } catch (e: any) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError("Face acoustic feedback unavailable: " + msg);
    } finally {
      setLoading(false);
    }
  }

  const expressionColors: Record<string, string> = {
    speaking: "text-amber-400",
    confident: "text-emerald-400",
    thinking: "text-blue-400",
    idle: "text-zinc-500",
    worried: "text-rose-400",
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-zinc-800 to-zinc-950 border border-zinc-700 flex items-center justify-center">
            <Mic size={14} className="text-zinc-300" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-zinc-100">AI Coach — Face & Acoustic</h2>
            <p className="text-[11px] text-zinc-400">Holographic coach + spoken feedback</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${expressionColors[expression || "idle"]} border-zinc-800 bg-zinc-900/80 text-zinc-100/80`}>
            {expression?.toUpperCase() || "IDLE"}
          </span>
          <button
            onClick={() => setAutoplay(!autoplay)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all flex items-center gap-1.5 ${
              autoplay
                ? "bg-amber-950/20 text-amber-300 border-amber-500/30 hover:bg-amber-950/40 hover:text-amber-200"
                : "bg-zinc-850 text-zinc-400 border-zinc-700 hover:bg-zinc-800 hover:text-zinc-300"
            }`}
            title={autoplay ? "Auto play ON" : "Auto play OFF"}
          >
            {autoplay ? <MicOff size={12} /> : <Mic size={12} />}
            {autoplay ? "Audio ON" : "Audio OFF"}
          </button>
        </div>
      </div>

      {/* Input row */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        <div className="sm:col-span-8">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFeedback()}
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg px-4 py-2.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent transition-all font-mono"
              placeholder="Ask the AI coach anything..."
            />
            <Wand2 className="absolute right-3 top-2.5 w-3.5 h-3.5 text-zinc-600" />
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">Press Enter to send • Examples below</p>
        </div>
        <div className="sm:col-span-4 flex items-end">
          <button
            onClick={handleFeedback}
            disabled={loading}
            className="w-full bg-gradient-to-r from-zinc-100 to-zinc-200 hover:from-zinc-200 hover:to-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-semibold px-4 py-2.5 rounded-lg text-xs transition-all shadow-sm flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <Activity className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play size={14} fill="currentColor" />
            )}
            <span className={loading ? "hidden sm:inline" : ""}>Speak</span>
          </button>
        </div>
      </div>

      {/* Quick examples */}
      <div className="flex flex-wrap gap-1.5">
        {EXAMPLES.map((ex) => (
          <button
            key={ex.q}
            onClick={() => setQuery(ex.q)}
            disabled={loading}
            className={`flex items-center gap-1.5 px-2.5 py-1.2 rounded-md text-xs font-medium border transition-all ${
              loading
                ? "bg-zinc-800/50 text-zinc-500 border-zinc-800/50 cursor-not-allowed"
                : "bg-zinc-900/60 text-zinc-300 border-zinc-700/60 hover:bg-zinc-800/80 hover:text-zinc-100 hover:border-zinc-500/60"
            }`}
            title={ex.hint}
          >
            {ex.label}
            <span className="text-[9px] text-zinc-600/70">{ex.hint}</span>
          </button>
        ))}
      </div>

      {/* Status banner */}
      {error && (
        <div className="rounded-lg border border-rose-900/30 bg-rose-950/20 p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-3 h-3 text-rose-400 mt-0.5 shrink-0" />
            <span className="text-xs text-rose-300">{error}</span>
          </div>
        </div>
      )}

      {/* Results card */}
      {(speech || feedback || html || lastResult) && (
        <div className="rounded-xl border border-zinc-800/80 bg-gradient-to-b from-zinc-950/90 to-black p-4 shadow-lg relative overflow-hidden">
          {/* Face preview */}
          <div className="flex items-center justify-center mb-4">
            <div
              className="flex items-center gap-3 p-4 rounded-xl border border-zinc-800/60 bg-zinc-900/60 shadow-inner"
              style={{ minWidth: 220 }}
            >
              {html ? (
                <div
                  className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden border border-zinc-700"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              ) : (
                <div className="w-24 h-24 rounded-lg bg-zinc-800 flex items-center justify-center border border-zinc-700">
                  <Mic size={24} className="text-zinc-500" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className={`font-bold text-sm tracking-tight ${expressionColors[expression || "idle"]}`}>
                    {expression?.toUpperCase() || "IDLE"}
                  </span>
                  <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">Live</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">{feedback}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/50 p-3">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">Spoken Feedback</h3>
              <p className="text-xs italic text-zinc-200 leading-relaxed">
                "{speech || "—"}"
              </p>
            </div>
            <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/50 p-3">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">Provenance</h3>
              <div className="text-[10px] text-zinc-400 space-y-1 font-mono">
                {lastResult?.provenance ? (
                  <>
                    <span>Origin: {lastResult.provenance.origin}</span>
                    <span>Engine: {lastResult.provenance.expression_engine}</span>
                    <span>{lastResult.mock ? "Mock mode" : "Live engine"}</span>
                  </>
                ) : (
                  <span className="text-zinc-500">—</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!speech && !feedback && !html && !lastResult && !error && (
        <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/30 p-6 text-center">
          <div className="w-12 h-12 rounded bg-zinc-800/50 flex items-center justify-center mx-auto mb-3 border border-zinc-700/60">
            <Mic size={18} className="text-zinc-500" />
          </div>
          <h3 className="text-sm font-medium text-zinc-200 mb-1">Ready for coaching</h3>
          <p className="text-xs text-zinc-500">Ask a question — the AI face will react with expression + voice.</p>
        </div>
      )}
    </div>
  );
}
