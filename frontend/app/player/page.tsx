"use client";

import React, { useEffect, useState } from "react";
import MetricCard from "@/components/MetricCard";
import LoadingPitch from "@/components/LoadingPitch";
import { evaluatePlayer } from "@/lib/api";
import type { PlayerEvaluationResponse } from "@/lib/types";
import { Check, Search } from "lucide-react";

export default function PlayerEvaluationPage() {
  const [playerId, setPlayerId] = useState<string>("H10");
  const [playerName, setPlayerName] = useState<string>("Martin Ødegaard");
  const [role, setRole] = useState<string>("attacking midfielder");

  const [skills, setSkills] = useState({
    finishing: 74,
    passing: 89,
    dribbling: 85,
    tactical_intelligence: 91,
    creativity: 93,
    risk_appetite: 62,
    defending: 50,
    physical: 50,
  });

  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<PlayerEvaluationResponse | null>(null);

  const playerPresets = [
    { id: "H10", name: "Martin Ødegaard", role: "attacking midfielder" },
    { id: "H7", name: "Bukayo Saka", role: "inverted right winger" },
    { id: "H8", name: "Declan Rice", role: "box-to-box midfielder" },
  ];

  useEffect(() => {
    handleEvaluate();
  }, []);

  async function handleEvaluate(overrideId?: string, overrideName?: string, overrideRole?: string) {
    setLoading(true);
    const targetId = overrideId || playerId;
    const targetName = overrideName || playerName;
    const targetRole = overrideRole || role;

    try {
      const res = await evaluatePlayer({
        player_id: targetId,
        name: targetName,
        role: targetRole,
        ...Object.fromEntries(
          Object.entries(skills).map(([key, value]) => [key, value / 100])
        ),
      });
      setEvaluation(res);
    } catch (err) {
      console.error("Player evaluation failed:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectPreset(p: typeof playerPresets[0]) {
    setPlayerId(p.id);
    setPlayerName(p.name);
    setRole(p.role);
    handleEvaluate(p.id, p.name, p.role);
  }

  // Radar metrics
  const radarMetrics = [
    { key: "finishing", label: "Finishing", value: evaluation?.metrics?.finishing ?? 0.72 },
    { key: "passing", label: "Passing", value: evaluation?.metrics?.passing ?? 0.88 },
    { key: "dribbling", label: "Dribbling", value: evaluation?.metrics?.dribbling ?? 0.84 },
    { key: "tactical_intelligence", label: "Tactical IQ", value: evaluation?.metrics?.tactical_intelligence ?? 0.90 },
    { key: "creativity", label: "Creativity", value: evaluation?.metrics?.creativity ?? 0.92 },
  ];

  const radarSize = 300;
  const center = radarSize / 2;
  const radius = radarSize * 0.36;
  const numSides = radarMetrics.length;

  const getCoordinates = (value: number, index: number) => {
    const angle = (Math.PI * 2 / numSides) * index - Math.PI / 2;
    const r = radius * Math.max(0.1, Math.min(1.0, value));
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const getLabelCoordinates = (index: number) => {
    const angle = (Math.PI * 2 / numSides) * index - Math.PI / 2;
    const r = radius * 1.25;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const polygonPoints = radarMetrics
    .map((m, i) => {
      const coord = getCoordinates(m.value, i);
      return `${coord.x},${coord.y}`;
    })
    .join(" ");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[var(--kick-border)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--kick-text)]">
            Player Kinetic & Skill Radar
          </h1>
          <p className="text-xs text-[var(--kick-muted)] mt-0.5">
            Biomechanical load, skill distribution, tactical fit, and vulnerability analysis
          </p>
        </div>

        {/* Presets */}
        <div className="flex items-center gap-1.5">
          {playerPresets.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelectPreset(p)}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                playerId === p.id
                  ? "bg-[var(--kick-card)] text-[var(--kick-text)] border border-[var(--kick-primary)] font-medium"
                  : "text-[var(--kick-muted)] hover:text-[var(--kick-text)] border border-transparent"
              }`}
            >
              {p.name.split(" ").slice(-1)[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Inputs */}
      <div className="rounded-lg bg-[var(--kick-card)] border border-[var(--kick-border)] p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-medium text-[var(--kick-muted)] uppercase tracking-wide mb-1">
              Player ID
            </label>
            <input
              type="text"
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              className="w-full bg-[var(--kick-bg)] border border-[var(--kick-border)] rounded px-2.5 py-1.5 text-xs text-[var(--kick-text)] font-mono focus:outline-none focus:border-[var(--kick-primary)]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[var(--kick-muted)] uppercase tracking-wide mb-1">
              Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full bg-[var(--kick-bg)] border border-[var(--kick-border)] rounded px-2.5 py-1.5 text-xs text-[var(--kick-text)] focus:outline-none focus:border-[var(--kick-primary)]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[var(--kick-muted)] uppercase tracking-wide mb-1">
              Tactical Role
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-[var(--kick-bg)] border border-[var(--kick-border)] rounded px-2.5 py-1.5 text-xs text-[var(--kick-text)] focus:outline-none focus:border-[var(--kick-primary)]"
            />
          </div>

          <div>
            <button
              onClick={() => handleEvaluate()}
              disabled={loading}
              className="w-full bg-[var(--kick-primary)] hover:brightness-110 disabled:opacity-50 text-[#07140f] font-semibold px-3 py-1.5 rounded text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Search size={13} />
              Evaluate
            </button>
          </div>
        </div>
      </div>

      {/* Editable skill assessment */}
      <div className="rounded-lg bg-[var(--kick-card)] border border-[var(--kick-border)] p-4">
        <h3 className="text-sm font-semibold text-[var(--kick-text)] mb-1">
          Football Skill Assessment
        </h3>
        <p className="text-xs text-[var(--kick-muted)] mb-4">
          Enter assessed skill scores from 0 to 100, then click Evaluate.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Object.entries(skills) as [keyof typeof skills, number][]).map(([key, value]) => (
            <label key={key} className="space-y-2">
              <span className="flex justify-between text-xs text-[var(--kick-text)]">
                <span className="capitalize">{key.replaceAll("_", " ")}</span>
                <strong>{value}</strong>
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={value}
                onChange={(event) =>
                  setSkills((previous) => ({
                    ...previous,
                    [key]: Number(event.target.value),
                  }))
                }
                className="w-full accent-[var(--kick-primary)]"
              />
            </label>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingPitch label="Calculating radar and physical load..." />
      ) : evaluation ? (
        <>
          {/* KICKAI football player card */}
          <div className="rounded-xl border border-[var(--kick-border)] bg-[var(--kick-card)] p-5">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="sm:w-48 flex flex-col items-center justify-center rounded-xl border border-[var(--kick-border)] bg-[var(--kick-bg)] p-5">
                <span className="text-xs font-bold tracking-widest text-[var(--kick-muted)]">
                  KICKAI FOOTBALL CARD
                </span>
                <span className="mt-3 text-6xl font-black text-[var(--kick-primary)]">
                  {Math.round(evaluation.overall_rating)}
                </span>
                <span className="text-sm font-semibold text-[var(--kick-text)]">
                  OVR
                </span>
                <span className="mt-2 text-center text-xs text-[var(--kick-muted)]">
                  {evaluation.role}
                </span>
              </div>

              <div className="flex-1">
                <h2 className="text-lg font-bold text-[var(--kick-text)]">
                  {evaluation.name}
                </h2>
                <p className="mb-4 text-xs text-[var(--kick-muted)]">
                  Estimated football attributes from entered assessments
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(["pac", "sho", "pas", "dri", "def", "phy"] as const).map((attribute) => (
                    <div
                      key={attribute}
                      className="flex items-center justify-between rounded-lg border border-[var(--kick-border)] bg-[var(--kick-bg)] px-3 py-3"
                    >
                      <span className="text-xs font-bold uppercase text-[var(--kick-muted)]">
                        {attribute}
                      </span>
                      <span className="text-xl font-bold text-[var(--kick-text)]">
                        {evaluation.metrics?.[attribute] ?? "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Top Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <MetricCard
              title="Overall Rating"
              value={`${evaluation.overall_rating}`}
              subtitle={evaluation.name}
            />
            <MetricCard
              title="Role Fit"
              value={evaluation.role_fit}
              subtitle={evaluation.role}
            />
            <MetricCard
              title="Max Velocity"
              value={`${evaluation.metrics?.max_speed_mps ?? 8.2} m/s`}
              subtitle="Top sprint velocity"
              trend={{ value: "League upper tier", positive: true }}
            />
            <MetricCard
              title="Fatigue Load"
              value={`${((evaluation.metrics?.fatigue ?? 0.25) * 100).toFixed(0)}%`}
              subtitle="Cumulative match load"
            />
          </div>

          {/* Radar & Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Clean Radar */}
            <div className="rounded-lg bg-[var(--kick-card)] border border-[var(--kick-border)] p-4 flex flex-col items-center justify-center">
              <h3 className="text-xs font-semibold text-[var(--kick-text)] uppercase tracking-wide mb-2 self-start">
                Skill Radar Matrix
              </h3>

              <div className="relative w-full aspect-square max-w-[280px] flex items-center justify-center">
                <svg viewBox={`0 0 ${radarSize} ${radarSize}`} className="w-full h-full select-none">
                  {[0.25, 0.5, 0.75, 1.0].map((level) => {
                    const gridPoints = Array.from({ length: numSides })
                      .map((_, i) => {
                        const angle = (Math.PI * 2 / numSides) * i - Math.PI / 2;
                        const r = radius * level;
                        return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
                      })
                      .join(" ");

                    return (
                      <polygon
                        key={`grid-${level}`}
                        points={gridPoints}
                        fill="none"
                        stroke="var(--kick-border)"
                        strokeWidth="1"
                      />
                    );
                  })}

                  {Array.from({ length: numSides }).map((_, i) => {
                    const angle = (Math.PI * 2 / numSides) * i - Math.PI / 2;
                    return (
                      <line
                        key={`spoke-${i}`}
                        x1={center}
                        y1={center}
                        x2={center + radius * Math.cos(angle)}
                        y2={center + radius * Math.sin(angle)}
                        stroke="var(--kick-border)"
                        strokeWidth="1"
                      />
                    );
                  })}

                  {/* Clean radar polygon */}
                  <polygon
                    points={polygonPoints}
                    fill="var(--kick-primary)" fillOpacity={0.15}
                    stroke="var(--kick-primary)"
                    strokeWidth="1.8"
                    className="radar-polygon"
                  />

                  {radarMetrics.map((m, i) => {
                    const coord = getCoordinates(m.value, i);
                    return (
                      <circle
                        key={`dot-${i}`}
                        cx={coord.x}
                        cy={coord.y}
                        r="3"
                        fill="var(--kick-primary)"
                      />
                    );
                  })}

                  {radarMetrics.map((m, i) => {
                    const labelPos = getLabelCoordinates(i);
                    return (
                      <text
                        key={`label-${i}`}
                        x={labelPos.x}
                        y={labelPos.y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="var(--kick-muted)"
                        fontSize="10"
                        fontWeight="500"
                        className="font-sans"
                      >
                        {m.label} ({Math.round(m.value * 100)})
                      </text>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="lg:col-span-2 space-y-3">
              <div className="rounded-lg bg-[var(--kick-card)] border border-[var(--kick-border)] p-4">
                <h4 className="text-xs font-semibold text-[var(--kick-text)] uppercase tracking-wide mb-2.5">
                  Core Strengths
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[var(--kick-text)]">
                  {evaluation.strengths.map((str, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded bg-[var(--kick-bg)] border border-[var(--kick-border)] flex items-start gap-2"
                    >
                      <Check size={13} className="text-emerald-400 mt-0.5 shrink-0" />
                      <span>{str}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg bg-[var(--kick-card)] border border-[var(--kick-border)] p-4">
                <h4 className="text-xs font-semibold text-[var(--kick-text)] uppercase tracking-wide mb-2.5">
                  Vulnerabilities & Limitations
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[var(--kick-text)]">
                  {evaluation.weaknesses.map((weak, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded bg-[var(--kick-bg)] border border-[var(--kick-border)] flex items-start gap-2 text-[var(--kick-muted)]"
                    >
                      <span className="text-[var(--kick-muted)] shrink-0">•</span>
                      <span>{weak}</span>
                    </div>
                  ))}
                </div>
              </div>

              {evaluation.recommended_actions && (
                <div className="rounded-lg bg-[var(--kick-card)] border border-[var(--kick-border)] p-4">
                  <h4 className="text-xs font-semibold text-[var(--kick-text)] uppercase tracking-wide mb-2">
                    Action Plan
                  </h4>
                  <ul className="space-y-1 text-xs text-[var(--kick-muted)]">
                    {evaluation.recommended_actions.map((act, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="text-[var(--kick-muted)]">→</span>
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
<a href="/wiki" className="text-xs text-[var(--kick-primary)] underline">Wiki data →</a>
