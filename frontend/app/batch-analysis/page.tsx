"use client";

import { useState } from "react";

type Result = {
  status: string;
  video_id: string;
  frames_processed: number;
  detections_by_class: Record<string, number>;
  annotated_video_url: string;
};

type Clip = Result & { name: string };

export default function BatchAnalysisPage() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [error, setError] = useState("");

  async function loadFiles(files: FileList | null) {
    if (!files) return;
    setError("");
    const loaded: Clip[] = [];

    for (const file of Array.from(files)) {
      try {
        const data: Result = JSON.parse(await file.text());
        if (data.status === "completed" && data.detections_by_class) {
          loaded.push({ ...data, name: file.name.replace(".json", "") });
        }
      } catch {
        setError("Some files could not be read.");
      }
    }

    setClips(loaded.sort((a, b) => a.name.localeCompare(b.name)));
  }

  const categories = ["player", "ball", "goalkeeper", "referee"];
  const total = (key: string) =>
    clips.reduce((sum, clip) => sum + (clip.detections_by_class[key] || 0), 0);

  const frames = clips.reduce((sum, clip) => sum + clip.frames_processed, 0);
  const maxPlayers = Math.max(1, ...clips.map(c => c.detections_by_class.player || 0));

  function downloadCSV() {
    const rows = [
      ["Clip", "Frames", "Players", "Ball", "Goalkeepers", "Referees"],
      ...clips.map(c => [
        c.name,
        c.frames_processed,
        ...categories.map(k => c.detections_by_class[k] || 0)
      ])
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "KICKAI_Batch_Analysis.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="space-y-6 text-[var(--kick-text)]">
      <header>
        <h1 className="text-2xl font-bold">AI Batch Intelligence</h1>
        <p className="text-sm text-[var(--kick-muted)]">
          Multi-clip football detection analytics powered by YOLO.
        </p>
      </header>

      <section className="rounded-lg border border-[var(--kick-border)] bg-[var(--kick-card)] p-5 space-y-3">
        <h2 className="font-semibold">Load Batch Results</h2>
        <p className="text-sm text-[var(--kick-muted)]">
          Select all JSON files from KICKAI/demo_results.
        </p>
        <input
          type="file"
          accept=".json"
          multiple
          onChange={e => loadFiles(e.target.files)}
          className="text-sm max-w-full"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
      </section>

      {clips.length > 0 && (
        <>
          <section className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              ["Clips Analyzed", clips.length],
              ["Frames Processed", frames],
              ["Player Detections", total("player")],
              ["Ball Detections", total("ball")],
              ["Goalkeeper Detections", total("goalkeeper")],
              ["Referee Detections", total("referee")]
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-[var(--kick-border)] bg-[var(--kick-card)] p-4">
                <p className="text-xs text-[var(--kick-muted)]">{label}</p>
                <p className="text-2xl font-bold">{Number(value).toLocaleString()}</p>
              </div>
            ))}
          </section>

          <section className="rounded-lg border border-[var(--kick-border)] bg-[var(--kick-card)] p-5 space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <h2 className="font-semibold">Player Detections by Clip</h2>
              <button
                onClick={downloadCSV}
                className="rounded bg-[var(--kick-primary)] px-4 py-2 text-sm font-semibold text-[#07140f]"
              >
                Download CSV Report
              </button>
            </div>

            <div className="space-y-3">
              {clips.map(c => (
                <div key={c.video_id} className="grid grid-cols-[95px_1fr_65px] items-center gap-3 text-xs">
                  <span>{c.name}</span>
                  <div className="h-4 rounded bg-[var(--kick-bg)] overflow-hidden">
                    <div
                      className="h-full rounded bg-[var(--kick-primary)]"
                      style={{ width: `${100 * (c.detections_by_class.player || 0) / maxPlayers}%` }}
                    />
                  </div>
                  <span className="text-right">{(c.detections_by_class.player || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-[var(--kick-border)] bg-[var(--kick-card)] p-5 space-y-3">
            <h2 className="font-semibold">Annotated Video Results</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {clips.map(c => (
                <a
                  key={c.video_id}
                  href={c.annotated_video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded border border-[var(--kick-border)] p-3 hover:border-[var(--kick-primary)]"
                >
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-xs text-[var(--kick-muted)]">
                    {c.frames_processed} frames · Watch annotated video
                  </p>
                </a>
              ))}
            </div>
          </section>

          <p className="text-xs text-[var(--kick-muted)]">
            Detection counts are summed across frames, not unique objects, player tracking,
            or possession measurements.
          </p>
        </>
      )}
    </main>
  );
}
