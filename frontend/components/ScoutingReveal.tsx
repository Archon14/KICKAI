"use client";

import { useState } from "react";
import { ArrowLeftRight, Radar, Sparkles } from "lucide-react";

type Player = {
  name: string;
  role: string;
  ratings: number[];
};

const attributes = ["Pace", "Shooting", "Passing", "Dribbling", "Defending", "Physical"];

const players: Player[] = [
  { name: "Explosive Winger", role: "Wide attacker", ratings: [94, 76, 74, 91, 35, 62] },
  { name: "Complete Striker", role: "Centre forward", ratings: [83, 94, 71, 84, 32, 88] },
  { name: "Creative Playmaker", role: "Attacking midfielder", ratings: [75, 78, 96, 92, 48, 61] },
  { name: "Defensive Anchor", role: "Defensive midfielder", ratings: [64, 48, 84, 70, 94, 91] },
  { name: "Modern Centre-Back", role: "Central defender", ratings: [76, 35, 79, 58, 95, 93] },
];

function polygon(values: number[], scale = 1) {
  return values.map((value, index) => {
    const angle = (Math.PI * 2 * index) / values.length - Math.PI / 2;
    const radius = (value / 100) * 145 * scale;
    return `${200 + Math.cos(angle) * radius},${200 + Math.sin(angle) * radius}`;
  }).join(" ");
}

export default function ScoutingReveal() {
  const [first, setFirst] = useState(0);
  const [second, setSecond] = useState(1);
  const [revealed, setRevealed] = useState(true);

  const a = players[first];
  const b = players[second];

  function updatePlayer(side: "a" | "b", index: number) {
    if (side === "a") setFirst(index);
    else setSecond(index);
    setRevealed(false);
    requestAnimationFrame(() => requestAnimationFrame(() => setRevealed(true)));
  }

  const winner = a.ratings.reduce((sum, n) => sum + n, 0) >=
    b.ratings.reduce((sum, n) => sum + n, 0) ? a.name : b.name;

  return (
    <section className="relative overflow-hidden rounded-3xl bg-[#090c1b] px-5 py-24 text-white sm:px-10">
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[550px] w-[550px] -translate-x-1/2 rounded-full bg-violet-500/10 blur-[120px]" />

      <div className="relative mx-auto max-w-6xl">
        <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[.3em] text-violet-300">
          <Sparkles size={16} /> Player intelligence / Scouting Reveal
        </div>

        <h2 className="mt-6 max-w-5xl text-4xl font-black leading-tight sm:text-7xl">
          Every player has a profile.
          <span className="block text-violet-400">Make it visible.</span>
        </h2>

        <p className="mt-6 max-w-3xl text-lg text-white/60">
          Compare football roles through six scouting attributes.
          Switch profiles to reveal different strengths and playing styles.
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {[
            { player: a, value: first, side: "a" as const, color: "text-sky-400" },
            { player: b, value: second, side: "b" as const, color: "text-violet-400" },
          ].map(item => (
            <div key={item.side} className="rounded-2xl border border-white/15 bg-white/[.035] p-6">
              <p className={`text-xs font-bold uppercase tracking-[.3em] ${item.color}`}>
                Player {item.side === "a" ? "A" : "B"}
              </p>

              <select
                value={item.value}
                onChange={e => updatePlayer(item.side, Number(e.target.value))}
                className="mt-4 w-full rounded-xl border border-white/20 bg-[#171b30] px-4 py-3 text-white"
              >
                {players.map((player, index) => (
                  <option key={player.name} value={index}>{player.name}</option>
                ))}
              </select>

              <h3 className="mt-7 text-3xl font-black">{item.player.name}</h3>
              <p className="mt-2 text-sm text-white/50">{item.player.role}</p>

              <div className="mt-8 space-y-4">
                {attributes.map((attribute, index) => (
                  <div key={attribute}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-white/65">{attribute}</span>
                      <span className="font-bold">{item.player.ratings[index]}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          item.side === "a" ? "bg-sky-400" : "bg-violet-400"
                        }`}
                        style={{ width: revealed ? `${item.player.ratings[index]}%` : "0%" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-3xl border border-white/15 bg-[#101528] p-5 sm:p-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="flex items-center gap-3 text-2xl font-black">
              <Radar className="text-violet-400" /> Scouting Radar
            </h3>
            <button
              onClick={() => {
                setFirst(second);
                setSecond(first);
              }}
              className="flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-semibold hover:border-violet-400"
            >
              <ArrowLeftRight size={16} /> Swap players
            </button>
          </div>

          <svg viewBox="0 0 400 400" className="mx-auto mt-5 w-full max-w-[470px]"
            role="img" aria-label="Six-axis comparison radar chart">
            {[.25, .5, .75, 1].map(scale => (
              <polygon key={scale} points={polygon([100,100,100,100,100,100], scale)}
                fill="none" stroke="white" strokeOpacity=".16" strokeWidth="1.5" />
            ))}
            {attributes.map((attribute, index) => {
              const angle = Math.PI * 2 * index / 6 - Math.PI / 2;
              const x = 200 + Math.cos(angle) * 145;
              const y = 200 + Math.sin(angle) * 145;
              return (
                <g key={attribute}>
                  <line x1="200" y1="200" x2={x} y2={y} stroke="white" strokeOpacity=".2" />
                  <text x={200 + Math.cos(angle) * 182}
                    y={200 + Math.sin(angle) * 182 + 5}
                    textAnchor="middle" fontSize="12" fill="white">
                    {attribute}
                  </text>
                </g>
              );
            })}
            <polygon points={polygon(a.ratings)} fill="#38bdf8" fillOpacity=".22"
              stroke="#38bdf8" strokeWidth="3" />
            <polygon points={polygon(b.ratings)} fill="#a78bfa" fillOpacity=".22"
              stroke="#a78bfa" strokeWidth="3" />
          </svg>

          <div className="mt-4 flex flex-wrap justify-center gap-7 text-sm">
            <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-sky-400"/>{a.name}</span>
            <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-violet-400"/>{b.name}</span>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-violet-400/25 bg-violet-400/5 p-7">
          <p className="text-xs font-bold uppercase tracking-[.25em] text-violet-300">
            Profile comparison
          </p>
          <p className="mt-3 text-2xl font-bold">
            Higher combined illustrative rating: {winner}
          </p>
          <p className="mt-3 text-sm text-white/55">
            Higher totals do not establish which player is better for a specific team or role.
          </p>
        </div>

        <p className="mt-7 text-center text-xs text-white/40">
          Demonstration profiles with illustrative ratings. Not real player measurements or validated AI predictions.
        </p>
      </div>
    </section>
  );
}
