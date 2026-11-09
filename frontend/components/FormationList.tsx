"use client";

import React from "react";
import { Compass } from "lucide-react";

export default function FormationList() {
  const formations = [
    { shape: "4-3-3", name: "4-3-3", category: "attacking", desc: "Wingers high and wide, 3 midfielders behind, 3 forwards" },
    { shape: "4-2-3-1", name: "4-2-3-1", category: "balanced", desc: "Double pivot in midfield, attacking trio behind a lone striker" },
    { shape: "4-4-2", name: "4-4-2", category: "defensive", desc: "Classic formation, two banks of four, two strikers" },
    { shape: "3-5-2", name: "3-5-2", category: "balanced", desc: "Three centre-backs, five midfielders, two forwards" },
    { shape: "4-3-1-2", name: "4-3-1-2", category: "attacking", desc: "Diamond midfield, three forwards, one defensive midfielder" },
    { shape: "5-3-2", name: "5-3-2", category: "defensive", desc: "Five defenders, three midfielders, two forwards — compact" },
    { shape: "4-1-4-1", name: "4-1-4-1", category: "balanced", desc: "Single holding midfielder, four across midfield, one striker" },
  ];

  return (
    <div className="rounded-xl bg-[var(--kick-card)] border border-[var(--kick-border)] p-5 space-y-3 shadow-xl">
      <div className="flex items-center gap-2 text-[var(--kick-secondary)]">
        <Compass size={18} />
        <h3 className="text-base font-bold tracking-tight">Popular Formations</h3>
        <span className="text-[10px] bg-[var(--kick-bg)] text-[var(--kick-secondary)] px-2 py-0.5 rounded border border-[var(--kick-border)]">7</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {formations.map((f) => (
          <div key={f.shape} className="rounded-lg bg-[var(--kick-bg)] border border-[var(--kick-border)] p-3 hover:border-[var(--kick-primary)] transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-bold text-[var(--kick-text)] font-mono">{f.shape}</span>
              <span className="text-[10px] uppercase tracking-wide text-[var(--kick-muted)]">{f.category}</span>
            </div>
            <p className="text-xs text-[var(--kick-muted)] leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
