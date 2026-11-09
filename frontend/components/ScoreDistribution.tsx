"use client";

import React, { useState } from "react";
import type { ScoreDistributionItem } from "@/lib/types";

interface ScoreDistributionProps {
  scoreDistribution: ScoreDistributionItem[];
  mostLikelyScore?: [number, number];
  homeTeam?: string;
  awayTeam?: string;
}

export default function ScoreDistribution({
  scoreDistribution = [],
  mostLikelyScore = [2, 1],
  homeTeam = "Home",
  awayTeam = "Away",
}: ScoreDistributionProps) {
  const [selectedCell, setSelectedCell] = useState<ScoreDistributionItem | null>(null);

  const matrix: (ScoreDistributionItem | null)[][] = Array.from({ length: 6 }, () =>
    Array.from({ length: 6 }, () => null)
  );

  let maxProb = 0.001;
  scoreDistribution.forEach((item) => {
    if (item.home <= 5 && item.away <= 5) {
      matrix[item.home][item.away] = item;
      if (item.probability > maxProb) {
        maxProb = item.probability;
      }
    }
  });

  return (
    <div className="rounded-lg bg-[var(--kick-card)] border border-[var(--kick-border)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-[var(--kick-border)]">
        <div>
          <h3 className="text-sm font-semibold text-[var(--kick-text)]">
            Scoreline Probability Distribution
          </h3>
          <p className="text-[11px] text-[var(--kick-muted)]">
            Monte Carlo Poisson-logistic matrix (0 to 5 goals)
          </p>
        </div>

        {mostLikelyScore && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[var(--kick-card)] border border-[var(--kick-border)] text-xs">
            <span className="text-[var(--kick-muted)] text-[11px]">Modal Score:</span>
            <span className="font-mono font-semibold text-[var(--kick-primary)]">
              {homeTeam} {mostLikelyScore[0]} – {mostLikelyScore[1]} {awayTeam}
            </span>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[340px]">
          <div className="text-center text-[10px] font-medium text-[var(--kick-muted)] uppercase tracking-wider mb-1.5">
            ← {awayTeam} Goals (Columns) →
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            <div className="text-[10px] font-mono text-[var(--kick-muted)] flex items-center justify-center">
              H \ A
            </div>
            {[0, 1, 2, 3, 4, 5].map((g) => (
              <div
                key={`away-${g}`}
                className="text-xs font-mono text-[var(--kick-muted)] py-0.5"
              >
                {g}
              </div>
            ))}

            {[0, 1, 2, 3, 4, 5].map((homeGoals) => (
              <React.Fragment key={`row-${homeGoals}`}>
                <div className="text-xs font-mono text-[var(--kick-muted)] flex items-center justify-center py-1">
                  {homeGoals}
                </div>

                {[0, 1, 2, 3, 4, 5].map((awayGoals) => {
                  const item = matrix[homeGoals][awayGoals];
                  const prob = item?.probability || 0;
                  const probPct = (prob * 100).toFixed(1);
                  const isTop =
                    mostLikelyScore[0] === homeGoals && mostLikelyScore[1] === awayGoals;
                  const intensity = Math.min(1, prob / maxProb);

                  // Clean monochrome/emerald intensity scale
                  const cellClass = isTop
                    ? "bg-[color-mix(in_srgb,var(--kick-primary)_25%,transparent)] text-[var(--kick-primary)] border border-[var(--kick-primary)] font-bold"
                    : intensity > 0.5
                    ? "bg-[var(--kick-card)] text-[var(--kick-text)] border border-[var(--kick-border)]"
                    : intensity > 0.2
                    ? "bg-[var(--kick-bg)] text-[var(--kick-text)] border border-[var(--kick-border)]"
                    : "bg-[var(--kick-card)] text-[var(--kick-muted)] border border-[var(--kick-border)]";

                  return (
                    <div
                      key={`cell-${homeGoals}-${awayGoals}`}
                      onClick={() =>
                        setSelectedCell(
                          item || { home: homeGoals, away: awayGoals, probability: 0 }
                        )
                      }
                      title={`${homeTeam} ${homeGoals} - ${awayGoals} ${awayTeam} (${probPct}%)`}
                      className={`h-9 rounded flex flex-col items-center justify-center cursor-pointer transition-colors hover:border-[var(--kick-primary)] p-0.5 ${cellClass}`}
                    >
                      <span className="text-[10px] font-mono leading-none">
                        {probPct}%
                      </span>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>

          <div className="text-left text-[10px] font-medium text-[var(--kick-muted)] uppercase tracking-wider mt-1.5">
            ↑ {homeTeam} Goals (Rows)
          </div>
        </div>
      </div>

      {selectedCell && (
        <div className="mt-3 p-2.5 bg-[var(--kick-bg)] rounded border border-[var(--kick-border)] text-xs flex items-center justify-between">
          <span className="text-[var(--kick-text)] font-mono">
            {homeTeam} {selectedCell.home} : {selectedCell.away} {awayTeam}
          </span>
          <span className="font-mono text-[var(--kick-primary)] font-semibold">
            {(selectedCell.probability * 100).toFixed(2)}% probability
          </span>
        </div>
      )}
    </div>
  );
}
