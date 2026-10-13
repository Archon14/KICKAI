"use client";

import React from "react";

interface LoadingPitchProps {
  label?: string;
}

export default function LoadingPitch({ label = "Processing state..." }: LoadingPitchProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3">
      <div className="w-5 h-5 border-2 border-zinc-700 border-t-emerald-400 rounded-full animate-spin" />
      <p className="text-xs text-zinc-400 font-mono tracking-wide">
        {label}
      </p>
    </div>
  );
}
