"use client";

import React from "react";

export default function FormationEditor() {
  return (
    <div className="rounded-lg bg-[var(--kick-card)] border border-[var(--kick-border)] p-6 text-xs text-[var(--kick-muted)]">
      <h3 className="text-sm font-semibold text-[var(--kick-text)] mb-3">Formation Editor</h3>
      <p>Future feature: drag-and-drop tactical formation editor with real-time score feedback.</p>
      <button disabled className="mt-3 px-3 py-1.5 rounded bg-[var(--kick-bg)] text-[var(--kick-muted)] border border-[var(--kick-border)] text-xs cursor-not-allowed">Coming Soon</button>
    </div>
  );
}
