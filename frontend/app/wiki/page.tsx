"use client";

import React, { useEffect, useState } from "react";
import { Shield, Book, Zap, Info, Clock, Trophy, Brain, ChevronDown } from "lucide-react";

interface PlayerItem {
  rank: number; name: string; position: string; club: string; rating: number;
}

interface FormationItem {
  shape: string; name: string; category: string; description: string;
}

export default function WikiPage() {
  const [mode, setMode] = useState("offline");
  const [players, setPlayers] = useState<PlayerItem[]>([]);
  const [formations, setFormations] = useState<FormationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("All");
  const [selectedFormation, setSelectedFormation] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const p = await fetch("/api/players/top").then(r => r.ok ? r.json() : null);
        const f = await fetch("/api/formations/popular").then(r => r.ok ? r.json() : null);
        if (p?.players) setPlayers(p.players);
        if (f?.formations) setFormations(f.formations);
      } catch { /* offline / no server */ }
      setLoading(false);
    }
    load();
  }, []);

  const displayPlayers = players.length ? players.slice(0, 50) : [
    { rank: 1, name: "Erling Haaland", position: "ST", club: "Manchester City", rating: 91 },
    { rank: 2, name: "Kylian Mbappé", position: "ST", club: "Paris Saint-Germain", rating: 90 },
    { rank: 3, name: "Lionel Messi", position: "RW", club: "Inter Miami", rating: 89 },
    { rank: 4, name: "Kevin De Bruyne", position: "CM", club: "Manchester City", rating: 88 },
    { rank: 5, name: "Harry Kane", position: "ST", club: "Bayern Munich", rating: 88 },
  ];

  const displayFormations = formations.length ? formations : [
    { shape: "4-3-3", name: "4-3-3", category: "attacking", description: "Wingers high and wide, 3 midfielders behind, 3 forwards" },
    { shape: "4-2-3-1", name: "4-2-3-1", category: "balanced", description: "Double pivot in midfield, attacking trio behind a lone striker" },
    { shape: "4-4-2", name: "4-4-2", category: "defensive", description: "Classic formation, two banks of four, two strikers" },
    { shape: "3-5-2", name: "3-5-2", category: "balanced", description: "Three centre-backs, five midfielders, two forwards" },
    { shape: "4-3-1-2", name: "4-3-1-2", category: "attacking", description: "Diamond midfield, three forwards, one defensive midfielder" },
    { shape: "5-3-2", name: "5-3-2", category: "defensive", description: "Five defenders, three midfielders, two forwards — compact" },
    { shape: "4-1-4-1", name: "4-1-4-1", category: "balanced", description: "Single holding midfielder, four across midfield, one striker" },
  ];

  const positions = ["All", ...Array.from(new Set(displayPlayers.map(p => p.position)))];
  const filteredPlayers = displayPlayers.filter(p =>
    (position === "All" || p.position === position) &&
    `${p.name} ${p.club} ${p.position}`.toLowerCase().includes(search.toLowerCase())
  );
  const activeFormation = displayFormations.find(f => f.shape === selectedFormation);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-[var(--kick-border)]">
        <div className="w-9 h-9 rounded-md bg-gradient-to-br from-[var(--kick-card)] to-[var(--kick-bg)] border border-[var(--kick-border)] flex items-center justify-center">
          <Book size={20} className="text-[var(--kick-primary)]" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--kick-text)]">Wiki — Offline Knowledge</h1>
          <p className="text-xs text-[var(--kick-muted)] mt-1">Cached data + smart intelligence (no internet required once loaded)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Offline Mode */}
        <div className="rounded-xl bg-[var(--kick-card)] border border-[var(--kick-border)] p-5 shadow-lg lg:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} className="text-[var(--kick-primary)]" />
            <h2 className="text-sm font-bold text-[var(--kick-text)]">Offline Mode</h2>
            <span className="text-[10px] text-[var(--kick-primary)] bg-[var(--kick-bg)] px-1.5 py-0.5 rounded border border-[var(--kick-border)]">LIVE</span>
          </div>
          <p className="text-xs text-[var(--kick-text)] leading-relaxed mb-3">
            All data is locally cached. Predictions work without internet once data has been scraped or imported.
            The scraper populates 500-player dataset + 7 popular formations locally at
            <code className="text-[var(--kick-secondary)] mx-0.5">/data/</code>.
          </p>
          <div className="rounded bg-[var(--kick-bg)] border border-[var(--kick-border)] p-2 text-[10px] font-mono text-[var(--kick-muted)] leading-snug space-y-0.5">
            <div><strong>Data source:</strong> Scraped / Cached</div>
            <div><strong>Players:</strong> {displayPlayers.length} shown (up to 500 cached)</div>
            <div><strong>Formations:</strong> {displayFormations.length} shown</div>
            <div><strong>Last refresh:</strong> {loading ? "Fetching..." : (new Date().toISOString().slice(0,10))}</div>
            <div><strong>Source endpoint:</strong> /api/players/top + /api/formations/popular</div>
          </div>
        </div>

        {/* Data Sources */}
        <div className="rounded-xl bg-[var(--kick-card)] border border-[var(--kick-border)] p-5 shadow-lg lg:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <Info size={16} className="text-[var(--kick-muted)]" />
            <h2 className="text-sm font-bold text-[var(--kick-text)]">Data Sources & Scrapers</h2>
          </div>
          <p className="text-xs text-[var(--kick-text)] leading-relaxed mb-3">
            All player and formation data is collected via <code>analytics/scraper.py</code> using public dataset feeds.
            Fallback lists are embedded for fully offline use.
          </p>
          <ul className="text-xs text-[var(--kick-text)] space-y-1 mb-3">
            <li><strong>Top 500 Players</strong> — scraped from open dataset (cached JSON)</li>
            <li><strong>7 Formations</strong> — standard tactical layouts (4-3-3, 4-2-3-1, 3-5-2, etc.)</li>
            <li><strong>Elo Ratings</strong> — ClubElo / manual fallback (1500 default)</li>
            <li><strong>xG Estimation</strong> — derived from team strength + historical patterns</li>
            <li><strong>Match Simulation</strong> — Monte Carlo + Poisson from analytics.match_predictor</li>
          </ul>
          <div className="rounded bg-[var(--kick-bg)] border border-[var(--kick-border)] px-3 py-2 text-[10px] text-[var(--kick-secondary)]">
            <strong>Cache commands:</strong> <code>python analytics/scraper.py refresh_all</code> → stores in <code>data/</code>
          </div>
        </div>
      </div>

      {/* Full Player List */}
      <div className="rounded-xl bg-[var(--kick-card)] border border-[var(--kick-border)] p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-[var(--kick-text)] flex items-center gap-2">
            <Trophy size={16} className="text-[var(--kick-primary)]" />
            Football Player Explorer
          </h2>
          <span className="text-[10px] text-[var(--kick-muted)]">Loaded: {displayPlayers.length} rows</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search players, clubs or positions..."
            className="flex-1 rounded-lg border border-[var(--kick-border)] bg-[var(--kick-bg)] px-4 py-3 text-sm text-[var(--kick-text)] placeholder:text-[var(--kick-muted)] outline-none focus:border-[var(--kick-primary)]"
          />
          <select
            value={position}
            onChange={e => setPosition(e.target.value)}
            className="rounded-lg border border-[var(--kick-border)] bg-[var(--kick-bg)] px-4 py-3 text-sm text-[var(--kick-text)]"
          >
            {positions.map(pos => <option key={pos} value={pos}>{pos === "All" ? "All positions" : pos}</option>)}
          </select>
        </div>
        <p className="mb-3 text-xs text-[var(--kick-muted)]">{filteredPlayers.length} matching players</p>
        <div className="max-h-[520px] overflow-auto rounded-lg border border-[var(--kick-border)] bg-[var(--kick-bg)]">
          <table className="w-full text-xs">
            <thead className="bg-[var(--kick-card)] sticky top-0 z-10 text-[var(--kick-muted)] text-[10px] uppercase tracking-wider border-b border-[var(--kick-border)]">
              <tr><th className="p-2 text-left">Rank</th><th className="p-2 text-left">Name</th><th className="p-2 text-left">Position</th><th className="p-2 text-left">Club</th><th className="p-2 text-right">Rating</th></tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40">
              {filteredPlayers.map((p: PlayerItem) => (
                <tr key={p.rank} className="hover:bg-[var(--kick-card)] text-[var(--kick-text)]">
                  <td className="p-2 text-[var(--kick-muted)] font-mono">{p.rank}</td>
                  <td className="p-2 font-medium">{p.name}</td>
                  <td className="p-2">{p.position}</td>
                  <td className="p-2 text-[var(--kick-muted)]">{p.club}</td>
                  <td className="p-2 text-right font-mono text-[var(--kick-primary)]">{p.rating.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Formations */}
      <div className="rounded-xl bg-[var(--kick-card)] border border-[var(--kick-border)] p-5 shadow-lg">
        <h2 className="text-base font-bold text-[var(--kick-text)] mb-3 flex items-center gap-2">
          <Brain size={16} className="text-blue-400" />
          Popular Formations — 7 Standard Layouts
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {displayFormations.map((f: FormationItem) => (
            <button
              type="button"
              key={f.shape}
              onClick={() => setSelectedFormation(selectedFormation === f.shape ? null : f.shape)}
              className={`rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                selectedFormation === f.shape
                  ? "border-[var(--kick-primary)] bg-[var(--kick-card)] ring-1 ring-[var(--kick-primary)]"
                  : "border-[var(--kick-border)] bg-[var(--kick-bg)] hover:border-[var(--kick-primary)]"
              }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-mono font-bold text-[var(--kick-text)]">{f.shape}</span>
                <span className="text-[10px] text-[var(--kick-muted)] capitalize">{f.category}</span>
              </div>
              <p className="text-xs text-[var(--kick-muted)] leading-relaxed">{f.description}</p>
              <span className="mt-3 block text-xs font-semibold text-[var(--kick-primary)]">
                {selectedFormation === f.shape ? "Selected ✓" : "Click to explore"}
              </span>
            </button>
          ))}
        </div>
        {activeFormation && (
          <div className="mt-4 rounded-xl border border-[var(--kick-primary)] bg-[var(--kick-bg)] p-5">
            <h3 className="mb-2 text-lg font-bold text-[var(--kick-text)]">
              Formation {activeFormation.shape}
            </h3>
            <p className="mb-2 text-sm capitalize text-[var(--kick-primary)]">
              {activeFormation.category} strategy
            </p>
            <p className="text-sm leading-relaxed text-[var(--kick-text)]">
              {activeFormation.description}
            </p>
            <p className="mt-3 text-xs text-[var(--kick-muted)]">
              Compare this formation with others by selecting another card above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
