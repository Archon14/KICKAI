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
    <div className="rounded-lg bg-zinc-900/40 border border-zinc-800/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-zinc-800/80">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">
            Scoreline Probability Distribution
          </h3>
          <p className="text-[11px] text-zinc-400">
            Monte Carlo Poisson-logistic matrix (0 to 5 goals)
          </p>
        </div>

        {mostLikelyScore && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800 border border-zinc-700/60 text-xs">
            <span className="text-zinc-400 text-[11px]">Modal Score:</span>
            <span className="font-mono font-semibold text-emerald-400">
              {homeTeam} {mostLikelyScore[0]} – {mostLikelyScore[1]} {awayTeam}
            </span>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[340px]">
          <div className="text-center text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1.5">
            ← {awayTeam} Goals (Columns) →
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            <div className="text-[10px] font-mono text-zinc-400 flex items-center justify-center">
              H \ A
            </div>
            {[0, 1, 2, 3, 4, 5].map((g) => (
              <div
                key={`away-${g}`}
                className="text-xs font-mono text-zinc-400 py-0.5"
              >
                {g}
              </div>
            ))}

            {[0, 1, 2, 3, 4, 5].map((homeGoals) => (
              <React.Fragment key={`row-${homeGoals}`}>
                <div className="text-xs font-mono text-zinc-400 flex items-center justify-center py-1">
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
                    ? "bg-emerald-500/25 text-emerald-300 border border-emerald-400/50 font-bold"
                    : intensity > 0.5
                    ? "bg-zinc-800 text-zinc-200 border border-zinc-700/60"
                    : intensity > 0.2
                    ? "bg-zinc-850/60 text-zinc-300 border border-zinc-800"
                    : "bg-zinc-900/40 text-zinc-400 border border-zinc-850";

                  return (
                    <div
                      key={`cell-${homeGoals}-${awayGoals}`}
                      onClick={() =>
                        setSelectedCell(
                          item || { home: homeGoals, away: awayGoals, probability: 0 }
                        )
                      }
                      title={`${homeTeam} ${homeGoals} - ${awayGoals} ${awayTeam} (${probPct}%)`}
                      className={`h-9 rounded flex flex-col items-center justify-center cursor-pointer transition-colors hover:border-zinc-500 p-0.5 ${cellClass}`}
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

          <div className="text-left text-[10px] font-medium text-zinc-400 uppercase tracking-wider mt-1.5">
            ↑ {homeTeam} Goals (Rows)
          </div>
        </div>
      </div>

      {selectedCell && (
        <div className="mt-3 p-2.5 bg-zinc-950/60 rounded border border-zinc-800 text-xs flex items-center justify-between">
          <span className="text-zinc-300 font-mono">
            {homeTeam} {selectedCell.home} : {selectedCell.away} {awayTeam}
          </span>
          <span className="font-mono text-emerald-400 font-semibold">
            {(selectedCell.probability * 100).toFixed(2)}% probability
          </span>
        </div>
      )}
    </div>
  );
}
