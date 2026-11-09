"use client";

import { useState } from "react";
import { Activity, BarChart3, Play, RotateCcw, Shield, Target } from "lucide-react";

const events = [
  { minute: 0, title: "Kickoff", detail: "Both teams begin in their starting formations.", home: 0, away: 0, possession: 50, shots: 0, threat: 15 },
  { minute: 12, title: "Midfield pressure", detail: "The home side begins controlling central areas.", home: 0, away: 0, possession: 57, shots: 1, threat: 29 },
  { minute: 24, title: "Attacking transition", detail: "A quick counterattack creates a shooting opportunity.", home: 0, away: 0, possession: 54, shots: 3, threat: 65 },
  { minute: 38, title: "Goal!", detail: "The home side finishes an attacking move.", home: 1, away: 0, possession: 59, shots: 5, threat: 84 },
  { minute: 55, title: "Opponent response", detail: "The away team pushes forward and increases pressure.", home: 1, away: 0, possession: 51, shots: 6, threat: 49 },
  { minute: 72, title: "Defensive adjustment", detail: "The home team narrows its defensive shape.", home: 1, away: 0, possession: 48, shots: 7, threat: 36 },
  { minute: 90, title: "Full time", detail: "The illustrative match concludes.", home: 1, away: 0, possession: 52, shots: 9, threat: 25 },
];

export default function MatchCommandCenter() {
  const [step, setStep] = useState(0);
  const [formation, setFormation] = useState<"4-4-2" | "4-3-3">("4-4-2");
  const current = events[step];

  const defenders = formation === "4-4-2"
    ? [[25,15],[25,38],[25,62],[25,85],[48,15],[48,38],[48,62],[48,85],[73,35],[73,65]]
    : [[25,15],[25,38],[25,62],[25,85],[48,25],[48,50],[48,75],[73,20],[73,50],[73,80]];

  return (
    <section className="relative overflow-hidden rounded-3xl bg-[#071218] px-5 py-24 text-white sm:px-10">
      <div className="pointer-events-none absolute right-0 top-0 h-[450px] w-[450px] rounded-full bg-cyan-400/10 blur-[130px]" />
      <div className="relative mx-auto max-w-6xl">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.3em] text-cyan-400">
          <Activity size={16} /> Match Intelligence / Command Center
        </p>
        <h2 className="mt-5 text-4xl font-black sm:text-7xl">
          Every moment matters.
          <span className="block text-cyan-400">See the bigger picture.</span>
        </h2>
        <p className="mt-5 max-w-3xl text-white/60">
          Explore how match events, tactical positioning and performance indicators
          can be presented together in a football analysis dashboard.
        </p>

        <div className="mt-12 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <div className="overflow-hidden rounded-2xl border border-white/15 bg-[#0b2630]">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <span className="text-sm font-bold">HOME FC</span>
              <div className="text-center">
                <div className="text-4xl font-black">{current.home} : {current.away}</div>
                <div className="mt-1 font-mono text-xs text-cyan-400">{current.minute}&apos; MATCH TIME</div>
              </div>
              <span className="text-sm font-bold">AWAY FC</span>
            </div>
            <svg viewBox="0 0 800 440" className="w-full">
              <rect width="800" height="440" fill="#12633e"/>
              <rect x="18" y="18" width="764" height="404" fill="none" stroke="white" strokeOpacity=".65" strokeWidth="2"/>
              <line x1="400" y1="18" x2="400" y2="422" stroke="white" strokeOpacity=".65" strokeWidth="2"/>
              <circle cx="400" cy="220" r="60" fill="none" stroke="white" strokeOpacity=".65" strokeWidth="2"/>
              <rect x="18" y="115" width="115" height="210" fill="none" stroke="white" strokeOpacity=".65" strokeWidth="2"/>
              <rect x="667" y="115" width="115" height="210" fill="none" stroke="white" strokeOpacity=".65" strokeWidth="2"/>
              <circle cx="70" cy="220" r="16" fill="#38bdf8" stroke="white" strokeWidth="2"/>
              {defenders.map(([x,y],i) => (
                <circle key={i} cx={x*8} cy={y*4.4} r="16"
                  fill="#38bdf8" stroke="white" strokeWidth="2"
                  className="transition-all duration-700"/>
              ))}
              {[80,65,50,35,20].map((x,i) => (
                <circle key={i} cx={x*8} cy={(15+i*17)*4.4} r="16"
                  fill="#fb7185" stroke="white" strokeWidth="2"/>
              ))}
              <circle cx={400 + Math.sin(step*1.4)*140} cy={220 + Math.cos(step*1.2)*90}
                r="8" fill="white" stroke="#111827" strokeWidth="2"
                className="transition-all duration-700"/>
            </svg>
            <div className="flex flex-wrap items-center justify-between gap-3 p-5">
              <span className="text-xs text-white/60">Illustrative tactical positioning</span>
              <div className="flex gap-2">
                {(["4-4-2","4-3-3"] as const).map(shape => (
                  <button key={shape} onClick={() => setFormation(shape)}
                    className={`rounded-lg px-4 py-2 text-xs font-bold ${formation === shape ? "bg-cyan-400 text-black" : "bg-white/10"}`}>
                    {shape}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl border border-white/15 bg-white/[.04] p-6">
              <h3 className="flex items-center gap-2 text-lg font-bold"><BarChart3 className="text-cyan-400"/> Match indicators</h3>
              {[
                ["Possession", current.possession, "%"],
                ["Attacking pressure index", current.threat, "/100"],
                ["Shots (home)", current.shots, ""],
              ].map(([label,value,suffix]) => (
                <div key={label} className="mt-6">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-white/60">{label}</span>
                    <span className="font-bold">{value}{suffix}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-cyan-400 transition-all duration-700"
                      style={{width:`${label === "Shots (home)" ? Number(value)*10 : value}%`}}/>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-cyan-400/25 bg-cyan-400/[.05] p-6">
              <p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-400">Match event</p>
              <h3 className="mt-3 text-2xl font-black">{current.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/60">{current.detail}</p>
            </div>
          </div>
        </div>

        <div className="mt-7 rounded-2xl border border-white/15 bg-white/[.035] p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-xl font-bold"><Target className="text-cyan-400"/> Match timeline</h3>
            <button onClick={() => setStep(0)} className="flex items-center gap-2 text-xs text-white/60">
              <RotateCcw size={15}/> Restart
            </button>
          </div>
          <div className="mt-7 flex items-center gap-2">
            {events.map((event,index) => (
              <button key={event.minute} onClick={() => setStep(index)}
                title={`${event.minute}' ${event.title}`}
                className={`h-3 min-w-0 flex-1 rounded-full transition-all ${
                  index <= step ? "bg-cyan-400" : "bg-white/15"
                }`}/>
            ))}
          </div>
          <div className="mt-3 flex justify-between font-mono text-xs text-white/45">
            <span>00&apos;</span><span>HALF TIME</span><span>90&apos;</span>
          </div>
          <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-white/65">{current.minute}&apos; — {current.title}</p>
            <button onClick={() => setStep(v => (v+1)%events.length)}
              className="flex items-center gap-2 rounded-full bg-cyan-400 px-6 py-3 text-sm font-bold text-black">
              <Play size={16}/> {step === events.length-1 ? "Replay" : "Next event"}
            </button>
          </div>
        </div>

        <div className="mt-7 flex items-start gap-3 rounded-xl border border-white/10 p-5 text-sm text-white/55">
          <Shield size={20} className="shrink-0 text-cyan-400"/>
          This command center demonstrates a fictional match scenario with illustrative
          statistics and positions. It does not represent real-time match tracking or
          verified AI-generated predictions.
        </div>
      </div>
    </section>
  );
}
