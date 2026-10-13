"use client";

import React from "react";
import type { DrillModel } from "@/lib/types";

interface DrillCardProps {
  drill: DrillModel;
  weakness?: string;
  feedback?: string;
  nextDifficulty?: number;
}

export default function DrillCard({
  drill,
  weakness,
  feedback,
  nextDifficulty,
}: DrillCardProps) {
  const difficultyPct = Math.round((drill.difficulty || 0.4) * 100);

  return (
    <div className="rounded-lg bg-zinc-900/40 border border-zinc-800/80 p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-zinc-800">
        <div>
          <h3 className="text-base font-bold text-zinc-100">{drill.name}</h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Focus: <span className="text-zinc-200">{drill.focus}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-2 py-0.5 rounded text-xs font-mono bg-zinc-800 text-zinc-300 border border-zinc-700/60">
            Difficulty {difficultyPct}%
          </div>
          <div className="px-2 py-0.5 rounded text-xs font-mono bg-zinc-800 text-zinc-300 border border-zinc-700/60">
            {drill.repetitions} Reps
          </div>
        </div>
      </div>

      {/* Subtle Intensity Bar */}
      <div>
        <div className="flex justify-between text-xs text-zinc-400 mb-1">
          <span>Target Intensity</span>
          <span className="font-mono">{difficultyPct}%</span>
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${difficultyPct}%` }}
          />
        </div>
      </div>

      {/* Target weakness & feedback */}
      {(weakness || feedback) && (
        <div className="p-3 bg-zinc-950/60 rounded border border-zinc-850 text-xs space-y-1">
          {weakness && (
            <div className="flex items-center gap-2">
              <span className="text-zinc-400 uppercase text-[10px] tracking-wide">Weakness:</span>
              <span className="text-zinc-200 font-medium">{weakness}</span>
            </div>
          )}
          {feedback && (
            <div className="text-zinc-400 italic">
              &ldquo;{feedback}&rdquo;
            </div>
          )}
        </div>
      )}

      {/* Cues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="bg-zinc-950/40 p-3 rounded border border-zinc-850">
          <h4 className="font-medium text-zinc-300 mb-1.5">Visual Cues</h4>
          {drill.visual_cues && drill.visual_cues.length > 0 ? (
            <ul className="space-y-1 text-zinc-400">
              {drill.visual_cues.map((cue, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-zinc-600">•</span>
                  <span>{cue}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-zinc-400 italic">Standard visual scanning</p>
          )}
        </div>

        <div className="bg-zinc-950/40 p-3 rounded border border-zinc-850">
          <h4 className="font-medium text-zinc-300 mb-1.5">Execution Protocol</h4>
          {drill.audio_cues && drill.audio_cues.length > 0 ? (
            <ul className="space-y-1 text-zinc-400">
              {drill.audio_cues.map((cue, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-zinc-600">•</span>
                  <span>{cue}</span>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="space-y-1 text-zinc-400">
              <li className="flex items-start gap-1.5">
                <span className="text-zinc-600">•</span>
                <span>Whistle on defensive step</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-zinc-600">•</span>
                <span>Audible verbal call on receiver check</span>
              </li>
            </ul>
          )}
        </div>
      </div>

      {nextDifficulty !== undefined && (
        <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
          <span>Projected Next Level</span>
          <span className="font-mono text-zinc-300">
            {(nextDifficulty * 100).toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
}
