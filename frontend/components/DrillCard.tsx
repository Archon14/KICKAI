"use client";

import React from "react";
import type { DrillModel } from "@/lib/types";
import { CheckCircle2, ClipboardList, Eye, Lightbulb } from "lucide-react";

type Props = {
  drill: DrillModel;
  weakness?: string;
  feedback?: string;
  nextDifficulty?: number;
};

const instructions: Record<string, string[]> = {
  "combination play": [
    "Set up three players in a triangle.",
    "Pass the ball quickly between teammates.",
    "Move into open space after each pass.",
    "Complete the sequence within the decision time."
  ],
  "scan-before-receive": [
    "Position yourself between two passing targets.",
    "Look over both shoulders before receiving.",
    "Receive the ball with an open body position.",
    "Pass toward the available target."
  ],
  "first touch under pressure": [
    "Receive a pass from your teammate.",
    "Control the ball with your first touch.",
    "Keep the ball close while avoiding pressure.",
    "Pass accurately to the next player."
  ],
  "open receiving": [
    "Stand at an angle to the passer.",
    "Open your body toward the playing field.",
    "Receive using your back foot.",
    "Turn and pass toward the next target."
  ],
  "pressing trigger": [
    "Start in your defensive position.",
    "Watch for a poor touch from the opponent.",
    "Close down the opponent quickly.",
    "Work with teammates to recover possession."
  ],
  "weighted finishing": [
    "Place a target inside the goal.",
    "Approach the ball with control.",
    "Adjust shooting power for accuracy.",
    "Repeat while aiming at different targets."
  ],
  "break the line": [
    "Position a teammate beyond a defensive line.",
    "Identify the passing gap.",
    "Pass firmly enough to reach your teammate.",
    "Move forward to support the next action."
  ]
};

export default function DrillCard({
  drill,
  weakness,
  feedback,
}: Props) {
  const steps = instructions[drill.focus?.toLowerCase()] || [
    "Set up a suitable training area.",
    "Practice the skill shown in the training focus.",
    "Follow the visual coaching cues.",
    "Repeat the exercise and evaluate your performance."
  ];

  const friendly = (value: string) =>
    value.replace(/[_-]/g, " ").replace(/\\b\\w/g, c => c.toUpperCase());

  return (
    <div className="rounded-xl border border-[var(--kick-border)] bg-[var(--kick-card)] p-5 space-y-5">
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--kick-secondary)]">
            Your Recommended Exercise
          </p>
          <h3 className="text-xl font-bold text-[var(--kick-text)] mt-1">
            {friendly(drill.name)}
          </h3>
          <p className="text-sm text-[var(--kick-muted)] mt-1">
            Focus: {friendly(drill.focus)}
          </p>
        </div>
        <span className="rounded-lg bg-[var(--kick-bg)] border border-[var(--kick-primary)] px-3 py-2 text-sm font-semibold text-[var(--kick-secondary)]">
          {drill.repetitions} Repetitions
        </span>
      </div>

      <div className="space-y-3">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-[var(--kick-text)]">
          <ClipboardList size={17} className="text-[var(--kick-secondary)]" />
          How to Perform This Drill
        </h4>
        <ol className="space-y-2">
          {steps.map((step, index) => (
            <li key={index} className="flex items-start gap-3 text-sm text-[var(--kick-text)]">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--kick-bg)] text-xs font-bold text-[var(--kick-secondary)]">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {drill.visual_cues?.length > 0 && (
        <div className="space-y-2">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-[var(--kick-text)]">
            <Eye size={17} className="text-[var(--kick-secondary)]" />
            Coaching Cues
          </h4>
          <div className="flex flex-wrap gap-2">
            {drill.visual_cues.map((cue, index) => (
              <span key={index} className="rounded-md border border-[var(--kick-border)] bg-[var(--kick-bg)] px-3 py-1.5 text-xs text-[var(--kick-text)]">
                {friendly(cue)}
              </span>
            ))}
          </div>
        </div>
      )}

      {feedback && (
        <div className="rounded-lg border border-[var(--kick-border)] bg-[var(--kick-bg)] p-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-[var(--kick-secondary)]">
            <Lightbulb size={17} />
            Coach Feedback
          </h4>
          <p className="mt-2 text-sm leading-relaxed text-[var(--kick-text)]">{feedback}</p>
        </div>
      )}

      {weakness && (
        <div className="flex items-start gap-2 text-xs text-[var(--kick-muted)]">
          <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
          <span>Training goal: {friendly(weakness)}</span>
        </div>
      )}
    </div>
  );
}
