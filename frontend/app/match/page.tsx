"use client";

import React, { useState } from "react";
import AdvancedMatchSimulator from "@/components/AdvancedMatchSimulator";
import AutoPredictPanel from "@/components/AutoPredictPanel";
import { Zap, Target } from "lucide-react";

export default function AutoPredictPage() {
  const [mode, setMode] = useState<"auto" | "advanced">("auto");
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-[var(--kick-border)]">
        <div className="w-9 h-9 rounded-md bg-gradient-to-br from-[var(--kick-card)] to-[var(--kick-bg)] border border-[var(--kick-primary)] flex items-center justify-center">
          <Zap size={20} className="text-[var(--kick-secondary)]" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--kick-text)]">Match Simulator</h1>
          <p className="text-xs text-[var(--kick-muted)] mt-1">Predict match outcomes automatically or explore advanced simulations.</p>
        </div>
      </div>

      <div className="flex gap-2 rounded-lg bg-[var(--kick-card)] border border-[var(--kick-border)] p-1">
        <button onClick={() => setMode("auto")} className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${mode === "auto" ? "bg-[var(--kick-primary)] text-[#07140f]" : "text-[var(--kick-muted)] hover:text-white"}`}>Auto Predict</button>
        <button onClick={() => setMode("advanced")} className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${mode === "advanced" ? "bg-[var(--kick-primary)] text-[#07140f]" : "text-[var(--kick-muted)] hover:text-white"}`}>Advanced Simulator</button>
      </div>

      {mode === "advanced" ? <AdvancedMatchSimulator /> : <div className="space-y-4">
        <AutoPredictPanel />
      </div>}
    </div>
  );
}
