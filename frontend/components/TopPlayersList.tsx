"use client";

import React, { useState } from "react";
import { Users, RefreshCw } from "lucide-react";

interface Player {
  rank: number;
  name: string;
  position: string;
  club: string;
  rating: number;
}

export default function TopPlayersList() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<string>("cached");

  async function loadPlayers() {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/players/top");
      const data = await res.json();
      if (data.players) setPlayers(data.players);
      setSource(data.source || "cached");
    } catch {
      // fallback
    } finally { setLoading(false); }
  }

  React.useEffect(() => { loadPlayers(); }, []);

  return (
    <div className="rounded-xl bg-[var(--kick-card)] border border-[var(--kick-border)] p-5 space-y-3 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[var(--kick-secondary)]">
          <Users size={18} />
          <h3 className="text-base font-bold tracking-tight">Top 500 Players</h3>
        </div>
        <div className="flex items-center gap-2">
          {loading && <span className="text-[10px] text-[var(--kick-muted)]">Loading…</span>}
          <button onClick={loadPlayers} className="p-1.5 rounded bg-[var(--kick-card)] hover:brightness-110 border border-[var(--kick-primary)] text-[var(--kick-muted)]">
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      <div className="text-[10px] text-[var(--kick-muted)]">Source: {source} (scraped)</div>

      <div className="max-h-80 overflow-y-auto rounded-lg border border-[var(--kick-border)]">
        <table className="w-full text-xs">
          <thead className="bg-[var(--kick-bg)] sticky top-0">
            <tr className="text-[var(--kick-muted)] text-[10px] uppercase tracking-wider">
              <th className="p-2 text-left">#</th>
              <th className="p-2 text-left">Player</th>
              <th className="p-2 text-left">Pos</th>
              <th className="p-2 text-left">Club</th>
              <th className="p-2 text-right">Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {players.map((p) => (
              <tr key={p.rank} className="hover:bg-[var(--kick-card)]">
                <td className="p-2 text-[var(--kick-muted)]">{p.rank}</td>
                <td className="p-2 text-[var(--kick-text)] font-medium">{p.name}</td>
                <td className="p-2 text-[var(--kick-muted)]">{p.position}</td>
                <td className="p-2 text-[var(--kick-muted)]">{p.club}</td>
                <td className="p-2 text-right font-mono text-[var(--kick-primary)]">{p.rating.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
