"use client";

import React, { useState } from "react";
import { VideoIcon, Upload } from "lucide-react";
import { uploadVideo } from "@/lib/api";

export default function VideoPage() {
  const [status, setStatus] = useState<string>("Ready for video upload");
  const [loading, setLoading] = useState(false);

  async function handleUpload() {
    setLoading(true);
    try {
      const res = await uploadVideo();
      setStatus(res.status || "Upload endpoint active");
    } catch (e: any) {
      setStatus("Error: " + (e.message || "Server unavailable"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-zinc-800/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">Video Analysis</h1>
          <p className="text-xs text-zinc-400">Upload match clips for tracking and region behavior analysis.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-950/30 text-amber-400 border border-amber-500/20">
          <VideoIcon size={12} /> Analytics
        </span>
      </div>

      <div className="rounded-lg bg-zinc-900/40 border border-zinc-800/80 p-6 space-y-4">
        <p className="text-sm text-zinc-300">This module connects to the <code>SoccerBehaviorAnalysis</code> and <code>FootballVision</code> engines via the <strong>KickAI Core</strong> pipeline.</p>
        <button
          onClick={handleUpload}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded bg-zinc-100 hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-900 font-semibold text-xs transition-colors cursor-pointer"
        >
          <Upload size={14} /> {loading ? "Uploading..." : "Test Upload Endpoint"}
        </button>
        <div className="text-xs text-zinc-400 font-mono">Status: {status}</div>
      </div>

      <div className="rounded-lg bg-zinc-900/40 border border-zinc-800/80 p-4 text-xs text-zinc-400 leading-relaxed">
        <strong>Modular integration:</strong> The <code>/api/video/upload</code> endpoint is registered in <code>backend/routers/video_analysis.py</code> (MIT components only). It is wired to the standalone pipeline and can process coordinate streams independently.
      </div>
    </div>
  );
}
