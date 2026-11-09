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
      <div className="rounded-lg bg-[var(--kick-card)] border border-[var(--kick-border)] p-5 text-center text-xs text-[var(--kick-muted)]">
        No tactical alternatives generated yet.
      </div>
    );
  }

  const sorted = [...options].sort((a, b) => b.expected_value - a.expected_value);
  const maxEV = Math.max(...sorted.map((o) => o.expected_value), 0.5);

  return (
    <div className="rounded-lg bg-[var(--kick-card)] border border-[var(--kick-border)] p-4">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--kick-border)]">
        <div>
          <h3 className="text-sm font-semibold text-[var(--kick-text)]">
            Tactical Decision Matrix
          </h3>
          <p className="text-[11px] text-[var(--kick-muted)]">
            Attacking alternatives ranked by Expected Value (EV)
          </p>
        </div>
        <span className="text-[11px] font-mono text-[var(--kick-muted)]">
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
                  ? "bg-[var(--kick-card)] border-[var(--kick-primary)] text-[var(--kick-text)]"
                  : "bg-[var(--kick-bg)] border-[var(--kick-border)] hover:brightness-110 text-[var(--kick-text)]"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-[var(--kick-muted)]">
                    0{rank + 1}
                  </span>
                  <span className="font-medium text-xs text-[var(--kick-text)]">
                    {opt.action}
                  </span>
                  {opt.target_player && (
                    <span className="text-[10px] text-[var(--kick-muted)] font-mono">
                      → {opt.target_player}
                    </span>
                  )}
                  {rank === 0 && (
                    <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-[var(--kick-bg)] text-[var(--kick-primary)] border border-[var(--kick-border)]">
                      Best
                    </span>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-semibold text-[var(--kick-primary)]">
                    +{evPercent}%
                  </span>
                  <span className="text-[10px] text-[var(--kick-muted)] ml-1">EV</span>
                </div>
              </div>

              {/* Minimal bar */}
              <div className="w-full bg-[var(--kick-bg)] rounded-full h-1.5 overflow-hidden mb-2">
                <div
                  className="h-full bg-emerald-500/80 rounded-full transition-all duration-300"
                  style={{ width: `${barWidthPercent}%` }}
                />
              </div>

              {/* Stats Footer */}
              <div className="flex items-center justify-between text-[11px] text-[var(--kick-muted)]">
                <div className="flex items-center gap-3 font-mono">
                  <span>Risk {(opt.risk * 100).toFixed(0)}%</span>
                  <span>Conf {(opt.confidence * 100).toFixed(0)}%</span>
                </div>
                {opt.why && Object.keys(opt.why).length > 0 && (
                  <span className="text-[10px] text-[var(--kick-muted)] truncate max-w-[200px]">
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
