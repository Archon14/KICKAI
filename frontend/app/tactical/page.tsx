"use client";

import React, { useEffect, useState } from "react";
import CinematicHero from "@/components/CinematicHero";
import PitchCanvas from "@/components/PitchCanvas";
import TacticalMatrix from "@/components/TacticalMatrix";
import MetricCard from "@/components/MetricCard";
import LoadingPitch from "@/components/LoadingPitch";
import { analyzeTactics } from "@/lib/api";
import type { TacticsAnalyzeResponse, TacticalOptionModel, PassingVector } from "@/lib/types";
import { Play } from "lucide-react";

export default function TacticalLabPage() {
  const [strikerStyle, setStrikerStyle] = useState("pace");
  const [defensiveShape, setDefensiveShape] = useState("4-4-2");

  const scoutProfiles: Record<string, {
    name: string;
    threat: string;
    response: string[];
    avoid: string;
    drill: string;
  }> = {
    pace: {
      name: "Fast Striker",
      threat: "Runs behind a high defensive line and attacks through balls.",
      response: [
        "Keep the defensive line slightly deeper.",
        "Assign one defender to cover runs behind.",
        "Pressure midfield passers before they release through balls.",
        "Keep the goalkeeper ready to sweep behind the defense."
      ],
      avoid: "Do not leave slow defenders isolated in large spaces.",
      drill: "Practice 2v2 recovery runs and through-ball interception."
    },
    finisher: {
      name: "Elite Finisher",
      threat: "Converts chances quickly inside the penalty area.",
      response: [
        "Block central shooting lanes.",
        "Track the striker before crosses enter the box.",
        "Force shots from wider, less favorable angles.",
        "Coordinate center-back and defensive-midfielder marking."
      ],
      avoid: "Do not allow uncontested touches near the penalty spot.",
      drill: "Practice box defending, shot blocking and second-ball recovery."
    },
    aerial: {
      name: "Aerial Target Striker",
      threat: "Wins headers and creates chances from crosses and set pieces.",
      response: [
        "Pressure wide players to reduce crossing opportunities.",
        "Assign a strong aerial defender to challenge the striker.",
        "Protect the second-ball area with midfield support.",
        "Use coordinated marking during corners and free kicks."
      ],
      avoid: "Do not let the striker attack crosses without a challenge.",
      drill: "Practice crossing defense and aerial-duel positioning."
    },
    dribbler: {
      name: "Creative Dribbler",
      threat: "Beats defenders in one-on-one situations and creates space.",
      response: [
        "Show the attacker toward the touchline.",
        "Use a covering defender behind the first challenger.",
        "Maintain compact spacing between defensive units.",
        "Delay the attacker instead of diving into tackles."
      ],
      avoid: "Do not commit multiple defenders without protecting passing lanes.",
      drill: "Practice 1v1 jockeying and 2v1 defensive coverage."
    }
  };

  const scout = scoutProfiles[strikerStyle];
  const [seed, setSeed] = useState<number>(7);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [analysis, setAnalysis] = useState<TacticsAnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<TacticalOptionModel | null>(null);

  const [lastSeed, setLastSeed] = useState<number>(-1);

  useEffect(() => {
    if (seed !== lastSeed) {
      setLastSeed(seed);
      setError(null);
      handleAnalyze();
    }
  }, [seed]);

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    try {
      const res = await analyzeTactics(seed, "balanced", 70, [1, 1]);
      setAnalysis(res);
      setSelectedOption(res.recommendation || (res.options?.[0] ?? null));
    } catch (err: any) {
      console.error("Tactical analysis failed:", err);
      setError("Unable to analyze this scenario. Check the backend connection, then click New Scenario to retry.");
    } finally {
      setLoading(false);
    }
  }

  const currentOption = selectedOption || analysis?.recommendation;

  const dynamicVectors: PassingVector[] = (() => {
    const players = analysis?.pitch_players ?? [];
    const carrier = players.find(p => p.id === analysis?.ball_carrier_id);

    if (!carrier) return [];

    return (analysis?.options ?? []).map(opt => {
      const receiver = players.find(p => p.id === opt.target_player);
      const isShot = opt.action.includes("SHOOT");

      return {
        fromId: carrier.id,
        toId: receiver?.id ?? "GOAL",
        fromX: carrier.x,
        fromY: carrier.y,
        toX: receiver?.x ?? (isShot ? 105 : carrier.x),
        toY: receiver?.y ?? (isShot ? 34 : carrier.y),
        ev: opt.expected_value,
        probability: opt.confidence,
        label: opt.action,
      };
    }).filter(vec =>
      vec.fromX !== vec.toX || vec.fromY !== vec.toY
    );
  })();

  return (
    <div className="space-y-6">
      <CinematicHero
        eyebrow="KICKAI / OPPONENT INTELLIGENCE"
        title="Every striker has a pattern."
        highlight="Find it. Understand it. Prepare."
        description="Explore how football intelligence can turn an opponent's attacking strengths into a practical defensive game plan."
      />
      <section className="kick-scroll-reveal rounded-2xl border border-[var(--kick-border)] bg-[var(--kick-card)] p-5 sm:p-6 space-y-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--kick-primary)]">Opponent Intelligence</span>
          <h2 className="mt-2 text-xl font-bold text-[var(--kick-text)]">AI Opponent Scout & Defensive Counter-Plan</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--kick-muted)]">
            Choose the opposing striker's playing style and your defensive formation to explore a tactical response.
            This is an explainable scenario-based prototype, not verified scouting of a real player.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="block text-sm font-semibold text-[var(--kick-text)]">Opponent's strongest threat</span>
            <select value={strikerStyle} onChange={e => setStrikerStyle(e.target.value)}
              className="w-full rounded-lg border border-[var(--kick-border)] bg-[var(--kick-bg)] p-3 text-sm text-[var(--kick-text)]">
              <option value="pace">Fast striker / runs behind</option>
              <option value="finisher">Elite penalty-box finisher</option>
              <option value="aerial">Aerial target striker</option>
              <option value="dribbler">Creative dribbler</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="block text-sm font-semibold text-[var(--kick-text)]">Your defensive formation</span>
            <select value={defensiveShape} onChange={e => setDefensiveShape(e.target.value)}
              className="w-full rounded-lg border border-[var(--kick-border)] bg-[var(--kick-bg)] p-3 text-sm text-[var(--kick-text)]">
              <option value="4-4-2">4-4-2</option>
              <option value="4-3-3">4-3-3</option>
              <option value="4-2-3-1">4-2-3-1</option>
              <option value="3-5-2">3-5-2</option>
              <option value="5-3-2">5-3-2</option>
            </select>
          </label>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
            <h3 className="font-bold text-[var(--kick-text)]">Threat: {scout.name}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--kick-muted)]">{scout.threat}</p>
            <p className="mt-4 text-sm font-semibold text-rose-400">Avoid</p>
            <p className="mt-1 text-sm text-[var(--kick-text)]">{scout.avoid}</p>
          </div>
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
            <h3 className="font-bold text-[var(--kick-text)]">Counter-plan · {defensiveShape}</h3>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-[var(--kick-text)]">
              {scout.response.map((item, i) => <li key={i}>{item}</li>)}
            </ol>
          </div>
        </div>
        <div className="rounded-xl border border-[var(--kick-border)] bg-[var(--kick-bg)] p-4">
          <div className="mb-4">
            <h3 className="text-base font-bold text-[var(--kick-text)]">Defensive Positioning Simulator</h3>
            <p className="mt-1 text-xs text-[var(--kick-muted)]">
              Illustrative tactical diagram. Blue = your team, red = opponent striker.
              Formation and striker type update the layout.
            </p>
          </div>
          <svg viewBox="0 0 600 380" className="w-full max-w-3xl mx-auto rounded-xl" role="img" aria-label="Football pitch showing defensive formation and opposing striker">
            <rect width="600" height="380" rx="12" fill="#12633e"/>
            <rect x="16" y="16" width="568" height="348" rx="2" fill="none" stroke="#ffffff" strokeOpacity=".75" strokeWidth="2"/>
            <line x1="300" y1="16" x2="300" y2="364" stroke="white" strokeOpacity=".65" strokeWidth="2"/>
            <circle cx="300" cy="190" r="55" fill="none" stroke="white" strokeOpacity=".65" strokeWidth="2"/>
            <rect x="16" y="105" width="100" height="170" fill="none" stroke="white" strokeOpacity=".65" strokeWidth="2"/>
            <rect x="484" y="105" width="100" height="170" fill="none" stroke="white" strokeOpacity=".65" strokeWidth="2"/>
            <rect x="16" y="150" width="38" height="80" fill="none" stroke="white" strokeOpacity=".65" strokeWidth="2"/>
            <rect x="546" y="150" width="38" height="80" fill="none" stroke="white" strokeOpacity=".65" strokeWidth="2"/>
            {(() => {
              const lines = defensiveShape.split("-").map(Number);
              const points: {x: number; y: number; label: string}[] = [{x: 46, y: 190, label: "GK"}];
              lines.forEach((count, lineIndex) => {
                const x = 140 + lineIndex * (260 / Math.max(1, lines.length - 1));
                for (let i = 0; i < count; i++) {
                  points.push({
                    x,
                    y: 45 + (290 * (i + 1)) / (count + 1),
                    label: lineIndex === 0 ? "DEF" : lineIndex === lines.length - 1 ? "ATT" : "MID"
                  });
                }
              });
              const threatY = strikerStyle === "aerial" ? 110 : strikerStyle === "dribbler" ? 270 : 190;
              const threatX = strikerStyle === "pace" ? 205 : strikerStyle === "finisher" ? 165 : 235;
              return (
                <>
                  <circle cx={threatX} cy={threatY} r="38" fill="#ef4444" fillOpacity=".18" stroke="#fca5a5" strokeDasharray="5 5"/>
                  <circle cx={threatX} cy={threatY} r="15" fill="#ef4444" stroke="white" strokeWidth="2"/>
                  <text x={threatX} y={threatY + 4} fontSize="11" fontWeight="bold" fill="white" textAnchor="middle">ST</text>
                  {points.map((pt, i) => (
                    <g key={i}>
                      <circle cx={pt.x} cy={pt.y} r="13" fill="#2563eb" stroke="white" strokeWidth="2"/>
                      <text x={pt.x} y={pt.y + 4} fontSize="9" fontWeight="bold" fill="white" textAnchor="middle">{i === 0 ? "GK" : i}</text>
                    </g>
                  ))}
                  <path d={`M ${threatX + 20} ${threatY} L ${threatX + 75} ${threatY}`} stroke="#fca5a5" strokeWidth="3" strokeDasharray="7 5"/>
                </>
              );
            })()}
          </svg>
          <p className="mt-3 text-xs text-[var(--kick-muted)]">
            Scenario visualization only — player coordinates are illustrative, not tracked from real match footage.
          </p>
        </div>
        <div className="rounded-xl border border-[var(--kick-border)] bg-[var(--kick-bg)] p-4">
          <div className="mb-4">
            <h3 className="text-base font-bold text-[var(--kick-text)]">Defensive Positioning Simulator</h3>
            <p className="mt-1 text-xs text-[var(--kick-muted)]">
              Illustrative tactical diagram. Blue = your team, red = opponent striker.
              Formation and striker type update the layout.
            </p>
          </div>
          <svg viewBox="0 0 600 380" className="w-full max-w-3xl mx-auto rounded-xl" role="img" aria-label="Football pitch showing defensive formation and opposing striker">
            <rect width="600" height="380" rx="12" fill="#12633e"/>
            <rect x="16" y="16" width="568" height="348" rx="2" fill="none" stroke="#ffffff" strokeOpacity=".75" strokeWidth="2"/>
            <line x1="300" y1="16" x2="300" y2="364" stroke="white" strokeOpacity=".65" strokeWidth="2"/>
            <circle cx="300" cy="190" r="55" fill="none" stroke="white" strokeOpacity=".65" strokeWidth="2"/>
            <rect x="16" y="105" width="100" height="170" fill="none" stroke="white" strokeOpacity=".65" strokeWidth="2"/>
            <rect x="484" y="105" width="100" height="170" fill="none" stroke="white" strokeOpacity=".65" strokeWidth="2"/>
            <rect x="16" y="150" width="38" height="80" fill="none" stroke="white" strokeOpacity=".65" strokeWidth="2"/>
            <rect x="546" y="150" width="38" height="80" fill="none" stroke="white" strokeOpacity=".65" strokeWidth="2"/>
            {(() => {
              const lines = defensiveShape.split("-").map(Number);
              const points: {x: number; y: number; label: string}[] = [{x: 46, y: 190, label: "GK"}];
              lines.forEach((count, lineIndex) => {
                const x = 140 + lineIndex * (260 / Math.max(1, lines.length - 1));
                for (let i = 0; i < count; i++) {
                  points.push({
                    x,
                    y: 45 + (290 * (i + 1)) / (count + 1),
                    label: lineIndex === 0 ? "DEF" : lineIndex === lines.length - 1 ? "ATT" : "MID"
                  });
                }
              });
              const threatY = strikerStyle === "aerial" ? 110 : strikerStyle === "dribbler" ? 270 : 190;
              const threatX = strikerStyle === "pace" ? 205 : strikerStyle === "finisher" ? 165 : 235;
              return (
                <>
                  <circle cx={threatX} cy={threatY} r="38" fill="#ef4444" fillOpacity=".18" stroke="#fca5a5" strokeDasharray="5 5"/>
                  <circle cx={threatX} cy={threatY} r="15" fill="#ef4444" stroke="white" strokeWidth="2"/>
                  <text x={threatX} y={threatY + 4} fontSize="11" fontWeight="bold" fill="white" textAnchor="middle">ST</text>
                  {points.map((pt, i) => (
                    <g key={i}>
                      <circle cx={pt.x} cy={pt.y} r="13" fill="#2563eb" stroke="white" strokeWidth="2"/>
                      <text x={pt.x} y={pt.y + 4} fontSize="9" fontWeight="bold" fill="white" textAnchor="middle">{i === 0 ? "GK" : i}</text>
                    </g>
                  ))}
                  <path d={`M ${threatX + 20} ${threatY} L ${threatX + 75} ${threatY}`} stroke="#fca5a5" strokeWidth="3" strokeDasharray="7 5"/>
                </>
              );
            })()}
          </svg>
          <p className="mt-3 text-xs text-[var(--kick-muted)]">
            Scenario visualization only — player coordinates are illustrative, not tracked from real match footage.
          </p>
        </div>
        <div className="rounded-xl border border-[var(--kick-border)] bg-[var(--kick-bg)] p-4">
          <h3 className="text-sm font-bold text-[var(--kick-text)]">Recommended training drill</h3>
          <p className="mt-2 text-sm text-[var(--kick-muted)]">{scout.drill}</p>
        </div>
      </section>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[var(--kick-border)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--kick-text)]">Tactical Decision Lab</h1>
          <p className="text-xs text-[var(--kick-muted)] mt-0.5">AI recommends pass/shoot/diagonal for a random match scenario.</p>
        </div>
        <button
          disabled={loading || cooldown}
          onClick={() => { if (loading || cooldown) return; setCooldown(true); setTimeout(() => setCooldown(false), 1200); let s = Math.floor(Math.random() * 9999); while (s === seed) { s = Math.floor(Math.random() * 9999); } setSeed(s); }}
          className="bg-[var(--kick-primary)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-[#07140f] font-semibold px-3 py-1.5 rounded text-xs transition-colors"
        >
          {loading ? "Generating..." : "New Scenario"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-950/20 border border-rose-500/20 px-3 py-2 text-xs text-rose-400">{error}</div>
      )}

      {loading ? (
        <LoadingPitch label="Analyzing scenario..." />
      ) : analysis ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <MetricCard title="EV" value={`+${((currentOption?.expected_value ?? 0.38) * 100).toFixed(1)}%`} subtitle="Expected value" />
            <MetricCard title="Risk" value={`${((currentOption?.risk ?? 0.42) * 100).toFixed(1)}%`} subtitle="Turnover risk" />
            <MetricCard title="Confidence" value={`${((currentOption?.confidence ?? 0.75) * 100).toFixed(0)}%`} subtitle="Analysis certainty" />
            <MetricCard title="Quality" value={`${((analysis.quality ?? 0.88) * 100).toFixed(0)} / 100`} subtitle="Tactical score" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              <PitchCanvas
                players={analysis.pitch_players?.length ? analysis.pitch_players : undefined}
                ballPosition={analysis.ball_position ?? undefined}
                vectors={dynamicVectors}
                highlightPlayerId={analysis.ball_carrier_id ?? undefined}
                title={`${({
                  counterattack: "Counterattack",
                  wing_attack: "Wing Attack",
                  central_attack: "Central Attack",
                  high_pressure: "High Pressure",
                } as Record<string, string>)[analysis.scenario_type ?? ""] ?? "Tactical Scenario"} · Seed ${seed}`}
              />
            </div>
            <div className="space-y-4">
              <TacticalMatrix options={analysis.options} selectedOptionId={currentOption?.id} onSelectOption={(opt) => setSelectedOption(opt)} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
