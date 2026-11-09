"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, GitCompare } from "lucide-react";

export default function VideoComparePage() {
  const original = useRef<HTMLVideoElement>(null);
  const annotated = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [stats, setStats] = useState<{
    frames_processed: number;
    detections_by_class: Record<string, number>;
    note: string;
  } | null>(null);

  useEffect(() => {
    fetch("/video-compare/analysis.json")
      .then(r => {
        if (!r.ok) throw new Error("Analysis unavailable");
        return r.json();
      })
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  const totalDetections = Object.values(stats?.detections_by_class ?? {})
    .reduce((sum, count) => sum + count, 0);


  async function playBoth() {
    const a = original.current;
    const b = annotated.current;
    if (!a || !b) return;

    a.currentTime = b.currentTime;
    try {
      await Promise.all([a.play(), b.play()]);
      setPlaying(true);
    } catch {
      a.pause();
      b.pause();
      setPlaying(false);
    }
  }

  function pauseBoth() {
    original.current?.pause();
    annotated.current?.pause();
    setPlaying(false);
  }

  function restartBoth() {
    pauseBoth();
    if (original.current) original.current.currentTime = 0;
    if (annotated.current) annotated.current.currentTime = 0;
  }

  function syncVideos() {
    const a = original.current;
    const b = annotated.current;
    if (a && b && Math.abs(a.currentTime - b.currentTime) > 0.25) {
      a.currentTime = b.currentTime;
    }
  }

  return (
    <main className="space-y-6 text-[var(--kick-text)]">
      <header className="border-b border-[var(--kick-border)] pb-4">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <GitCompare size={24} />
          Before vs After AI
        </h1>
        <p className="text-sm text-[var(--kick-muted)]">
          Compare original football footage with YOLO object detection.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="rounded-lg border border-[var(--kick-border)] bg-[var(--kick-card)] p-4 space-y-3">
          <h2 className="font-semibold">BEFORE — Original Footage</h2>
          <video
            ref={original}
            src="/video-compare/original.mp4"
            playsInline
            preload="metadata"
            muted
            className="w-full rounded-lg bg-black"
          />
          <p className="text-xs text-[var(--kick-muted)]">
            Raw football footage without AI annotations.
          </p>
        </section>

        <section className="rounded-lg border border-[var(--kick-border)] bg-[var(--kick-card)] p-4 space-y-3">
          <h2 className="font-semibold">AFTER — YOLO Detection</h2>
          <video
            ref={annotated}
            src="/video-compare/annotated.mp4"
            playsInline
            preload="metadata"
            muted
            onTimeUpdate={syncVideos}
            onEnded={pauseBoth}
            className="w-full rounded-lg bg-black"
          />
          <p className="text-xs text-[var(--kick-muted)]">
            AI bounding boxes, class labels, and confidence scores.
          </p>
        </section>
      </div>

      <section className="rounded-2xl border border-[var(--kick-border)] bg-[var(--kick-card)] p-5 space-y-5">
        <div>
          <h2 className="text-xl font-bold">What Does AI Actually Add?</h2>
          <p className="mt-2 text-sm text-[var(--kick-muted)]">
            Original footage requires manual inspection. KICKAI adds automated object
            detection, visual annotations, and a count of detections across processed frames.
          </p>
        </div>

        {stats ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="rounded-xl bg-[var(--kick-bg)] border border-[var(--kick-border)] p-4">
                <p className="text-xs text-[var(--kick-muted)]">Frames processed</p>
                <p className="mt-2 text-3xl font-bold text-[var(--kick-primary)]">
                  {stats.frames_processed.toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl bg-[var(--kick-bg)] border border-[var(--kick-border)] p-4">
                <p className="text-xs text-[var(--kick-muted)]">Total detections</p>
                <p className="mt-2 text-3xl font-bold text-[var(--kick-primary)]">
                  {totalDetections.toLocaleString()}
                </p>
              </div>
              <div className="rounded-xl bg-[var(--kick-bg)] border border-[var(--kick-border)] p-4 col-span-2 md:col-span-1">
                <p className="text-xs text-[var(--kick-muted)]">Object classes</p>
                <p className="mt-2 text-3xl font-bold text-[var(--kick-primary)]">
                  {Object.keys(stats.detections_by_class).length}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Detections by object class</h3>
              {Object.entries(stats.detections_by_class)
                .sort((a, b) => b[1] - a[1])
                .map(([name, count]) => (
                  <div key={name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize">{name}</span>
                      <span className="font-mono">{count.toLocaleString()}</span>
                    </div>
                    <div className="h-3 rounded-full bg-[var(--kick-bg)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--kick-primary)]"
                        style={{ width: `${totalDetections ? count / totalDetections * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>

            <p className="text-xs text-[var(--kick-muted)]">
              {stats.note || "Counts are detections across frames, not unique objects."}
              {" "}These statistics come from the saved football_00 analysis and
              should only be associated with the matching source video.
            </p>
          </>
        ) : (
          <p className="text-sm text-[var(--kick-muted)]">
            Analysis statistics are unavailable.
          </p>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-[var(--kick-border)] p-4">
            <h3 className="font-bold">Without KICKAI</h3>
            <p className="mt-2 text-sm text-[var(--kick-muted)]">
              Watch footage, identify objects manually, and record observations.
            </p>
          </div>
          <div className="rounded-xl border border-[var(--kick-primary)] p-4">
            <h3 className="font-bold">With KICKAI</h3>
            <p className="mt-2 text-sm text-[var(--kick-muted)]">
              View AI-detected objects, annotations, and detection statistics
              to support video review.
            </p>
          </div>
        </div>

        <p className="text-xs text-[var(--kick-muted)]">
          This demonstrates automated analysis capabilities, not a measured improvement
          in coaching effectiveness or review time.
        </p>
      </section>

      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={playing ? pauseBoth : playBoth}
          className="flex items-center gap-2 rounded bg-[var(--kick-primary)] px-6 py-3 font-semibold text-[#07140f]"
        >
          {playing ? <Pause size={18} /> : <Play size={18} />}
          {playing ? "Pause Both" : "Play Both"}
        </button>

        <button
          onClick={restartBoth}
          className="flex items-center gap-2 rounded border border-[var(--kick-border)] px-6 py-3 font-semibold"
        >
          <RotateCcw size={18} />
          Restart Both
        </button>
      </div>

      <p className="text-center text-xs text-[var(--kick-muted)]">
        Both videos are synchronized during playback. Confidence scores
        indicate model certainty, not guaranteed accuracy.
      </p>
    </main>
  );
}
