"use client";
import React, { useEffect, useState } from "react";
import MockBadge from "@/components/MockBadge";

export default function DashboardPage() {
  const [backendStatus, setBackendStatus] = useState("Checking");

  useEffect(() => {
    let active = true;

    const checkBackend = async () => {
      try {
        const response = await fetch(
          "/api/health",
          { cache: "no-store" }
        );

        if (!response.ok) throw new Error("Backend unavailable");

        const data = await response.json();

        if (active) {
          setBackendStatus(data.status === "ok" ? "Online" : "Offline");
        }
      } catch {
        if (active) setBackendStatus("Offline");
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 10000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[var(--kick-border)]">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--kick-text)]">KICKAI | Football Intelligence</h1>
            <MockBadge />
          </div>
          <p className="text-xs sm:text-sm text-[var(--kick-muted)]">Physics-grounded analytics and tactical simulation</p>
        </div>
      </div>

      {/* Pages — clean uniform buttons */}
      <div className="space-y-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--kick-text)]">KICKAI Modules</h2>
          <p className="text-xs text-[var(--kick-muted)]">Explore KICKAI’s football analysis, simulation, and coaching tools.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a href="/tactical" className="group relative flex min-h-[145px] flex-col rounded-2xl border border-[var(--kick-border)] bg-[var(--kick-card)] p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:border-[var(--kick-primary)] hover:bg-[var(--kick-card)]">
            <div className="mb-5 flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--kick-bg)] text-2xl">🎯</div>
              <span className="text-xl text-[var(--kick-muted)] transition-colors group-hover:text-[var(--kick-secondary)]">↗</span>
            </div>
            <div className="text-lg font-semibold tracking-tight text-[var(--kick-text)]">Tactical Lab</div>
            <div className="mt-1 text-xs leading-relaxed text-[var(--kick-muted)]">Random scenarios</div>
            <div className="mt-auto pt-5">
              <div className="h-[3px] w-10 rounded-full bg-[var(--kick-primary)]" />
            </div>
          </a>
          <a href="/match" className="group relative flex min-h-[145px] flex-col rounded-2xl border border-[var(--kick-border)] bg-[var(--kick-card)] p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:border-[var(--kick-primary)] hover:bg-[var(--kick-card)]">
            <div className="mb-5 flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--kick-bg)] text-2xl">⚽</div>
              <span className="text-xl text-[var(--kick-muted)] transition-colors group-hover:text-[var(--kick-secondary)]">↗</span>
            </div>
            <div className="text-lg font-semibold tracking-tight text-[var(--kick-text)]">Match Sim</div>
            <div className="mt-1 text-xs leading-relaxed text-[var(--kick-muted)]">Manual / Auto toggle</div>
            <div className="mt-auto pt-5">
              <div className="h-[3px] w-10 rounded-full bg-[var(--kick-primary)]" />
            </div>
          </a>
          <a href="/training" className="group relative flex min-h-[145px] flex-col rounded-2xl border border-[var(--kick-border)] bg-[var(--kick-card)] p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:border-[var(--kick-primary)] hover:bg-[var(--kick-card)]">
            <div className="mb-5 flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--kick-bg)] text-2xl">🔥</div>
              <span className="text-xl text-[var(--kick-muted)] transition-colors group-hover:text-[var(--kick-secondary)]">↗</span>
            </div>
            <div className="text-lg font-semibold tracking-tight text-[var(--kick-text)]">Training Lab</div>
            <div className="mt-1 text-xs leading-relaxed text-[var(--kick-muted)]">Drills & progress</div>
            <div className="mt-auto pt-5">
              <div className="h-[3px] w-10 rounded-full bg-[var(--kick-primary)]" />
            </div>
          </a>
          <a href="/player" className="group relative flex min-h-[145px] flex-col rounded-2xl border border-[var(--kick-border)] bg-[var(--kick-card)] p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:border-[var(--kick-primary)] hover:bg-[var(--kick-card)]">
            <div className="mb-5 flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--kick-bg)] text-2xl">🏅</div>
              <span className="text-xl text-[var(--kick-muted)] transition-colors group-hover:text-[var(--kick-secondary)]">↗</span>
            </div>
            <div className="text-lg font-semibold tracking-tight text-[var(--kick-text)]">Player Eval</div>
            <div className="mt-1 text-xs leading-relaxed text-[var(--kick-muted)]">Ratings + Wiki</div>
            <div className="mt-auto pt-5">
              <div className="h-[3px] w-10 rounded-full bg-[var(--kick-primary)]" />
            </div>
          </a>
          <a href="/video" className="group relative flex min-h-[145px] flex-col rounded-2xl border border-[var(--kick-border)] bg-[var(--kick-card)] p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:border-[var(--kick-primary)] hover:bg-[var(--kick-card)]">
            <div className="mb-5 flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--kick-bg)] text-2xl">📹</div>
              <span className="text-xl text-[var(--kick-muted)] transition-colors group-hover:text-[var(--kick-secondary)]">↗</span>
            </div>
            <div className="text-lg font-semibold tracking-tight text-[var(--kick-text)]">Video Analysis</div>
            <div className="mt-1 text-xs leading-relaxed text-[var(--kick-muted)]">Click to label players</div>
            <div className="mt-auto pt-5">
              <div className="h-[3px] w-10 rounded-full bg-[var(--kick-primary)]" />
            </div>
          </a>
          <a href="/sessions" className="group relative flex min-h-[145px] flex-col rounded-2xl border border-[var(--kick-border)] bg-[var(--kick-card)] p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:border-[var(--kick-primary)] hover:bg-[var(--kick-card)]">
            <div className="mb-5 flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--kick-bg)] text-2xl">📋</div>
              <span className="text-xl text-[var(--kick-muted)] transition-colors group-hover:text-[var(--kick-secondary)]">↗</span>
            </div>
            <div className="text-lg font-semibold tracking-tight text-[var(--kick-text)]">Session Logs</div>
            <div className="mt-1 text-xs leading-relaxed text-[var(--kick-muted)]">Coach audit trail</div>
            <div className="mt-auto pt-5">
              <div className="h-[3px] w-10 rounded-full bg-[var(--kick-primary)]" />
            </div>
          </a>
          <a href="/batch-analysis" className="group relative flex min-h-[145px] flex-col rounded-2xl border border-[var(--kick-border)] bg-[var(--kick-card)] p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:border-[var(--kick-primary)] hover:bg-[var(--kick-card)]">
            <div className="mb-5 flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--kick-bg)] text-2xl">📊</div>
              <span className="text-xl text-[var(--kick-muted)] transition-colors group-hover:text-[var(--kick-secondary)]">↗</span>
            </div>
            <div className="text-lg font-semibold tracking-tight text-[var(--kick-text)]">AI Batch Intelligence</div>
            <div className="mt-1 text-xs leading-relaxed text-[var(--kick-muted)]">Compare YOLO results across football clips</div>
            <div className="mt-auto pt-5">
              <div className="h-[3px] w-10 rounded-full bg-[var(--kick-primary)]" />
            </div>
          </a>
          <a href="/video-compare" className="group relative flex min-h-[145px] flex-col rounded-2xl border border-[var(--kick-border)] bg-[var(--kick-card)] p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:border-[var(--kick-primary)] hover:bg-[var(--kick-card)]">
            <div className="mb-5 flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--kick-bg)] text-2xl">🎬</div>
              <span className="text-xl text-[var(--kick-muted)] transition-colors group-hover:text-[var(--kick-secondary)]">↗</span>
            </div>
            <div className="text-lg font-semibold tracking-tight text-[var(--kick-text)]">Before vs After AI</div>
            <div className="mt-1 text-xs leading-relaxed text-[var(--kick-muted)]">Compare original footage with AI detections</div>
            <div className="mt-auto pt-5">
              <div className="h-[3px] w-10 rounded-full bg-[var(--kick-primary)]" />
            </div>
          </a>
          <a href="/wiki" className="group relative flex min-h-[145px] flex-col rounded-2xl border border-[var(--kick-border)] bg-[var(--kick-card)] p-5 text-left transition-all duration-200 hover:-translate-y-1 hover:border-[var(--kick-primary)] hover:bg-[var(--kick-card)]">
            <div className="mb-5 flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--kick-bg)] text-2xl">📚</div>
              <span className="text-xl text-[var(--kick-muted)] transition-colors group-hover:text-[var(--kick-secondary)]">↗</span>
            </div>
            <div className="text-lg font-semibold tracking-tight text-[var(--kick-text)]">Wiki</div>
            <div className="mt-1 text-xs leading-relaxed text-[var(--kick-muted)]">Offline data</div>
            <div className="mt-auto pt-5">
              <div className="h-[3px] w-10 rounded-full bg-[var(--kick-primary)]" />
            </div>
          </a>

        </div>
      </div>

      {/* System status */}
      <div className="grid grid-cols-1 gap-6">
        <div className="rounded-lg bg-[var(--kick-card)] border border-[var(--kick-border)] p-4 shadow-lg">
          <h3 className="text-sm font-semibold text-[var(--kick-text)] mb-2">Quick Status</h3>
          <div className="flex items-center justify-between rounded-lg bg-[var(--kick-bg)] border border-[var(--kick-border)] p-3 mb-3">
            <span className="text-xs text-[var(--kick-text)]">Backend API</span>
            <span className={`text-xs font-bold ${
              backendStatus === "Online"
                ? "text-[var(--kick-primary)]"
                : backendStatus === "Offline"
                ? "text-rose-400"
                : "text-[var(--kick-secondary)]"
            }`}>
              ● {backendStatus}
            </span>
          </div>
          <div className="text-xs text-[var(--kick-text)] leading-relaxed space-y-1.5">
            <p><strong>Physics Tracking</strong> — Player velocity, ball drag.</p>
            <p><strong>Coach Loop</strong> — AI suggests; coach decides.</p>
            <p><strong>Football Only</strong> — 11v11 analytics.</p>
            <p><strong>Scheme</strong> — Progressive 4-3-3 (half-space overload).</p>
          </div>
        </div>
      </div>
    </div>
  );
}
