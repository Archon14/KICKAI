"use client";

import React, { useState } from "react";
import { TrendingUp, Shield, RefreshCcw, Zap, Info } from "lucide-react";

export default function AutoPredictPanel() {
  const [home, setHome] = useState("Arsenal");
  const [away, setAway] = useState("Liverpool");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const clubCorrections: Record<string, string> = {
    chelsa: "Chelsea",
    chelsee: "Chelsea",
    liverpol: "Liverpool",
    liverpoolfc: "Liverpool",
    arsnal: "Arsenal",
    aresenal: "Arsenal",
    mancity: "Man City",
    manunited: "Man United",
    manchesterunited: "Man United",
    manchestercity: "Man City",
    tottenhamhotspur: "Tottenham",
    newcastleunited: "Newcastle",
  };

  function correctClub(name: string) {
    const key = name.toLowerCase().replace(/[^a-z]/g, "");
    return clubCorrections[key] || name.trim();
  }

  async function runAuto() {
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("http://localhost:8000/api/auto/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ home_team: correctClub(home), away_team: correctClub(away), refresh_data: false, include_formation_recommendation: true }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : "Prediction failed. Please try again."
        );
      }
      const data = await res.json();
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Prediction failed.");
    } finally { setLoading(false); }
  }

  return (
    <div className="rounded-xl bg-[var(--kick-card)] border border-[var(--kick-border)] p-5 space-y-4 shadow-xl">
      <div className="flex items-center gap-2 text-[var(--kick-secondary)]">
        <Zap size={18} />
        <h3 className="text-base font-bold tracking-tight">Automatic Match Predict</h3>
        <span className="text-[10px] bg-[var(--kick-bg)] text-[var(--kick-secondary)] px-2 py-0.5 rounded border border-[var(--kick-border)]">No Elo needed</span>
      </div>

      <div className="flex gap-2">
        <input value={home} onChange={e=>setHome(e.target.value)} className="flex-1 bg-[var(--kick-bg)] border border-[var(--kick-border)] rounded px-3 py-2 text-xs text-[var(--kick-text)]" placeholder="Home team" />
        <span className="text-[var(--kick-muted)] text-xs self-center">vs</span>
        <input value={away} onChange={e=>setAway(e.target.value)} className="flex-1 bg-[var(--kick-bg)] border border-[var(--kick-border)] rounded px-3 py-2 text-xs text-[var(--kick-text)]" placeholder="Away team" />
        <button onClick={runAuto} disabled={loading} className="bg-[var(--kick-primary)] hover:brightness-110 text-[#07140f] font-bold px-4 py-2 rounded text-xs transition-colors">{loading ? "Predicting..." : "Predict"}</button>
      </div>

      {error && <div className="text-xs text-rose-400 bg-rose-950/20 p-2 rounded">{error}</div>}

      {result && !error && (
        <div className="space-y-3">
          <div className="rounded-lg bg-[var(--kick-bg)] border border-[var(--kick-primary)] p-4 text-center">
            <div className="text-xs text-[var(--kick-secondary)] mb-2">MOST LIKELY SCORE</div>
            <div className="text-sm text-[var(--kick-text)]">
              {result.home_team} vs {result.away_team}
            </div>
            <div className="text-4xl font-mono font-bold text-white mt-2">
              {result.predictions?.most_likely_score?.join(" - ") || "N/A"}
            </div>
          </div>
          <div className="text-[11px] text-[var(--kick-muted)] bg-[var(--kick-bg)] border border-[var(--kick-border)] rounded p-3">
            <span className="text-[var(--kick-secondary)] font-semibold">Prediction information:</span>
            {" "}Based on historical 2025–26 Premier League results and
            10,000 match simulations. Team ratings are estimates, not official
            ClubElo ratings. Results are probabilities, not guarantees.
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-[var(--kick-bg)] border border-[var(--kick-border)] rounded p-3 text-center">
              <div className="text-[var(--kick-muted)] mb-1">Home Expected Goals (xG)</div>
              <div className="text-lg font-bold text-[var(--kick-primary)]">
                {result.predictions?.xg_home?.toFixed(2) ?? "N/A"}
              </div>
              <div className="text-[var(--kick-muted)] mt-1">
                Rating: {result.predictions?.elo_home ?? "N/A"}
              </div>
            </div>
            <div className="bg-[var(--kick-bg)] border border-[var(--kick-border)] rounded p-3 text-center">
              <div className="text-[var(--kick-muted)] mb-1">Away Expected Goals (xG)</div>
              <div className="text-lg font-bold text-rose-400">
                {result.predictions?.xg_away?.toFixed(2) ?? "N/A"}
              </div>
              <div className="text-[var(--kick-muted)] mt-1">
                Rating: {result.predictions?.elo_away ?? "N/A"}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="bg-[var(--kick-bg)] border border-[var(--kick-border)] rounded p-3 text-center">
            <div className="text-xs text-[var(--kick-muted)] mb-1">Home Win %</div>
            <div className="text-xl font-mono font-bold text-[var(--kick-primary)]">{(result.predictions?.home_win_probability * 100 || 0).toFixed(1)}%</div>
          </div>
          <div className="bg-[var(--kick-bg)] border border-[var(--kick-border)] rounded p-3 text-center">
            <div className="text-xs text-[var(--kick-muted)] mb-1">Draw %</div>
            <div className="text-xl font-mono font-bold text-[var(--kick-text)]">{(result.predictions?.draw_probability * 100 || 0).toFixed(1)}%</div>
          </div>
          <div className="bg-[var(--kick-bg)] border border-[var(--kick-border)] rounded p-3 text-center">
            <div className="text-xs text-[var(--kick-muted)] mb-1">Away Win %</div>
            <div className="text-xl font-mono font-bold text-rose-400">{(result.predictions?.away_win_probability * 100 || 0).toFixed(1)}%</div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
