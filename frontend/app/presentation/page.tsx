"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import TacticalBattle from "@/components/TacticalBattle";
import ScoutingReveal from "@/components/ScoutingReveal";
import MatchCommandCenter from "@/components/MatchCommandCenter";
import { ArrowDown, ArrowRight, Brain, Eye, Shield, Target, Trophy } from "lucide-react";

const scenes = [
  { id: "problem", label: "The Problem" },
  { id: "intro", label: "Meet KICKAI" },
  { id: "vision", label: "AI Vision" },
  { id: "tactics", label: "Opponent Scout" },
  { id: "action", label: "From Data to Action" },
  { id: "sequence", label: "Tactical Sequence" },
  { id: "battle", label: "Tactical Battle" },
  { id: "scouting", label: "Player Scouting" },
  { id: "command", label: "Match Command Center" },
  { id: "explore", label: "Explore Every Feature" },
  { id: "impact", label: "The Impact" },
];

export default function PresentationPage() {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showAI, setShowAI] = useState(true);
  const [sceneProgress, setSceneProgress] = useState(0);
  const [tacticalProgress, setTacticalProgress] = useState(0);
  const [presenterOpen, setPresenterOpen] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  const [threat, setThreat] = useState("pace");

  useEffect(() => {
    const parent = root.current?.closest("main");
    if (!parent) return;
    let raf = 0;

    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const sections = Array.from(root.current?.querySelectorAll<HTMLElement>("[data-scene]") ?? []);
        const rect = parent.getBoundingClientRect();
        const midpoint = rect.top + rect.height * 0.5;
        let nearest = 0;
        let distance = Infinity;

        sections.forEach((section, i) => {
          const r = section.getBoundingClientRect();
          const d = Math.abs(r.top + r.height / 2 - midpoint);
          if (d < distance) {
            distance = d;
            nearest = i;
          }
        });

        setActive(nearest);

        const tacticalSection = document.getElementById("sequence");
        if (tacticalSection) {
          const tr = tacticalSection.getBoundingClientRect();
          const available = Math.max(tr.height - rect.height, 1);
          setTacticalProgress(
            Math.max(0, Math.min(1, (rect.top - tr.top) / available))
          );
        }

        const current = sections[nearest];
        if (current) {
          const r = current.getBoundingClientRect();
          const relative = (midpoint - r.top) / Math.max(r.height, 1);
          setSceneProgress(Math.max(0, Math.min(1, relative)));
        }
        const scrollable = parent.scrollHeight - parent.clientHeight;
        setProgress(scrollable > 0 ? parent.scrollTop / scrollable : 0);
      });
    };

    parent.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
    return () => {
      cancelAnimationFrame(raf);
      parent.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);


  useEffect(() => {
    if (!timerRunning) return;
    const timer = window.setInterval(() => setElapsed(v => v + 1), 1000);
    return () => window.clearInterval(timer);
  }, [timerRunning]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement &&
          ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)) return;

      if (event.key === "Escape") {
        setPresenterOpen(false);
      }

      if (event.key.toLowerCase() === "f" && !event.repeat) {
        if (document.fullscreenElement) {
          void document.exitFullscreen();
        } else {
          void document.documentElement.requestFullscreen();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function goTo(index: number) {
    document.getElementById(scenes[index].id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  const counter = {
    pace: ["Drop the defensive line", "Cover through-ball lanes", "Pressure the passer"],
    finisher: ["Protect central shooting lanes", "Track runs inside the box", "Force wider shooting angles"],
    aerial: ["Stop crosses at their source", "Challenge aerial duels", "Secure second balls"],
    dribbler: ["Show the attacker wide", "Delay instead of diving in", "Provide covering support"],
  }[threat as "pace" | "finisher" | "aerial" | "dribbler"];

  return (
    <div
      ref={root}
      className="kick-presentation relative -mx-2 sm:-mx-4 text-[var(--kick-text)]"
      style={{
        ["--scene-progress" as string]: sceneProgress,
      }}
    >

      <div className="fixed bottom-5 left-1/2 z-[100] w-[min(95vw,620px)] -translate-x-1/2">
        <button
          type="button"
          onClick={() => {
            const highlights = ["problem", "intro", "vision", "tactics", "battle", "scouting", "command", "impact"];
            const current = highlights.indexOf(scenes[active]?.id ?? "");
            const next = highlights[(current + 1) % highlights.length];
            document.getElementById(next)?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }}
          className="fixed bottom-24 right-5 z-[110] rounded-full border border-emerald-300/30 bg-emerald-400 px-5 py-3 text-sm font-black text-[#061511] shadow-xl shadow-emerald-950/40 transition hover:scale-105"
        >
          Judge Demo →
        </button>
        {presenterOpen ? (
          <div className="rounded-2xl border border-white/20 bg-[#071411]/95 p-3 text-white shadow-[0_20px_80px_rgba(0,0,0,.7)] backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-emerald-400 px-3 py-2 text-xs font-black text-black">
                  KICKAI LIVE
                </span>
                <span className="font-mono text-sm font-bold tabular-nums">
                  {String(Math.floor(elapsed / 60)).padStart(2, "0")}:
                  {String(elapsed % 60).padStart(2, "0")} / 05:00
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setTimerRunning(v => !v)}
                  className="rounded-lg border border-white/20 px-3 py-2 text-xs font-bold">
                  {timerRunning ? "Pause" : "Start"}
                </button>
                <button onClick={() => { setElapsed(0); setTimerRunning(false); }}
                  className="rounded-lg border border-white/20 px-3 py-2 text-xs">
                  Reset
                </button>
                <button onClick={() => {
                  if (document.fullscreenElement) void document.exitFullscreen();
                  else void document.documentElement.requestFullscreen();
                }} className="rounded-lg border border-white/20 px-3 py-2 text-xs">
                  Fullscreen
                </button>
                <button onClick={() => setPresenterOpen(false)}
                  className="rounded-lg border border-white/20 px-3 py-2 text-xs">
                  Hide
                </button>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <button onClick={() => goTo(Math.max(0, active - 1))}
                disabled={active === 0}
                className="rounded-lg bg-white/10 px-3 py-2 text-xs disabled:opacity-30">
                Previous
              </button>
              <span className="truncate text-center text-xs text-emerald-300">
                {scenes[active]?.label ?? "Presentation"}
              </span>
              <button onClick={() => goTo(Math.min(scenes.length - 1, active + 1))}
                disabled={active === scenes.length - 1}
                className="rounded-lg bg-white/10 px-3 py-2 text-xs disabled:opacity-30">
                Next
              </button>
            </div>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/15">
              <div className={`h-full transition-all ${elapsed > 300 ? "bg-red-400" : "bg-emerald-400"}`}
                style={{width: `${Math.min(100, elapsed / 300 * 100)}%`}}/>
            </div>
          </div>
        ) : (
          <button onClick={() => setPresenterOpen(true)}
            className="mx-auto block rounded-full border border-emerald-400/40 bg-[#071411]/95 px-5 py-3 text-sm font-bold text-emerald-300 shadow-xl">
            Open Presenter Controls
          </button>
        )}
      </div>

      <div className="fixed left-0 top-0 z-50 h-1 bg-[var(--kick-primary)] transition-[width] duration-150" style={{ width: `${progress * 100}%` }} />

      <nav aria-label="Presentation scenes" className="fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-3 xl:flex">
        {scenes.map((scene, i) => (
          <button key={scene.id} onClick={() => goTo(i)} title={scene.label} aria-label={`Go to ${scene.label}`}
            className={`h-2.5 rounded-full transition-all ${active === i ? "w-8 bg-[var(--kick-primary)]" : "w-2.5 bg-white/30 hover:bg-white/70"}`} />
        ))}
      </nav>

      <section id="problem" data-scene className="relative flex min-h-[88vh] snap-start flex-col items-center justify-center overflow-hidden rounded-3xl bg-[#060b0b] px-6 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,.16),transparent_65%)]" />
        <p className="kick-scroll-reveal relative mb-6 text-xs font-bold uppercase tracking-[.4em] text-emerald-400">The challenge</p>
        <h1 className="kick-scroll-reveal relative max-w-5xl text-5xl font-black leading-[1.05] tracking-tight sm:text-7xl lg:text-8xl">
          Talent is everywhere.<span className="block text-emerald-400">Intelligence isn't.</span>
        </h1>
        <p className="kick-scroll-reveal relative mt-8 max-w-2xl text-lg text-white/65">
          Professional football analysis can require specialized tools, expertise and resources. What about the teams without them?
        </p>
        <button onClick={() => goTo(1)} className="absolute bottom-9 flex items-center gap-2 text-sm text-white/70">Discover the solution <ArrowDown size={17}/></button>
      </section>

      <section id="intro" data-scene className="relative flex min-h-[88vh] flex-col items-center justify-center overflow-hidden rounded-3xl bg-[#071b17] px-6 text-center">
        <div className="absolute h-[500px] w-[500px] rounded-full bg-emerald-400/15 blur-[120px]" />
        <p className="kick-scroll-reveal relative mb-6 text-xs font-bold uppercase tracking-[.4em] text-emerald-300">Introducing</p>
        <h2 className="kick-scroll-reveal relative text-[clamp(5rem,18vw,15rem)] font-black leading-none tracking-[-.09em]">KICK<span className="text-emerald-400">AI</span></h2>
        <p className="kick-scroll-reveal relative mt-8 max-w-3xl text-2xl font-semibold sm:text-4xl">Football intelligence. Made accessible.</p>
        <p className="relative mt-5 max-w-xl text-white/60">Computer vision, tactical scenarios, training support and football analytics in one platform.</p>
      </section>

      <section id="vision" data-scene className="relative min-h-[100vh] rounded-3xl bg-[#070d11] px-5 py-16 sm:px-10">
        <div className="sticky top-4 mx-auto max-w-5xl space-y-7">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[.35em] text-sky-400">Computer vision</p>
            <h2 className="mt-4 text-4xl font-black sm:text-6xl">See what <span className="text-sky-400">AI sees.</span></h2>
            <p className="mt-4 text-white/60">Compare original footage with the output of YOLO object detection.</p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/15 bg-black">
            <video key={showAI ? "ai" : "raw"} autoPlay loop muted playsInline
              src={showAI ? "/video-compare/annotated.mp4" : "/video-compare/original.mp4"}
              className="aspect-video w-full object-contain" />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button onClick={() => setShowAI(false)} className={`rounded-full px-6 py-3 text-sm font-bold ${!showAI ? "bg-white text-black" : "border border-white/25"}`}>Without AI</button>
            <button onClick={() => setShowAI(true)} className={`rounded-full px-6 py-3 text-sm font-bold ${showAI ? "bg-sky-400 text-black" : "border border-white/25"}`}>With AI</button>
            <Link href="/video-compare" className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-3 text-sm">Full comparison <ArrowRight size={15}/></Link>
          </div>
          <p className="text-center text-xs text-white/45">YOLO detects and labels objects; this is not individual player identification or validated tactical tracking.</p>
        </div>
      </section>

      <section id="tactics" data-scene className="relative flex min-h-[100vh] flex-col justify-center rounded-3xl bg-[#0c1513] px-5 py-16 sm:px-10">
        <div className="mx-auto w-full max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[.35em] text-emerald-400">Opponent intelligence</p>
          <h2 className="mt-4 max-w-4xl text-4xl font-black sm:text-6xl">A dangerous striker.<span className="block text-emerald-400">A smarter response.</span></h2>
          <p className="mt-5 max-w-2xl text-white/60">Select a threat profile to see how a defender might prepare. These are illustrative coaching scenarios.</p>
          <div className="mt-9 grid gap-6 lg:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-white/15 bg-[#12633e]">
              <svg viewBox="0 0 600 370" className="w-full" role="img" aria-label="Illustrative defensive pitch">
                <rect x="15" y="15" width="570" height="340" fill="none" stroke="white" strokeOpacity=".7" strokeWidth="2"/>
                <line x1="300" y1="15" x2="300" y2="355" stroke="white" strokeOpacity=".7"/>
                <circle cx="300" cy="185" r="52" fill="none" stroke="white" strokeOpacity=".7"/>
                <rect x="15" y="102" width="100" height="166" fill="none" stroke="white" strokeOpacity=".7"/>
                {[75,160,250,340].map((y,i) => <circle key={i} cx={155} cy={y} r="17" fill="#38bdf8" stroke="white" strokeWidth="2"/>)}
                {[95,185,275].map((y,i) => <circle key={i} cx={300} cy={y} r="15" fill="#38bdf8" stroke="white" strokeWidth="2"/>)}
                <circle cx="48" cy="185" r="15" fill="#38bdf8" stroke="white" strokeWidth="2"/>
                <circle cx={threat === "pace" ? 205 : threat === "aerial" ? 180 : 230} cy={threat === "aerial" ? 95 : threat === "dribbler" ? 280 : 185} r="36" fill="#f43f5e" fillOpacity=".18" stroke="#f43f5e" strokeDasharray="6 5"/>
                <circle cx={threat === "pace" ? 205 : threat === "aerial" ? 180 : 230} cy={threat === "aerial" ? 95 : threat === "dribbler" ? 280 : 185} r="16" fill="#f43f5e" stroke="white" strokeWidth="2"/>
              </svg>
              <p className="px-4 pb-4 text-center text-xs text-white/60">Blue: defending team · Red: opposing striker</p>
            </div>
            <div className="space-y-5">
              <label className="block text-sm font-semibold">Choose the striker's strength
                <select value={threat} onChange={e => setThreat(e.target.value)} className="mt-3 w-full rounded-xl border border-white/20 bg-[#152923] p-4 text-white">
                  <option value="pace">Explosive pace</option>
                  <option value="finisher">Elite finishing</option>
                  <option value="aerial">Aerial dominance</option>
                  <option value="dribbler">One-on-one dribbling</option>
                </select>
              </label>
              <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/5 p-6">
                <h3 className="mb-5 flex items-center gap-2 text-xl font-bold"><Shield size={22} className="text-emerald-400"/> Defensive response</h3>
                {counter.map((item,i) => <div key={item} className="mb-4 flex items-start gap-3 text-base"><span className="font-bold text-emerald-400">0{i+1}</span>{item}</div>)}
              </div>
              <Link href="/tactical" className="inline-flex items-center gap-2 rounded-full bg-emerald-400 px-6 py-3 font-bold text-black">Open Tactical Lab <ArrowRight size={17}/></Link>
            </div>
          </div>
        </div>
      </section>

      <section id="action" data-scene className="flex min-h-[90vh] flex-col justify-center rounded-3xl bg-[#0b101c] px-6 py-20 sm:px-12">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[.35em] text-sky-400">Beyond detection</p>
          <h2 className="mt-5 text-4xl font-black sm:text-7xl">From footage.<span className="block text-sky-400">To football decisions.</span></h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              {icon:Eye,title:"Observe",body:"Analyze football footage with computer vision.",href:"/video"},
              {icon:Brain,title:"Understand",body:"Explore tactical scenarios and decision options.",href:"/tactical"},
              {icon:Target,title:"Prepare",body:"Connect observations to training activities.",href:"/training"}
            ].map(item => <Link href={item.href} key={item.title} className="kick-scroll-reveal rounded-2xl border border-white/15 bg-white/5 p-7 transition hover:border-sky-400">
              <item.icon size={34} className="text-sky-400"/>
              <h3 className="mt-8 text-2xl font-bold">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/60">{item.body}</p>
              <ArrowRight className="mt-7 text-sky-400" size={20}/>
            </Link>)}
          </div>
        </div>
      </section>

      <section
        id="sequence"
        data-scene
        className="relative h-[280vh] rounded-3xl bg-[#06120f]"
      >
        <div className="sticky top-0 flex h-[85vh] flex-col items-center justify-center overflow-hidden px-4 sm:px-10">
          <div className="mb-5 text-center">
            <p className="text-xs font-bold uppercase tracking-[.35em] text-emerald-400">
              Tactical intelligence / Interactive sequence
            </p>
            <h2 className="mt-3 text-3xl font-black sm:text-5xl">
              Read the threat. <span className="text-emerald-400">Control the space.</span>
            </h2>
            <p className="mt-3 text-sm text-white/60">
              Scroll to advance the illustrated defensive scenario.
            </p>
          </div>

          <div className="relative w-full max-w-5xl overflow-hidden rounded-2xl border border-white/20 bg-[#12633e] shadow-2xl">
            <svg
              viewBox="0 0 900 480"
              className="w-full"
              role="img"
              aria-label="Animated tactical scenario with striker run and defenders repositioning"
            >
              <defs>
                <pattern id="pitchStripes" width="150" height="480" patternUnits="userSpaceOnUse">
                  <rect width="75" height="480" fill="#ffffff" fillOpacity=".035"/>
                </pattern>
              </defs>
              <rect width="900" height="480" fill="url(#pitchStripes)"/>
              <rect x="20" y="20" width="860" height="440" fill="none" stroke="white" strokeOpacity=".65" strokeWidth="2"/>
              <line x1="450" y1="20" x2="450" y2="460" stroke="white" strokeOpacity=".6" strokeWidth="2"/>
              <circle cx="450" cy="240" r="72" fill="none" stroke="white" strokeOpacity=".6" strokeWidth="2"/>
              <rect x="20" y="120" width="150" height="240" fill="none" stroke="white" strokeOpacity=".6" strokeWidth="2"/>
              <rect x="730" y="120" width="150" height="240" fill="none" stroke="white" strokeOpacity=".6" strokeWidth="2"/>

              <path
                d="M 700 240 Q 540 100 350 240"
                fill="none"
                stroke="#fda4af"
                strokeWidth="5"
                strokeDasharray="12 10"
                opacity={Math.min(1, tacticalProgress * 4)}
              />

              {[110,230,350].map((y, i) => {
                const shift = Math.max(0, Math.min(1, (tacticalProgress - .35) * 3));
                return (
                  <g key={i} transform={`translate(${300 - shift * 65}, ${y + (i - 1) * shift * 25})`}>
                    <circle r="23" fill="#38bdf8" stroke="white" strokeWidth="3"/>
                    <text y="6" textAnchor="middle" fill="#06120f" fontWeight="bold" fontSize="17">
                      D{i + 1}
                    </text>
                  </g>
                );
              })}

              <g transform={`translate(${700 - tacticalProgress * 350}, ${240 - Math.sin(tacticalProgress * Math.PI) * 90})`}>
                <circle r="30" fill="#f43f5e" fillOpacity=".2" stroke="#fda4af" strokeWidth="2" strokeDasharray="5 5"/>
                <circle r="21" fill="#f43f5e" stroke="white" strokeWidth="3"/>
                <text y="6" textAnchor="middle" fill="white" fontWeight="bold" fontSize="16">ST</text>
              </g>

              {tacticalProgress > .55 && (
                <path
                  d="M 235 120 L 235 350"
                  stroke="#86efac"
                  strokeWidth="7"
                  strokeLinecap="round"
                  opacity={Math.min(1, (tacticalProgress - .55) * 3)}
                />
              )}
            </svg>
          </div>

          <div className="mt-7 max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[.25em] text-emerald-400">
              {tacticalProgress < .3 ? "Phase 01 / Identify" : tacticalProgress < .65 ? "Phase 02 / Respond" : "Phase 03 / Protect"}
            </p>
            <h3 className="mt-2 text-2xl font-bold sm:text-3xl">
              {tacticalProgress < .3
                ? "The striker attacks the space."
                : tacticalProgress < .65
                ? "The defensive line adjusts."
                : "The passing lane is protected."}
            </h3>
            <p className="mt-3 text-sm text-white/55">
              Illustrative tactical animation, not movement reconstructed from match footage.
            </p>
          </div>

          <div className="mt-6 h-1.5 w-full max-w-lg overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-emerald-400" style={{width: `${tacticalProgress * 100}%`}}/>
          </div>
        </div>
      </section>



      <section id="explore" data-scene className="relative bg-[#070d12] py-24">
        <div className="px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[.4em] text-emerald-400">
            The complete KICKAI experience
          </p>
          <h2 className="mx-auto mt-6 max-w-5xl text-5xl font-black sm:text-7xl">
            One journey. <span className="text-emerald-400">Every tool.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/60">
            Explore the actual KICKAI website without leaving the cinematic presentation.
          </p>
        </div>

        {[
          ["01", "Command Center", "Your football intelligence dashboard.", "/"],
          ["02", "Tactical Lab", "Analyze opponents and explore defensive decisions.", "/tactical"],
          ["03", "Match Simulator", "Explore match scenarios and tactical outcomes.", "/match"],
          ["04", "Training Lab", "Turn observations into football training.", "/training"],
          ["05", "Player Evaluation", "Explore player assessment tools.", "/player"],
          ["06", "Session Logs", "Review training sessions and records.", "/sessions"],
          ["07", "Video Analysis", "Experience football computer vision.", "/video"],
          ["08", "AI Batch Intelligence", "Explore batch analysis workflows.", "/batch-analysis"],
          ["09", "Before vs After AI", "Compare original and AI-annotated footage.", "/video-compare"],
          ["10", "Automatic Match Prediction", "Explore match prediction tools.", "/auto-predict"],
          ["11", "Football Wiki", "Discover players and football formations.", "/wiki"],
        ].map(([number, title, description, href]) => (
          <div key={href} className="relative flex min-h-[115vh] flex-col justify-center px-4 py-16 sm:px-8">
            <div className="kick-scroll-reveal mx-auto mb-10 w-full max-w-6xl">
              <p className="text-xs font-bold uppercase tracking-[.3em] text-emerald-400">
                Chapter {number} / KICKAI
              </p>
              <h3 className="mt-4 text-4xl font-black sm:text-6xl">{title}</h3>
              <p className="mt-4 text-lg text-white/55">{description}</p>
            </div>

            <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-3xl border border-emerald-400/25 bg-[#0c1515] shadow-[0_30px_100px_rgba(0,0,0,.5)]">
              <div className="flex items-center justify-between border-b border-white/10 bg-[#101b1c] px-5 py-3">
                <div className="flex gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400/70"/>
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70"/>
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400/70"/>
                </div>
                <span className="text-xs text-white/45">KICKAI / {title}</span>
                <span className="text-xs font-bold text-emerald-400">LIVE</span>
              </div>

              <iframe
                title={`KICKAI ${title}`}
                src={href}
                loading="lazy"
                className="h-[min(760px,78vh)] w-full border-0 bg-[var(--kick-bg)]"
              />
            </div>

            <p className="mt-5 text-center text-xs text-white/40">
              Interact with the tool above, then continue scrolling to the next chapter.
            </p>
          </div>
        ))}
      </section>

      <div id="battle" data-scene className="scroll-mt-4">
        <TacticalBattle />
      </div>

      <div id="scouting" data-scene className="scroll-mt-4">
        <ScoutingReveal />
      </div>

      <div id="command" data-scene className="scroll-mt-4">
        <MatchCommandCenter />
      </div>

      <section id="impact" data-scene className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden rounded-3xl bg-[#071b17] px-6 py-20 text-center">
        <div className="absolute h-[450px] w-[450px] rounded-full bg-emerald-400/15 blur-[130px]"/>
        <Trophy size={48} className="relative mb-8 text-emerald-400"/>
        <p className="relative text-xs font-bold uppercase tracking-[.35em] text-emerald-400">Why KICKAI exists</p>
        <h2 className="relative mt-6 max-w-5xl text-4xl font-black leading-tight sm:text-7xl">Elite ideas.<span className="block text-emerald-400">Accessible tools.</span></h2>
        <p className="relative mt-8 max-w-2xl text-lg leading-relaxed text-white/65">
          KICKAI explores how AI-assisted football analysis could become more accessible to students, grassroots teams and smaller academies.
        </p>
        <p className="relative mt-5 text-sm text-white/45">A working prototype — not a replacement for professional scouting systems.</p>
        <div className="relative mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/" className="rounded-full bg-emerald-400 px-7 py-4 font-bold text-black">Explore KICKAI <ArrowRight size={16} className="ml-2 inline"/></Link>
          <button onClick={() => goTo(0)} className="rounded-full border border-white/30 px-7 py-4 font-semibold">Replay presentation</button>
        </div>
      </section>

      <div className="py-6 text-center text-xs text-[var(--kick-muted)]">KICKAI · Scroll through the story or use the right-side scene navigation.</div>
    </div>
  );
}
