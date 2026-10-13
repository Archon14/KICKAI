"use client";

import React from "react";
import type { TacticalOptionModel } from "@/lib/types";

interface TacticalMatrixProps {
  options: TacticalOptionModel[];
  selectedOptionId?: string | null;
  onSelectOption?: (option: TacticalOptionModel) => void;
}

export default function TacticalMatrix({
  options,
  selectedOptionId,
  onSelectOption,
}: TacticalMatrixProps) {
  if (!options || options.length === 0) {
    return (
      <div className="rounded-lg bg-zinc-900/40 border border-zinc-800 p-5 text-center text-xs text-zinc-400">
        No tactical alternatives generated yet.
      </div>
    );
  }

  const sorted = [...options].sort((a, b) => b.expected_value - a.expected_value);
  const maxEV = Math.max(...sorted.map((o) => o.expected_value), 0.5);

  return (
    <div className="rounded-lg bg-zinc-900/40 border border-zinc-800/80 p-4">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800/80">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">
            Tactical Decision Matrix
          </h3>
          <p className="text-[11px] text-zinc-400">
            Attacking alternatives ranked by Expected Value (EV)
          </p>
        </div>
        <span className="text-[11px] font-mono text-zinc-400">
          {sorted.length} options
        </span>
      </div>

      <div className="space-y-1.5">
        {sorted.map((opt, rank) => {
          const isSelected = selectedOptionId === opt.id || (selectedOptionId === undefined && rank === 0);
          const evPercent = (opt.expected_value * 100).toFixed(1);
          const barWidthPercent = Math.min(100, Math.max(10, (opt.expected_value / maxEV) * 100));

          return (
            <div
              key={opt.id}
              onClick={() => onSelectOption?.(opt)}
              className={`p-3 rounded-md border transition-colors cursor-pointer ${
                isSelected
                  ? "bg-zinc-800/70 border-zinc-600 text-zinc-100"
                  : "bg-zinc-900/20 border-zinc-800/60 hover:bg-zinc-800/40 text-zinc-300"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-zinc-400">
                    0{rank + 1}
                  </span>
                  <span className="font-medium text-xs text-zinc-100">
                    {opt.action}
                  </span>
                  {opt.target_player && (
                    <span className="text-[10px] text-zinc-400 font-mono">
                      → {opt.target_player}
                    </span>
                  )}
                  {rank === 0 && (
                    <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/20">
                      Best
                    </span>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-semibold text-emerald-400">
                    +{evPercent}%
                  </span>
                  <span className="text-[10px] text-zinc-400 ml-1">EV</span>
                </div>
              </div>

              {/* Minimal bar */}
              <div className="w-full bg-zinc-800/80 rounded-full h-1.5 overflow-hidden mb-2">
                <div
                  className="h-full bg-emerald-500/80 rounded-full transition-all duration-300"
                  style={{ width: `${barWidthPercent}%` }}
                />
              </div>

              {/* Stats Footer */}
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <div className="flex items-center gap-3 font-mono">
                  <span>Risk {(opt.risk * 100).toFixed(0)}%</span>
                  <span>Conf {(opt.confidence * 100).toFixed(0)}%</span>
                </div>
                {opt.why && Object.keys(opt.why).length > 0 && (
                  <span className="text-[10px] text-zinc-400 truncate max-w-[200px]">
                    {Object.values(opt.why)[0]}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
