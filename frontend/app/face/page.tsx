"use client";

import React, { useState, useEffect } from "react";
import AIFaceAcoustic from "@/components/AIFaceAcoustic";
import { getHealth } from "@/lib/api";
import { Activity, CheckCircle, AlertCircle } from "lucide-react";

export default function FacePage() {
  const [health, setHealth] = useState<"ok" | "error" | "loading">("loading");

  useEffect(() => {
    getHealth()
      .then(() => setHealth("ok"))
      .catch(() => setHealth("error"));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">AI Face & Acoustic Feedback</h1>
          <p className="text-xs text-zinc-400 mt-1">Holographic coach with expression + spoken feedback</p>
        </div>
        <div className="flex items-center gap-2">
          {health === "ok" ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950/30 text-emerald-400 border border-emerald-500/20">
              <CheckCircle size={11} /> Backend Online
            </span>
          ) : health === "loading" ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-zinc-800/40 text-zinc-400 border border-zinc-700">
              <Activity size={11} /> Checking...
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-950/30 text-rose-400 border border-rose-500/20">
              <AlertCircle size={11} /> Backend Offline
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-950/30 text-amber-400 border border-amber-500/20">
            Live Engine
          </span>
        </div>
      </div>

      <AIFaceAcoustic />

      <div className="rounded-lg bg-zinc-900/40 border border-zinc-800/80 p-4 text-xs text-zinc-400 leading-relaxed space-y-2">
        <h3 className="text-sm font-semibold text-zinc-200">About the AI Face</h3>
        <p>This module combines <strong>core/ai_face.py</strong> (holographic coach expressions) with <strong>core/voice_coach.py</strong> (expression selection and acoustic text cleanup). It produces structured telemetry: expression, spoken feedback text, HTML embed preview, and provenance metadata. All assets are MIT-licensed.</p>
      </div>
    </div>
  );
}