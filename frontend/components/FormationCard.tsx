"use client";

import React from "react";
import type { FormationOptionModel } from "@/lib/types";

interface FormationCardProps {
  formation: FormationOptionModel;
  isBest?: boolean;
  onSelect?: () => void;
}

export default function FormationCard({ formation, isBest = false, onSelect }: FormationCardProps) {
  const lines = formation.shape
    .split("-")
    .map((n) => parseInt(n.trim(), 10))
    .filter((n) => !isNaN(n));

  return (
    <div
      onClick={onSelect}
      className={`rounded-lg p-4 border transition-colors cursor-pointer ${
        isBest
          ? "bg-zinc-850/80 border-emerald-500/40 text-zinc-100"
          : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 text-zinc-300"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-base font-bold text-zinc-100">{formation.shape}</h4>
            {isBest && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                Recommended
              </span>
            )}
          </div>
          <span className="text-[11px] text-zinc-400 capitalize">
            {formation.family}
          </span>
        </div>

        <div className="text-right">
          <div className="text-sm font-mono font-bold text-emerald-400">
            {(formation.score * 100).toFixed(0)}%
          </div>
          <span className="text-[10px] text-zinc-400">Fit</span>
        </div>
      </div>

      {/* Mini layout preview */}
      <div className="w-full h-16 bg-zinc-950/70 border border-zinc-800/80 rounded p-1.5 flex flex-col justify-between my-2.5">
        <div className="flex justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
        </div>
        {lines.map((count, lineIdx) => (
          <div key={lineIdx} className="flex justify-around items-center px-3">
            {Array.from({ length: count }).map((_, pIdx) => (
              <span
                key={pIdx}
                className="w-1.5 h-1.5 rounded-full bg-emerald-400/70"
              />
            ))}
          </div>
        ))}
      </div>

      <p className="text-xs text-zinc-400 line-clamp-2 mt-1">
        {formation.why}
      </p>
    </div>
  );
}
