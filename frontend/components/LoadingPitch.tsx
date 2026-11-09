"use client";

import React from "react";

interface LoadingPitchProps {
  label?: string;
}

export default function LoadingPitch({ label = "Processing state..." }: LoadingPitchProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3">
      <div className="w-5 h-5 border-2 border-[var(--kick-border)] border-t-[var(--kick-primary)] rounded-full animate-spin" />
      <p className="text-xs text-[var(--kick-muted)] font-mono tracking-wide">
        {label}
      </p>
    </div>
  );
}
