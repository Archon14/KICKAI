"use client";

import { useRef, useState } from "react";

type Player = { id: number; x: number; y: number };
type Formation = "4-4-2" | "4-3-3" | "3-5-2";

const shapes: Record<Formation, Player[]> = {
  "4-4-2": [
    { id: 1, x: 12, y: 50 },
    { id: 2, x: 29, y: 15 }, { id: 3, x: 29, y: 38 },
    { id: 4, x: 29, y: 62 }, { id: 5, x: 29, y: 85 },
    { id: 6, x: 51, y: 15 }, { id: 7, x: 51, y: 38 },
    { id: 8, x: 51, y: 62 }, { id: 9, x: 51, y: 85 },
    { id: 10, x: 72, y: 35 }, { id: 11, x: 72, y: 65 },
  ],
  "4-3-3": [
    { id: 1, x: 12, y: 50 },
    { id: 2, x: 29, y: 15 }, { id: 3, x: 29, y: 38 },
    { id: 4, x: 29, y: 62 }, { id: 5, x: 29, y: 85 },
    { id: 6, x: 51, y: 25 }, { id: 7, x: 51, y: 50 },
    { id: 8, x: 51, y: 75 },
    { id: 9, x: 75, y: 20 }, { id: 10, x: 75, y: 50 },
    { id: 11, x: 75, y: 80 },
  ],
  "3-5-2": [
    { id: 1, x: 12, y: 50 },
    { id: 2, x: 29, y: 25 }, { id: 3, x: 29, y: 50 },
    { id: 4, x: 29, y: 75 },
    { id: 5, x: 51, y: 10 }, { id: 6, x: 51, y: 30 },
    { id: 7, x: 51, y: 50 }, { id: 8, x: 51, y: 70 },
    { id: 9, x: 51, y: 90 },
    { id: 10, x: 75, y: 35 }, { id: 11, x: 75, y: 65 },
  ],
};

export default function TacticalBattle() {
  const [formation, setFormation] = useState<Formation>("4-4-2");
  const [players, setPlayers] = useState<Player[]>(shapes["4-4-2"]);
  const [striker, setStriker] = useState({ x: 85, y: 50 });
  const [selected, setSelected] = useState<number | "striker" | null>(null);
  const pitch = useRef<SVGSVGElement>(null);

  function move(event: React.PointerEvent<SVGSVGElement>) {
    if (selected === null || !pitch.current) return;
    const point = pitch.current.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const transform = pitch.current.getScreenCTM();
    if (!transform) return;
    const local = point.matrixTransform(transform.inverse());
    const x = Math.max(5, Math.min(95, local.x / 9));
    const y = Math.max(5, Math.min(95, local.y / 5));

    if (selected === "striker") setStriker({ x, y });
    else setPlayers(old => old.map(p => p.id === selected ? { ...p, x, y } : p));
  }

  function changeFormation(next: Formation) {
    setFormation(next);
    setPlayers(shapes[next].map(p => ({ ...p })));
  }

  return (
    <section className="relative overflow-hidden rounded-3xl bg-[#061511] px-5 py-20 text-white sm:px-10">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-[.35em] text-emerald-400">
          Interactive experience / Tactical Battle
        </p>
        <h2 className="mt-5 text-4xl font-black sm:text-6xl">
          Don't just watch tactics.
          <span className="block text-emerald-400">Control them.</span>
        </h2>
        <p className="mt-5 max-w-3xl text-white/60">
          Drag any blue player or the red striker. Change formations to explore
          how a team might organize its defensive shape.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          {(["4-4-2", "4-3-3", "3-5-2"] as Formation[]).map(shape => (
            <button key={shape} onClick={() => changeFormation(shape)}
              className={`rounded-full px-6 py-3 text-sm font-bold ${
                formation === shape
                  ? "bg-emerald-400 text-black"
                  : "border border-white/20 bg-white/5"
              }`}>
              {shape}
            </button>
          ))}
          <button onClick={() => {
            setPlayers(shapes[formation].map(p => ({ ...p })));
            setStriker({ x: 85, y: 50 });
          }} className="rounded-full border border-white/20 px-6 py-3 text-sm">
            Reset positions
          </button>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-white/20 bg-[#12633e] shadow-[0_25px_90px_rgba(0,0,0,.5)]">
          <svg ref={pitch} viewBox="0 0 900 500"
            className="w-full touch-none select-none"
            onPointerMove={move}
            onPointerUp={() => setSelected(null)}
            onPointerCancel={() => setSelected(null)}
            onLostPointerCapture={() => setSelected(null)}
            role="img" aria-label="Interactive football tactical board">
            <rect x="18" y="18" width="864" height="464" fill="none" stroke="white" strokeOpacity=".7" strokeWidth="2"/>
            <line x1="450" y1="18" x2="450" y2="482" stroke="white" strokeOpacity=".7" strokeWidth="2"/>
            <circle cx="450" cy="250" r="72" fill="none" stroke="white" strokeOpacity=".7" strokeWidth="2"/>
            <rect x="18" y="130" width="150" height="240" fill="none" stroke="white" strokeOpacity=".7" strokeWidth="2"/>
            <rect x="732" y="130" width="150" height="240" fill="none" stroke="white" strokeOpacity=".7" strokeWidth="2"/>
            {players.map(p => (
              <g key={p.id} transform={`translate(${p.x * 9},${p.y * 5})`}
                onPointerDown={event => {
                  event.stopPropagation();
                  event.currentTarget.ownerSVGElement?.setPointerCapture(event.pointerId);
                  setSelected(p.id);
                }} className="cursor-grab">
                <circle r="24" fill="#38bdf8" stroke="white" strokeWidth="3"/>
                <text textAnchor="middle" y="6" fontSize="17" fontWeight="bold" fill="#061511">{p.id}</text>
              </g>
            ))}
            <g transform={`translate(${striker.x * 9},${striker.y * 5})`}
              onPointerDown={event => {
                event.stopPropagation();
                event.currentTarget.ownerSVGElement?.setPointerCapture(event.pointerId);
                setSelected("striker");
              }} className="cursor-grab">
              <circle r="36" fill="#f43f5e" fillOpacity=".2" stroke="#fda4af" strokeDasharray="6 5"/>
              <circle r="24" fill="#f43f5e" stroke="white" strokeWidth="3"/>
              <text textAnchor="middle" y="6" fontSize="16" fontWeight="bold" fill="white">ST</text>
            </g>
          </svg>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-white/65">
          <span>🔵 Your team · 🔴 Opposing striker</span>
          <span>Formation: {formation} · Drag to reposition</span>
        </div>
        <p className="mt-3 text-xs text-white/40">
          Interactive coaching illustration. Positions are manually controlled, not AI-generated predictions.
        </p>
      </div>
    </section>
  );
}
