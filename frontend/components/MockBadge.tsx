"use client";

import React, { useEffect, useState } from "react";
import { getHealth } from "@/lib/api";

export default function MockBadge() {
  const [isMock, setIsMock] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function checkHealth() {
      try {
        const res = await getHealth();
        if (mounted) {
          setIsMock(res.mock_mode ?? true);
        }
      } catch {
        if (mounted) {
          setIsMock(true);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 20000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (loading && isMock === null) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--kick-card)] text-[var(--kick-muted)] border border-[var(--kick-border)]">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--kick-muted)] animate-pulse" />
        <span>Connecting</span>
      </div>
    );
  }

  if (isMock) {
    return (
      <div
        title="Running deterministic local mock mode"
        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--kick-bg)] text-[var(--kick-primary)] border border-[var(--kick-border)]"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span className="tracking-wide">Mock Engine</span>
      </div>
    );
  }

  return (
    <div
      title="Connected to live physics backend"
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-sky-950/30 text-sky-400 border border-sky-500/20"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
      <span className="tracking-wide">Live Feed</span>
    </div>
  );
}
