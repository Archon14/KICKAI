"use client";

import React, { useEffect, useState } from "react";
import ScoreDistribution from "@/components/ScoreDistribution";
import MetricCard from "@/components/MetricCard";
import LoadingPitch from "@/components/LoadingPitch";
import { simulateMatch } from "@/lib/api";
import type { MatchSimulateResponse, MatchSimulateRequest } from "@/lib/types";
import { Play } from "lucide-react";

export default function MatchSimulatorPage() {
  const [homeTeam, setHomeTeam] = useState("Arsenal");
  const [awayTeam, setAwayTeam] = useState("Liverpool");
  const [homeElo, setHomeElo] = useState<number>(1850);
  const [awayElo, setAwayElo] = useState<number>(1830);
  const [homeXg, setHomeXg] = useState<number>(1.65);
  const [awayXg, setAwayXg] = useState<number>(1.35);
  const [simulations, setSimulations] = useState<number>(10000);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MatchSimulateResponse | null>(null);

  useEffect(() => {
    handleSimulate();
  }, []);

  async function handleSimulate() {
    setLoading(true);
    try {
      const payload: MatchSimulateRequest = {
        home_team: homeTeam,
        away_team: awayTeam,
        home_elo: homeElo,
        away_elo: awayElo,
        home_xg: homeXg,
        away_xg: awayXg,
        simulations,
        seed: 42,
      };
      const res = await simulateMatch(payload);
      setResult(res);
    } catch (err) {
      console.error("Match simulation failed:", err);
    } finally {
      setLoading(false);
    }
  }

  const homeWinPct = result ? (result.home_win_probability * 100).toFixed(1) : "45.2";
  const drawPct = result ? (result.draw_probability * 100).toFixed(1) : "26.4";
  const awayWinPct = result ? (result.away_win_probability * 100).toFixed(1) : "28.4";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-zinc-800/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100">
            Match Simulator
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Monte Carlo Poisson-logistic draws based on team strength ratings and expected goals
          </p>
        </div>

        <span className="text-xs font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded">
          N = {simulations.toLocaleString()}
        </span>
      </div>

      {/* Inputs Configuration */}
      <div className="rounded-lg bg-zinc-900/40 border border-zinc-800/80 p-4 space-y-4">
        {/* Team Names */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wide mb-1">
              Home Team
            </label>
            <input
              type="text"
              value={homeTeam}
              onChange={(e) => setHomeTeam(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 font-medium focus:outline-none focus:border-zinc-600"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wide mb-1">
              Away Team
            </label>
            <input
              type="text"
              value={awayTeam}
              onChange={(e) => setAwayTeam(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-100 font-medium focus:outline-none focus:border-zinc-600"
            />
          </div>
        </div>

        {/* Elo & xG Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span>Home Elo</span>
              <span className="font-mono text-zinc-200">{homeElo}</span>
            </div>
            <input
              type="range"
              min={1000}
              max={2500}
              step={10}
              value={homeElo}
              onChange={(e) => setHomeElo(parseInt(e.target.value, 10))}
              className="w-full accent-zinc-300 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span>Away Elo</span>
              <span className="font-mono text-zinc-200">{awayElo}</span>
            </div>
            <input
              type="range"
              min={1000}
              max={2500}
              step={10}
              value={awayElo}
              onChange={(e) => setAwayElo(parseInt(e.target.value, 10))}
              className="w-full accent-zinc-300 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span>Home xG</span>
              <span className="font-mono text-zinc-200">{homeXg.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.2}
              max={5.0}
              step={0.05}
              value={homeXg}
              onChange={(e) => setHomeXg(parseFloat(e.target.value))}
              className="w-full accent-zinc-300 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span>Away xG</span>
              <span className="font-mono text-zinc-200">{awayXg.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.2}
              max={5.0}
              step={0.05}
              value={awayXg}
              onChange={(e) => setAwayXg(parseFloat(e.target.value))}
              className="w-full accent-zinc-300 cursor-pointer"
            />
          </div>
        </div>

        {/* Iterations + Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-zinc-800/80">
          <div className="flex-1 max-w-sm">
            <div className="flex justify-between text-xs text-zinc-400 mb-1">
              <span>Simulations</span>
              <span className="font-mono text-zinc-200">{simulations.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={1000}
              max={50000}
              step={1000}
              value={simulations}
              onChange={(e) => setSimulations(parseInt(e.target.value, 10))}
              className="w-full accent-zinc-300 cursor-pointer"
            />
          </div>

          <button
            onClick={handleSimulate}
            disabled={loading}
            className="bg-zinc-100 hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-semibold px-4 py-1.5 rounded text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {loading ? (
              <span>Running...</span>
            ) : (
              <>
                <Play size={13} fill="currentColor" />
                Run Simulation
              </>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingPitch label={`Running ${simulations.toLocaleString()} iterations...`} />
      ) : result ? (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <MetricCard
              title={`${homeTeam} Win`}
              value={`${homeWinPct}%`}
              subtitle={`Exp Goals: ${result.expected_home_goals.toFixed(2)}`}
            />
            <MetricCard
              title="Draw"
              value={`${drawPct}%`}
              subtitle="Stalemate probability"
            />
            <MetricCard
              title={`${awayTeam} Win`}
              value={`${awayWinPct}%`}
              subtitle={`Exp Goals: ${result.expected_away_goals.toFixed(2)}`}
            />
            <MetricCard
              title="Modal Score"
              value={`${result.most_likely_score[0]} – ${result.most_likely_score[1]}`}
              subtitle="Most probable scoreline"
            />
          </div>

          {/* Probability Bar */}
          <div className="rounded-lg bg-zinc-900/40 border border-zinc-800/80 p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-300">Outcome Distribution</span>
              <span className="font-mono text-zinc-400">100% Total</span>
            </div>

            <div className="w-full h-4 bg-zinc-800 rounded-full flex overflow-hidden">
              <div
                className="bg-emerald-500/80 h-full transition-all duration-300"
                style={{ width: `${homeWinPct}%` }}
                title={`${homeTeam}: ${homeWinPct}%`}
              />
              <div
                className="bg-zinc-500 h-full transition-all duration-300"
                style={{ width: `${drawPct}%` }}
                title={`Draw: ${drawPct}%`}
              />
              <div
                className="bg-sky-500/80 h-full transition-all duration-300"
                style={{ width: `${awayWinPct}%` }}
                title={`${awayTeam}: ${awayWinPct}%`}
              />
            </div>

            <div className="grid grid-cols-3 text-center text-[11px] text-zinc-400 pt-1 font-mono">
              <div>{homeTeam} {homeWinPct}%</div>
              <div>Draw {drawPct}%</div>
              <div>{awayTeam} {awayWinPct}%</div>
            </div>
          </div>

          {/* Score distribution heatmap */}
          <ScoreDistribution
            scoreDistribution={result.score_distribution}
            mostLikelyScore={result.most_likely_score}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
          />
        </>
      ) : null}
    </div>
  );
}
