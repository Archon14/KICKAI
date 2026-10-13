"use client";

import React, { useEffect, useState } from "react";
import DrillCard from "@/components/DrillCard";
import MetricCard from "@/components/MetricCard";
import LoadingPitch from "@/components/LoadingPitch";
import { getDrill } from "@/lib/api";
import type { TrainingAdaptiveDrillResponse } from "@/lib/types";
import { Check, Flame, X } from "lucide-react";

export default function TrainingLabPage() {
  const [errorMode, setErrorMode] = useState<string>("no_scan");
  const [streak, setStreak] = useState<number>(3);
  const [totalReps, setTotalReps] = useState<number>(14);
  const [successCount, setSuccessCount] = useState<number>(11);
  const [difficulty, setDifficulty] = useState<number>(0.4);

  const [loading, setLoading] = useState(false);
  const [drillData, setDrillData] = useState<TrainingAdaptiveDrillResponse | null>(null);

  useEffect(() => {
    fetchDrill(true, null, 0.4);
  }, []);

  async function fetchDrill(success: boolean, error: string | null, curDiff: number) {
    setLoading(true);
    try {
      const res = await getDrill(success, error, curDiff);
      setDrillData(res);
      setDifficulty(res.next_difficulty);
    } catch (err) {
      console.error("Adaptive drill request failed:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleSuccess() {
    setStreak((s) => s + 1);
    setTotalReps((r) => r + 1);
    setSuccessCount((sc) => sc + 1);
    fetchDrill(true, null, difficulty);
  }

  function handleFailure() {
    setStreak(0);
    setTotalReps((r) => r + 1);
    fetchDrill(false, errorMode, difficulty);
  }

  const successRate =
    totalReps > 0 ? ((successCount / totalReps) * 100).toFixed(0) : "100";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-zinc-800/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100">
            Adaptive Training Lab
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Dynamic drill difficulty progression responding to execution failure modes
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300">
          <Flame size={13} className="text-amber-400" />
          <span>Streak: {streak}</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricCard
          title="Current Streak"
          value={`${streak} reps`}
          subtitle="Successful repetitions"
        />
        <MetricCard
          title="Drill Difficulty"
          value={`${(difficulty * 100).toFixed(0)}%`}
          subtitle="Current intensity level"
        />
        <MetricCard
          title="Success Rate"
          value={`${successRate}%`}
          subtitle={`${successCount} of ${totalReps} completed`}
        />
        <MetricCard
          title="Active Target"
          value={drillData?.drill.focus || "Scanning"}
          subtitle={drillData?.weakness || "Target weakness"}
        />
      </div>

      {/* Controls */}
      <div className="rounded-lg bg-zinc-900/40 border border-zinc-800/80 p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
          <h3 className="text-xs font-semibold text-zinc-200 uppercase tracking-wide">
            Record Execution Outcome
          </h3>
          <span className="text-[11px] text-zinc-400">
            Algorithmic adaptation trigger
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-center">
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wide mb-1">
              Failure Mode
            </label>
            <select
              value={errorMode}
              onChange={(e) => setErrorMode(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600"
            >
              <option value="late">late — Delayed pass/decision</option>
              <option value="heavy_touch">heavy_touch — Uncontrolled first touch</option>
              <option value="closed_body">closed_body — Closed body orientation</option>
              <option value="no_scan">no_scan — Failed pre-orientation scan</option>
              <option value="overhit">overhit — Excessive pass weight</option>
              <option value="underhit">underhit — Insufficient pass weight</option>
            </select>
          </div>

          <div className="lg:col-span-2 flex gap-2.5">
            <button
              onClick={handleSuccess}
              disabled={loading}
              className="flex-1 bg-zinc-100 hover:bg-zinc-200 disabled:bg-zinc-800 text-zinc-950 font-semibold py-2 px-3 rounded text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check size={14} />
              Mark Success
            </button>

            <button
              onClick={handleFailure}
              disabled={loading}
              className="flex-1 bg-zinc-800 hover:bg-zinc-750 disabled:bg-zinc-900 text-rose-400 border border-zinc-700/60 font-medium py-2 px-3 rounded text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <X size={14} />
              Mark Failure ({errorMode})
            </button>
          </div>
        </div>
      </div>

      {/* Drill View */}
      {loading ? (
        <LoadingPitch label="Adapting drill parameters..." />
      ) : drillData ? (
        <div className="space-y-3">
          <DrillCard
            drill={drillData.drill}
            weakness={drillData.weakness}
            feedback={drillData.feedback}
            nextDifficulty={drillData.next_difficulty}
          />

          <div className="rounded-lg bg-zinc-900/40 border border-zinc-800/80 p-3 text-xs text-zinc-400">
            <span className="font-medium text-zinc-200">Engine Note: </span>
            <span>{drillData.claim}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
