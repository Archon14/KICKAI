"use client";

import React, { useState } from "react";
import type { PitchPlayer, PassingVector } from "@/lib/types";

interface PitchCanvasProps {
  players?: PitchPlayer[];
  vectors?: PassingVector[];
  ballPosition?: { x: number; y: number };
  highlightPlayerId?: string | null;
  onPlayerClick?: (player: PitchPlayer) => void;
  title?: string;
}

const DEFAULT_PLAYERS: PitchPlayer[] = [
  // Home Team (Emerald)
  { id: "H1", name: "D. Raya", team: "home", number: 1, x: 8, y: 34, energy: 0.95, fatigue: 0.08, current_action: "Goalkeeper" },
  { id: "H2", name: "B. White", team: "home", number: 4, x: 32, y: 12, energy: 0.88, fatigue: 0.22, current_action: "Covering flank" },
  { id: "H3", name: "W. Saliba", team: "home", number: 2, x: 26, y: 26, energy: 0.91, fatigue: 0.18, current_action: "Sweeping channel" },
  { id: "H4", name: "Gabriel", team: "home", number: 6, x: 27, y: 42, energy: 0.89, fatigue: 0.20, current_action: "Ball progression" },
  { id: "H5", name: "J. Timber", team: "home", number: 12, x: 34, y: 56, energy: 0.86, fatigue: 0.25, current_action: "Inverted overlap" },
  { id: "H6", name: "T. Partey", team: "home", number: 5, x: 48, y: 34, energy: 0.84, fatigue: 0.28, current_action: "Pivot anchor" },
  { id: "H7", name: "B. Saka", team: "home", number: 7, x: 82, y: 14, energy: 0.90, fatigue: 0.24, current_action: "Half-space runner" },
  { id: "H8", name: "D. Rice", team: "home", number: 41, x: 62, y: 44, energy: 0.87, fatigue: 0.30, current_action: "Box-to-box run" },
  { id: "H9", name: "K. Havertz", team: "home", number: 29, x: 88, y: 35, energy: 0.85, fatigue: 0.32, current_action: "Target press" },
  { id: "H10", name: "M. Ødegaard", team: "home", number: 8, x: 73, y: 32, energy: 0.92, fatigue: 0.21, current_action: "Ball carrier / playmaker" },
  { id: "H11", name: "G. Martinelli", team: "home", number: 11, x: 80, y: 55, energy: 0.89, fatigue: 0.26, current_action: "Wide winger isolations" },

  // Away Team (Sky)
  { id: "A1", name: "Alisson", team: "away", number: 1, x: 98, y: 34, energy: 0.96, fatigue: 0.09, current_action: "Commanding 6yd box" },
  { id: "A2", name: "T. Alexander-Arnold", team: "away", number: 66, x: 83, y: 16, energy: 0.82, fatigue: 0.34, current_action: "Jockeying carrier" },
  { id: "A3", name: "I. Konaté", team: "away", number: 5, x: 89, y: 27, energy: 0.88, fatigue: 0.27, current_action: "Blocking shot lane" },
  { id: "A4", name: "V. van Dijk", team: "away", number: 4, x: 90, y: 41, energy: 0.90, fatigue: 0.23, current_action: "Guarding near post" },
  { id: "A5", name: "A. Robertson", team: "away", number: 26, x: 81, y: 52, energy: 0.84, fatigue: 0.31, current_action: "Closing winger" },
  { id: "A6", name: "R. Gravenberch", team: "away", number: 38, x: 74, y: 26, energy: 0.86, fatigue: 0.29, current_action: "Midfield screen" },
  { id: "A7", name: "A. Mac Allister", team: "away", number: 10, x: 71, y: 42, energy: 0.85, fatigue: 0.30, current_action: "Double pivot cover" },
  { id: "A8", name: "D. Szoboszlai", team: "away", number: 8, x: 64, y: 33, energy: 0.80, fatigue: 0.36, current_action: "Pressing trigger" },
  { id: "A9", name: "M. Salah", team: "away", number: 11, x: 58, y: 15, energy: 0.83, fatigue: 0.28, current_action: "Counter outlet" },
  { id: "A10", name: "L. Díaz", team: "away", number: 7, x: 57, y: 53, energy: 0.85, fatigue: 0.27, current_action: "Transition runner" },
  { id: "A11", name: "D. Núñez", team: "away", number: 9, x: 50, y: 34, energy: 0.79, fatigue: 0.38, current_action: "Centre forward anchor" },
];

const DEFAULT_VECTORS: PassingVector[] = [
  {
    fromId: "H10",
    toId: "H7",
    fromX: 73,
    fromY: 32,
    toX: 82,
    toY: 14,
    ev: 0.3315,
    probability: 0.652,
    label: "Diagonal Pass",
  },
  {
    fromId: "H10",
    toId: "H9",
    fromX: 73,
    fromY: 32,
    toX: 88,
    toY: 35,
    ev: 0.3842,
    probability: 0.384,
    label: "Direct Strike Channel",
  },
  {
    fromId: "H10",
    toId: "H8",
    fromX: 73,
    fromY: 32,
    toX: 62,
    toY: 44,
    ev: 0.241,
    probability: 0.82,
    label: "Recycle Retention",
  },
];

export default function PitchCanvas({
  players = DEFAULT_PLAYERS,
  vectors = DEFAULT_VECTORS,
  ballPosition = { x: 74, y: 32.5 },
  highlightPlayerId,
  onPlayerClick,
  title,
}: PitchCanvasProps) {
  const [hoveredPlayer, setHoveredPlayer] = useState<PitchPlayer | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const PITCH_W = 1050;
  const PITCH_H = 680;
  const scaleX = (m: number) => (m / 105) * PITCH_W;
  const scaleY = (m: number) => (m / 68) * PITCH_H;

  return (
    <div className="relative w-full rounded-lg overflow-hidden bg-[var(--kick-bg)] border border-[var(--kick-border)] flex flex-col">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[var(--kick-card)] border-b border-[var(--kick-border)] text-xs">
        <div className="flex items-center gap-2">
          <span className="font-medium text-[var(--kick-text)]">
            {title || "Tactical Positioning & Vectors"}
          </span>
          <span className="text-[var(--kick-muted)] font-mono text-[11px] hidden sm:inline">
            105m × 68m
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-[var(--kick-muted)]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[var(--kick-text)]">Home</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span className="text-[var(--kick-text)]">Away</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            <span>Ball</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full aspect-[105/68] max-h-[520px]">
        <svg
          viewBox={`0 0 ${PITCH_W} ${PITCH_H}`}
          className="w-full h-full select-none"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <marker
              id="arrow-emerald"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
            </marker>
          </defs>

          {/* Clean matte turf bands */}
          {Array.from({ length: 10 }).map((_, i) => (
            <rect
              key={`stripe-${i}`}
              x={i * 105}
              y={0}
              width={105}
              height={PITCH_H}
              fill={i % 2 === 0 ? "#101513" : "#0d1210"}
            />
          ))}

          {/* Crisp, fine pitch lines */}
          <g stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1.6" fill="none">
            {/* Outer boundary */}
            <rect x="25" y="25" width="1000" height="630" />
            {/* Halfway line */}
            <line x1="525" y1="25" x2="525" y2="655" />
            {/* Center circle */}
            <circle cx="525" cy="340" r="91.5" />
            <circle cx="525" cy="340" r="3" fill="rgba(255,255,255,0.4)" />

            {/* Left penalty & 6-yard box */}
            <rect x="25" y="138.5" width="165" height="403" />
            <rect x="25" y="248.5" width="55" height="183" />
            <circle cx="135" cy="340" r="2.5" fill="rgba(255,255,255,0.4)" />
            <path d="M 190 275 A 91.5 91.5 0 0 1 190 405" />

            {/* Right penalty & 6-yard box */}
            <rect x="860" y="138.5" width="165" height="403" />
            <rect x="970" y="248.5" width="55" height="183" />
            <circle cx="915" cy="340" r="2.5" fill="rgba(255,255,255,0.4)" />
            <path d="M 860 275 A 91.5 91.5 0 0 0 860 405" />

            {/* Goals */}
            <rect x="12" y="303.4" width="13" height="73.2" stroke="rgba(255,255,255,0.3)" />
            <rect x="1025" y="303.4" width="13" height="73.2" stroke="rgba(255,255,255,0.3)" />

            {/* Corners */}
            <path d="M 25 35 A 10 10 0 0 0 35 25" />
            <path d="M 1015 25 A 10 10 0 0 0 1025 35" />
            <path d="M 25 645 A 10 10 0 0 1 35 655" />
            <path d="M 1015 655 A 10 10 0 0 1 1025 645" />
          </g>

          {/* Passing Vectors */}
          {vectors.map((vec, idx) => {
            const startX = scaleX(vec.fromX);
            const startY = scaleY(vec.fromY);
            const endX = scaleX(vec.toX);
            const endY = scaleY(vec.toY);
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2 - 8;

            return (
              <g key={`vector-${idx}`}>
                <line
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke="#10b981"
                  strokeWidth="1.8"
                  className="animate-pass-vector opacity-90"
                  markerEnd="url(#arrow-emerald)"
                />
                {vec.ev !== undefined && (
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect
                      x="-30"
                      y="-10"
                      width="60"
                      height="16"
                      rx="3"
                      fill="#121215"
                      stroke="#27272a"
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="1.5"
                      textAnchor="middle"
                      fill="#34d399"
                      fontSize="9"
                      fontWeight="600"
                      fontFamily="monospace"
                    >
                      +{(vec.ev * 100).toFixed(0)}% EV
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Players */}
          {players.map((p) => {
            const px = scaleX(p.x);
            const py = scaleY(p.y);
            const isHome = p.team === "home";
            const isHighlighted = highlightPlayerId === p.id;
            const isHovered = hoveredPlayer?.id === p.id;

            return (
              <g
                key={p.id}
                className="cursor-pointer transition-transform duration-100"
                transform={`translate(${px}, ${py})`}
                onMouseEnter={(e) => {
                  setHoveredPlayer(p);
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
                }}
                onMouseLeave={() => setHoveredPlayer(null)}
                onClick={() => onPlayerClick?.(p)}
              >
                {/* Clean focus ring */}
                {(isHighlighted || isHovered) && (
                  <circle
                    r="16"
                    fill="none"
                    stroke={isHome ? "#10b981" : "#38bdf8"}
                    strokeWidth="1.5"
                    strokeDasharray="3,3"
                  />
                )}

                {/* Player dot */}
                <circle
                  r="11"
                  fill={isHome ? "#0f5132" : "#0c4a6e"}
                  stroke={isHome ? "#10b981" : "#38bdf8"}
                  strokeWidth="1.5"
                />

                {/* Squad number */}
                <text
                  textAnchor="middle"
                  dy="3.5"
                  fill="#ffffff"
                  fontSize="9"
                  fontWeight="600"
                  fontFamily="sans-serif"
                >
                  {p.number}
                </text>

                {/* Name label */}
                <text
                  textAnchor="middle"
                  dy="20"
                  fill="#a1a1aa"
                  fontSize="8.5"
                  fontWeight="500"
                  className="pointer-events-none"
                >
                  {p.name.split(" ").slice(-1)[0]}
                </text>
              </g>
            );
          })}

          {/* Ball */}
          {ballPosition && (
            <g transform={`translate(${scaleX(ballPosition.x)}, ${scaleY(ballPosition.y)})`}>
              <circle
                r="4.5"
                fill="#fafafa"
                stroke="#18181b"
                strokeWidth="1"
              />
            </g>
          )}
        </svg>

        {/* Minimal Tooltip */}
        {hoveredPlayer && (
          <div
            className="fixed pointer-events-none z-50 bg-[var(--kick-card)] border border-[var(--kick-border)] rounded-md p-2.5 shadow-lg text-xs text-[var(--kick-text)] min-w-[170px] -translate-x-1/2 -translate-y-full -mt-2"
            style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
          >
            <div className="flex items-center justify-between border-b border-[var(--kick-border)] pb-1 mb-1.5">
              <span className="font-semibold text-[var(--kick-text)]">
                #{hoveredPlayer.number} {hoveredPlayer.name}
              </span>
              <span className="text-[10px] uppercase font-mono text-[var(--kick-muted)]">
                {hoveredPlayer.team}
              </span>
            </div>

            <div className="space-y-1 text-[11px] text-[var(--kick-text)]">
              <div className="flex justify-between">
                <span className="text-[var(--kick-muted)]">Role:</span>
                <span className="text-[var(--kick-text)]">{hoveredPlayer.current_action || "Holding"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--kick-muted)]">Energy:</span>
                <span className="font-mono text-emerald-400">
                  {(hoveredPlayer.energy * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--kick-muted)]">Fatigue:</span>
                <span className="font-mono text-[var(--kick-text)]">
                  {(hoveredPlayer.fatigue * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
