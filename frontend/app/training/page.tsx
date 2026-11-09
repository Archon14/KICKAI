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
  const [streak, setStreak] = useState<number>(0);
  const [totalReps, setTotalReps] = useState<number>(0);
  const [successCount, setSuccessCount] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<number>(0.4);

  const [loading, setLoading] = useState(false);
  const [drillData, setDrillData] = useState<TrainingAdaptiveDrillResponse | null>(null);

  useEffect(() => {
    fetchDrill(true, null, 0.4, 0);
  }, []);

  async function fetchDrill(success: boolean, error: string | null, curDiff: number, previousStreak: number) {
    setLoading(true);
    try {
      const res = await getDrill(success, error, curDiff, previousStreak);
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
    fetchDrill(true, null, difficulty, streak);
  }

  function handleFailure() {
    setStreak(0);
    setTotalReps((r) => r + 1);
    fetchDrill(false, errorMode, difficulty, 0);
  }

  const successRate =
    totalReps > 0 ? ((successCount / totalReps) * 100).toFixed(0) : "0";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[var(--kick-border)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--kick-text)]">
            Adaptive Training Lab
          </h1>
          <p className="text-xs text-[var(--kick-muted)] mt-0.5">
            Personalized football drills that adapt to your performance
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--kick-card)] border border-[var(--kick-border)] text-xs font-mono text-[var(--kick-text)]">
          <Flame size={13} className="text-[var(--kick-secondary)]" />
          <span>Streak: {streak}</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <MetricCard
          title="Current Streak"
          value={`${streak} reps`}
          subtitle="Successful repetitions"
        />
        <MetricCard
          title="Success Rate"
          value={`${successRate}%`}
          subtitle={`${successCount} of ${totalReps} completed`}
        />
        <MetricCard
          title="Active Skill"
          value={drillData?.drill.focus || "Scanning"}
          subtitle="Current training focus"
        />
      </div>

      {/* Difficulty Progress */}
      <div className="rounded-xl border border-[var(--kick-border)] bg-[var(--kick-card)] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[var(--kick-text)]">
              Training Difficulty
            </h3>
            <p className="text-xs text-[var(--kick-muted)] mt-1">
              Complete three consecutive drills successfully to level up.
            </p>
          </div>
          <span className="text-lg font-bold text-[var(--kick-secondary)]">
            {(difficulty * 100).toFixed(0)}%
          </span>
        </div>

        <div
          role="progressbar"
          aria-label="Training difficulty"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(difficulty * 100)}
          className="h-3 w-full overflow-hidden rounded-full bg-[var(--kick-card)]"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, difficulty * 100))}%` }}
          />
        </div>

        <div className="flex justify-between text-[11px] text-[var(--kick-muted)]">
          <span>Beginner</span>
          <span>Intermediate</span>
          <span>Advanced</span>
        </div>
      </div>

      {/* Controls */}
      <div className="rounded-lg bg-[var(--kick-card)] border border-[var(--kick-border)] p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--kick-border)]">
          <h3 className="text-xs font-semibold text-[var(--kick-text)] uppercase tracking-wide">
            Result
          </h3>
          <span className="text-[11px] text-[var(--kick-muted)]">
            Advice
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-center">
          <div>
            <label className="block text-[11px] font-medium text-[var(--kick-muted)] uppercase tracking-wide mb-1">
              Area to Improve
            </label>
            <select
              value={errorMode}
              onChange={(e) => setErrorMode(e.target.value)}
              className="w-full bg-[var(--kick-bg)] border border-[var(--kick-border)] rounded px-2.5 py-1.5 text-xs text-[var(--kick-text)] focus:outline-none focus:border-[var(--kick-primary)]"
            >
              <option value="late">Slow Decision-Making</option>
              <option value="heavy_touch">Poor First Touch</option>
              <option value="closed_body">Incorrect Body Positioning</option>
              <option value="no_scan">Not Checking Surroundings</option>
              <option value="overhit">Passing or Shooting Too Hard</option>
              <option value="underhit">Passing or Shooting Too Softly</option>
            </select>
          </div>

          <div className="lg:col-span-2 flex gap-2.5">
            <button
              onClick={handleSuccess}
              disabled={loading}
              className="flex-1 bg-[var(--kick-primary)] hover:brightness-110 disabled:bg-[var(--kick-card)] text-[var(--kick-bg)] font-semibold py-2 px-3 rounded text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check size={14} />
              Completed Successfully
            </button>

            <button
              onClick={handleFailure}
              disabled={loading}
              className="flex-1 bg-[var(--kick-card)] hover:brightness-110 disabled:bg-[var(--kick-card)] text-rose-400 border border-[var(--kick-border)]/60 font-medium py-2 px-3 rounded text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <X size={14} />
              Needs Improvement
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

          <div className="rounded-lg bg-[var(--kick-card)] border border-[var(--kick-border)] p-3 text-xs text-[var(--kick-muted)]">
            <span className="font-medium text-[var(--kick-text)]">Engine Note: </span>
            <span>{drillData.claim}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
