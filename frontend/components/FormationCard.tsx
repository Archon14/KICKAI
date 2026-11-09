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
          ? "bg-[var(--kick-card)] border-[var(--kick-primary)] text-[var(--kick-text)]"
          : "bg-[var(--kick-card)] border-[var(--kick-border)] hover:border-[var(--kick-border)] text-[var(--kick-text)]"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-base font-bold text-[var(--kick-text)]">{formation.shape}</h4>
            {isBest && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--kick-bg)] text-[var(--kick-primary)] border border-[var(--kick-border)]">
                Recommended
              </span>
            )}
          </div>
          <span className="text-[11px] text-[var(--kick-muted)] capitalize">
            {formation.family}
          </span>
        </div>

        <div className="text-right">
          <div className="text-sm font-mono font-bold text-[var(--kick-primary)]">
            {(formation.score * 100).toFixed(0)}%
          </div>
          <span className="text-[10px] text-[var(--kick-muted)]">Fit</span>
        </div>
      </div>

      {/* Mini layout preview */}
      <div className="w-full h-16 bg-[var(--kick-bg)] border border-[var(--kick-border)] rounded p-1.5 flex flex-col justify-between my-2.5">
        <div className="flex justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--kick-secondary)]" />
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

      <p className="text-xs text-[var(--kick-muted)] line-clamp-2 mt-1">
        {formation.why}
      </p>
    </div>
  );
}
