"use client";

import React, { useState } from "react";
import { Play, Loader2 } from "lucide-react";
import { simulateMatch } from "@/lib/api";
import type { MatchSimulateResponse } from "@/lib/types";
import ScoreDistribution from "@/components/ScoreDistribution";

export default function AdvancedMatchSimulator() {
  const [homeTeam, setHomeTeam] = useState("Arsenal");
  const [awayTeam, setAwayTeam] = useState("Liverpool");
  const [homeElo, setHomeElo] = useState(1850);
  const [awayElo, setAwayElo] = useState(1830);
  const [homeXg, setHomeXg] = useState(1.65);
  const [awayXg, setAwayXg] = useState(1.35);
  const [simulations, setSimulations] = useState(10000);
  const [result, setResult] = useState<MatchSimulateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runSimulation() {
    if (!homeTeam.trim() || !awayTeam.trim()) {
      setError("Enter both team names.");
      return;
    }
    if (![homeElo, awayElo, homeXg, awayXg, simulations].every(Number.isFinite)
      || homeXg < 0 || awayXg < 0 || homeXg > 10 || awayXg > 10
      || !Number.isInteger(simulations) || simulations < 100 || simulations > 100000) {
      setError("Enter valid numbers. xG must be 0–10 and simulations 100–100,000.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await simulateMatch({
        home_team: homeTeam.trim(),
        away_team: awayTeam.trim(),
        home_elo: homeElo,
        away_elo: awayElo,
        home_xg: homeXg,
        away_xg: awayXg,
        simulations,
        seed: 42,
        auto_lookup: false,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Simulation failed.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full bg-[var(--kick-bg)] border border-[var(--kick-border)] rounded-lg px-3 py-2 text-sm text-[var(--kick-text)] focus:outline-none focus:border-[var(--kick-primary)]";

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-[var(--kick-card)] border border-[var(--kick-border)] p-5 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-[var(--kick-text)]">Advanced Match Simulation</h2>
          <p className="text-xs text-[var(--kick-muted)] mt-1">
            Experiment with team strength and expected goals to explore possible match outcomes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="space-y-1 text-xs text-[var(--kick-muted)]">
            Home Team
            <input className={inputClass} value={homeTeam} onChange={e => setHomeTeam(e.target.value)} />
          </label>
          <label className="space-y-1 text-xs text-[var(--kick-muted)]">
            Away Team
            <input className={inputClass} value={awayTeam} onChange={e => setAwayTeam(e.target.value)} />
          </label>
          <label className="space-y-1 text-xs text-[var(--kick-muted)]">
            Home Elo Rating
            <input type="number" className={inputClass} value={homeElo} onChange={e => setHomeElo(Number(e.target.value))} />
          </label>
          <label className="space-y-1 text-xs text-[var(--kick-muted)]">
            Away Elo Rating
            <input type="number" className={inputClass} value={awayElo} onChange={e => setAwayElo(Number(e.target.value))} />
          </label>
          <label className="space-y-1 text-xs text-[var(--kick-muted)]">
            Home Expected Goals (xG)
            <input type="number" min="0" max="10" step="0.05" className={inputClass} value={homeXg} onChange={e => setHomeXg(Number(e.target.value))} />
          </label>
          <label className="space-y-1 text-xs text-[var(--kick-muted)]">
            Away Expected Goals (xG)
            <input type="number" min="0" max="10" step="0.05" className={inputClass} value={awayXg} onChange={e => setAwayXg(Number(e.target.value))} />
          </label>
        </div>

        <label className="block space-y-2 text-xs text-[var(--kick-muted)]">
          Number of Simulations
          <select className={inputClass} value={simulations} onChange={e => setSimulations(Number(e.target.value))}>
            <option value={1000}>1,000</option>
            <option value={5000}>5,000</option>
            <option value={10000}>10,000</option>
            <option value={50000}>50,000</option>
            <option value={100000}>100,000</option>
          </select>
        </label>

        <button
          onClick={runSimulation}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-[var(--kick-primary)] hover:brightness-110 disabled:opacity-50 text-[#07140f] font-bold rounded-lg px-4 py-3 text-sm"
        >
          {loading ? <Loader2 size={17} className="animate-spin" /> : <Play size={17} />}
          {loading ? "Simulating..." : "Run Simulation"}
        </button>

        {error && <p className="text-sm text-rose-400">{error}</p>}
      </div>

      {result && (
        <div className="space-y-4">
          {result.mock && (
            <div className="rounded-lg border border-[var(--kick-primary)] bg-[var(--kick-card)] p-3 text-xs text-[var(--kick-secondary)]">
              Demonstration data: the prediction engine returned a fallback result.
            </div>
          )}

          <div className="rounded-xl bg-[var(--kick-card)] border border-[var(--kick-primary)] p-6 text-center">
            <p className="text-xs uppercase tracking-widest text-[var(--kick-secondary)]">Most Likely Score</p>
            <p className="text-sm text-[var(--kick-muted)] mt-2">{result.home_team} vs {result.away_team}</p>
            <p className="text-4xl font-bold text-white mt-3">
              {result.most_likely_score.join(" – ")}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              ["Home Win", result.home_win_probability],
              ["Draw", result.draw_probability],
              ["Away Win", result.away_win_probability],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-lg bg-[var(--kick-card)] border border-[var(--kick-border)] p-3 text-center">
                <p className="text-xs text-[var(--kick-muted)]">{label}</p>
                <p className="text-xl font-bold text-[var(--kick-secondary)] mt-1">
                  {(Number(value) * 100).toFixed(1)}%
                </p>
              </div>
            ))}
          </div>

          <ScoreDistribution
            scoreDistribution={result.score_distribution}
            mostLikelyScore={result.most_likely_score as [number, number]}
            homeTeam={result.home_team}
            awayTeam={result.away_team}
          />

          <p className="text-xs text-[var(--kick-muted)] text-center">
            {result.simulations.toLocaleString()} Monte Carlo simulations.
            These are statistical estimates, not guaranteed results.
          </p>
        </div>
      )}
    </div>
  );
}
