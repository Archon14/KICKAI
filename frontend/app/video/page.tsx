"use client";

import React, { useState } from "react";
import { VideoIcon, Upload, Loader2 } from "lucide-react";
import { uploadVideo, type VideoUploadResponse } from "@/lib/api";

const API_BASE = "";

export default function VideoPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<VideoUploadResponse | null>(null);
  const [status, setStatus] = useState("Select a football video to begin.");
  const [loading, setLoading] = useState(false);

  async function handleUpload() {
    if (!file || loading) return;
    setLoading(true);
    setResult(null);
    setStatus("Uploading and analyzing video with YOLO. This may take a few minutes.");

    try {
      const response = await uploadVideo(file);
      setResult(response);
      setStatus("AI analysis completed successfully.");
    } catch (error) {
      setStatus("Error: " + (error instanceof Error ? error.message : "Upload failed"));
    } finally {
      setLoading(false);
    }
  }

  const counts = result?.detections_by_class ?? {};
  const totalDetections = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[var(--kick-border)]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--kick-text)]">
            Video Analysis
          </h1>
          <p className="text-xs text-[var(--kick-muted)]">
            Analyze football clips with your trained YOLO detection model.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border border-[var(--kick-border)] text-[var(--kick-secondary)]">
          <VideoIcon size={14} /> Real AI Detection
        </span>
      </div>

      <div className="rounded-lg bg-[var(--kick-card)] border border-[var(--kick-border)] p-6 space-y-4">
        <h2 className="font-semibold text-[var(--kick-text)]">Upload Football Video</h2>

        <input
          type="file"
          accept=".mp4,.mov,.avi,.mkv,video/*"
          disabled={loading}
          onChange={(event) => {
            setFile(event.target.files?.[0] ?? null);
            setResult(null);
            setStatus("Ready to analyze.");
          }}
          className="block w-full text-sm text-[var(--kick-text)] file:mr-4 file:rounded file:border-0 file:px-4 file:py-2 file:font-semibold file:bg-[var(--kick-primary)] file:text-[#07140f] cursor-pointer"
        />

        <p className="text-xs text-[var(--kick-muted)]">
          Maximum upload: 100 MB. Up to 750 frames processed per video.
        </p>

        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded bg-[var(--kick-primary)] hover:brightness-110 disabled:opacity-50 text-[#07140f] font-semibold text-sm transition-colors cursor-pointer"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {loading ? "Analyzing Video..." : "Analyze with YOLO"}
        </button>

        <p role="status" className="text-xs text-[var(--kick-muted)]">{status}</p>
      </div>

      {result && (
        <>
          <div className="rounded-lg bg-[var(--kick-card)] border border-[var(--kick-border)] p-6 space-y-4">
            <h2 className="font-semibold text-[var(--kick-text)]">AI Detection Results</h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                ["Frames Processed", result.frames_processed],
                ["Total Detections", totalDetections],
                ["Players", counts.player ?? 0],
                ["Goalkeepers", counts.goalkeeper ?? 0],
                ["Referees", counts.referee ?? 0],
                ["Ball", counts.ball ?? 0],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-[var(--kick-border)] bg-[var(--kick-bg)] p-4">
                  <p className="text-xs text-[var(--kick-muted)]">{label}</p>
                  <p className="text-2xl font-bold text-[var(--kick-text)]">{value}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-[var(--kick-muted)]">
              Counts are detections across frames, not unique players or possession statistics.
            </p>
          </div>

          <div className="rounded-lg bg-[var(--kick-card)] border border-[var(--kick-border)] p-6 space-y-4">
            <h2 className="font-semibold text-[var(--kick-text)]">Annotated Football Video</h2>
            <video
              key={result.video_id}
              controls
              playsInline
              preload="metadata"
              className="w-full rounded-lg bg-black"
              src={`${API_BASE}${result.annotated_video_url}`}
            >
              Your browser does not support video playback.
            </video>
            <a
              href={`${API_BASE}${result.annotated_video_url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm underline text-[var(--kick-secondary)]"
            >
              Open annotated video in a new tab
            </a>
            <p className="text-xs text-[var(--kick-muted)]">
              If browser playback is unavailable, open the video in your system video player.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
