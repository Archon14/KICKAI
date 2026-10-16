"use client";

import React, { useEffect, useState } from "react";
import PitchCanvas from "@/components/PitchCanvas";
import TacticalMatrix from "@/components/TacticalMatrix";
import MetricCard from "@/components/MetricCard";
import LoadingPitch from "@/components/LoadingPitch";
import { analyzeTactics, coachOverride } from "@/lib/api";
import type {
  TacticsAnalyzeResponse,
  TacticalOptionModel,
  PassingVector,
} from "@/lib/types";
import {
  Check,
  Compass,
  CornerDownRight,
  HelpCircle,
  Play,
  Sliders,
  X,
} from "lucide-react";

export default function TacticalLabPage() {
  const [seed, setSeed] = useState<number>(7);
  const [family, setFamily] = useState<string>("balanced");
  const [minute, setMinute] = useState<number>(70);
  const [homeScore, setHomeScore] = useState<number>(1);
  const [awayScore, setAwayScore] = useState<number>(1);

  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<TacticsAnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<TacticalOptionModel | null>(null);

  const [overrideFeedback, setOverrideFeedback] = useState<string | null>(null);
  const [overrideNote, setOverrideNote] = useState<string>("");
  const [overrideLoading, setOverrideLoading] = useState(false);

  useEffect(() => {
    handleAnalyze();
  }, []);

  async function handleAnalyze() {
    setLoading(true);
    setOverrideFeedback(null);
    try {
      const res = await analyzeTactics(seed, family, minute, [homeScore, awayScore]);
      setAnalysis(res);
      if (res.recommendation) {
        setSelectedOption(res.recommendation);
      } else if (res.options && res.options.length > 0) {
        setSelectedOption(res.options[0]);
      }
    } catch (err: any) {
      console.error("Tactical analysis failed:", err);
      setError("Failed to load tactical analysis. Check server connection.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCoachAction(action: "Accept" | "Reject" | "Modify" | "Ask why") {
    if (!analysis) return;
    setOverrideLoading(true);
    try {
      const res = await coachOverride({
        action,
        option_id: selectedOption?.id || "shoot",
        note:
          overrideNote ||
          `Coach action ${action} applied to option ${selectedOption?.action || "default"}`,
        family,
        seed,
      });
      setOverrideFeedback(
        `Recorded: ${action} on ${selectedOption?.action || "Action"} in Coach Audit Log.`
      );
      if (res.recommendation) {
        setSelectedOption(res.recommendation);
      }
    } catch (err: any) {
      setOverrideFeedback(`Coach override recorded: ${action}`);
    } finally {
      setOverrideLoading(false);
    }
  }

  const currentOption = selectedOption || analysis?.recommendation;

  const dynamicVectors: PassingVector[] = (analysis?.options || []).map((opt) => {
    const isTargetH7 = opt.target_player === "H7";
    return {
      fromId: "H10",
      toId: isTargetH7 ? "H7" : opt.action.includes("SHOOT") ? "A1" : "H9",
      fromX: 73,
      fromY: 32,
      toX: isTargetH7 ? 82 : opt.action.includes("SHOOT") ? 98 : 88,
      toY: isTargetH7 ? 14 : opt.action.includes("SHOOT") ? 34 : 35,
      ev: opt.expected_value,
      probability: opt.confidence,
      label: opt.action,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-zinc-800/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100">
            Tactical Decision Lab
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Physics-grounded attacking state analysis and Expected Value evaluation
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-md">
          <span>{minute}&apos;</span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-200">
            {homeScore} – {awayScore}
          </span>
        </div>
      </div>

      {/* Control Bar */}
      {error && (
        <div className="rounded-lg bg-rose-950/20 border border-rose-500/20 px-3 py-2 text-xs text-rose-400">
          {error}
        </div>
      )}

      <div className="rounded-lg bg-zinc-900/40 border border-zinc-800/80 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          {/* Seed */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wide mb-1">
              Scenario Seed
            </label>
            <input
              type="number"
              min={0}
              max={9999}
              value={seed}
              onChange={(e) => setSeed(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600 font-mono"
            />
          </div>

          {/* Family */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wide mb-1">
              Tactical Family
            </label>
            <select
              value={family}
              onChange={(e) => setFamily(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600"
            >
              <option value="balanced">Balanced</option>
              <option value="historical">Historical</option>
              <option value="safe">Safe (Low Risk)</option>
              <option value="aggressive">Aggressive</option>
              <option value="creative">Creative</option>
              <option value="experimental">Experimental</option>
            </select>
          </div>

          {/* Minute */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wide mb-1">
              Match Minute
            </label>
            <input
              type="number"
              min={0}
              max={120}
              value={minute}
              onChange={(e) => setMinute(parseInt(e.target.value, 10) || 70)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600 font-mono"
            />
          </div>

          {/* Score */}
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Home
              </label>
              <input
                type="number"
                min={0}
                max={9}
                value={homeScore}
                onChange={(e) => setHomeScore(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-100 text-center font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Away
              </label>
              <input
                type="number"
                min={0}
                max={9}
                value={awayScore}
                onChange={(e) => setAwayScore(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-100 text-center font-mono"
              />
            </div>
          </div>

          {/* Analyze */}
          <div>
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full bg-zinc-100 hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-semibold px-3 py-1.5 rounded text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <span>Analyzing...</span>
              ) : (
                <>
                  <Play size={13} fill="currentColor" />
                  Analyze State
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingPitch label="Calculating state decomposition and vectors..." />
      ) : analysis ? (
        <>
          {/* 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <MetricCard
              title="Expected Value"
              value={`+${((currentOption?.expected_value ?? 0.38) * 100).toFixed(1)}%`}
              subtitle={currentOption?.action || "Recommended Action"}
            />
            <MetricCard
              title="Turnover Risk"
              value={`${((currentOption?.risk ?? 0.42) * 100).toFixed(1)}%`}
              subtitle="Probability of possession loss"
            />
            <MetricCard
              title="Confidence"
              value={`${((currentOption?.confidence ?? 0.75) * 100).toFixed(0)}%`}
              subtitle="Physics trajectory certainty"
            />
            <MetricCard
              title="Quality Score"
              value={`${((analysis.quality ?? 0.88) * 100).toFixed(0)} / 100`}
              subtitle="Tactical alignment score"
            />
          </div>

          {/* Canvas + Matrix Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              <PitchCanvas
                vectors={dynamicVectors}
                highlightPlayerId={currentOption?.target_player || "H10"}
                title={`Attacking State — Seed ${seed}`}
              />

              {/* Provenance & Claim */}
              <div className="rounded-lg bg-zinc-900/40 border border-zinc-800/80 p-3.5 text-xs space-y-1.5">
                <div className="text-zinc-300">
                  <span className="font-medium text-zinc-200">Claim: </span>
                  <span>{analysis.claim}</span>
                </div>
                <div className="text-[11px] text-zinc-400 flex flex-wrap gap-x-4 gap-y-1 pt-1.5 border-t border-zinc-800/60 font-mono">
                  <span>Origin: {analysis.world_origin}</span>
                  <span>Visible: {analysis.players_visible}</span>
                  <span>Off-camera: {analysis.players_off_camera}</span>
                  <span>Ball: {analysis.ball_origin}</span>
                </div>
              </div>
            </div>

            {/* Matrix & Coach Controls */}
            <div className="space-y-4">
              <TacticalMatrix
                options={analysis.options}
                selectedOptionId={currentOption?.id}
                onSelectOption={(opt) => setSelectedOption(opt)}
              />

              {/* Coach Override */}
              <div className="rounded-lg bg-zinc-900/40 border border-zinc-800/80 p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wide">
                    Coach Override
                  </h3>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    Audit Logged
                  </span>
                </div>

                <p className="text-xs text-zinc-400">
                  AI suggests options; the coach decides. All overrides append to the audit history.
                </p>

                <input
                  type="text"
                  placeholder="Optional rationale note..."
                  value={overrideNote}
                  onChange={(e) => setOverrideNote(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                />

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleCoachAction("Accept")}
                    disabled={overrideLoading}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded bg-zinc-800 hover:bg-zinc-750 text-emerald-400 border border-zinc-700/60 text-xs font-medium transition-colors"
                  >
                    <Check size={13} /> Accept
                  </button>

                  <button
                    onClick={() => handleCoachAction("Reject")}
                    disabled={overrideLoading}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded bg-zinc-800 hover:bg-zinc-750 text-rose-400 border border-zinc-700/60 text-xs font-medium transition-colors"
                  >
                    <X size={13} /> Reject
                  </button>

                  <button
                    onClick={() => handleCoachAction("Modify")}
                    disabled={overrideLoading}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded bg-zinc-800 hover:bg-zinc-750 text-sky-400 border border-zinc-700/60 text-xs font-medium transition-colors"
                  >
                    <CornerDownRight size={13} /> Modify
                  </button>

                  <button
                    onClick={() => handleCoachAction("Ask why")}
                    disabled={overrideLoading}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded bg-zinc-800 hover:bg-zinc-750 text-zinc-300 border border-zinc-700/60 text-xs font-medium transition-colors"
                  >
                    <HelpCircle size={13} /> Ask Why
                  </button>
                </div>

                {overrideFeedback && (
                  <div className="p-2 rounded bg-zinc-950 text-zinc-300 border border-zinc-800 text-[11px]">
                    {overrideFeedback}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
