"use client";

import React from "react";
import Link from "next/link";
import MockBadge from "@/components/MockBadge";
import MetricCard from "@/components/MetricCard";
import PitchCanvas from "@/components/PitchCanvas";
import {
  Activity,
  ArrowRight,
  Award,
  BarChart3,
  Check,
  ClipboardList,
  Compass,
  Cpu,
  Flame,
  Zap,
} from "lucide-react";

export default function DashboardPage() {
  const modules = [
    {
      title: "Tactical Lab",
      href: "/tactical",
      description: "Decompose attacking states with physics-grounded Expected Value calculations and coach overrides.",
      icon: Compass,
    },
    {
      title: "Match Simulator",
      href: "/match",
      description: "10,000 Monte Carlo Poisson-logistic draws with calibrated Elo ratings and scoreline probability grids.",
      icon: Activity,
    },
    {
      title: "Training Lab",
      href: "/training",
      description: "Adaptive training drills dynamically adjusting to biomechanical and perceptual failure modes.",
      icon: Flame,
    },
    {
      title: "Player Evaluation",
      href: "/player",
      description: "Multi-dimensional radar evaluation, physical fatigue loads, and individual tactical fits.",
      icon: Award,
    },
    {
      title: "Session Logs",
      href: "/sessions",
      description: "Audit trail logging coach challenges, overrides, and model provenance in real time.",
      icon: ClipboardList,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-zinc-800/80">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100">
              Football Intelligence
            </h1>
            <MockBadge />
          </div>
          <p className="text-xs sm:text-sm text-zinc-400">
            Physics-grounded analytics and tactical simulation
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/tactical"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-semibold text-xs transition-colors"
          >
            Tactical Lab
            <ArrowRight size={13} />
          </Link>
          <Link
            href="/match"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-850 hover:bg-zinc-800 text-zinc-300 border border-zinc-750 text-xs font-medium transition-colors"
          >
            Simulate Match
          </Link>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <MetricCard
          title="Monte Carlo Runs"
          value="10,000"
          subtitle="Precision draws per match"
          icon={<Cpu size={16} className="text-zinc-400" />}
          trend={{ value: "99.8% convergence", positive: true }}
        />
        <MetricCard
          title="Pitch Dimensions"
          value="105m × 68m"
          subtitle="Calibrated FIFA standard"
          icon={<Compass size={16} className="text-zinc-400" />}
        />
        <MetricCard
          title="xG Model"
          value="Logistic"
          subtitle="Physics angle & distance"
          icon={<BarChart3 size={16} className="text-zinc-400" />}
          trend={{ value: "0.08 Brier score", positive: true }}
        />
        <MetricCard
          title="Formations"
          value="6 Shapes"
          subtitle="Dynamic shape fit scoring"
          icon={<Zap size={16} className="text-zinc-400" />}
        />
      </div>

      {/* Pitch Canvas & Core Principles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-2">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-sm font-semibold text-zinc-200">
              Attacking Third Overview
            </h2>
            <Link
              href="/tactical"
              className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Open Full Lab →
            </Link>
          </div>
          <PitchCanvas />
        </div>

        {/* Core Principles */}
        <div className="space-y-3">
          <div className="rounded-lg bg-zinc-900/40 border border-zinc-800/80 p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              System Architecture
            </h3>
            <ul className="space-y-2.5 text-xs text-zinc-300">
              <li className="flex items-start gap-2">
                <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-zinc-200">Physics Tracking:</strong> Player velocity, acceleration bounds, ball drag.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-zinc-200">Coach in the Loop:</strong> AI suggests options, the coach decides and logs rationale.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-zinc-200">Football Only:</strong> Solely focused on 11v11 association football analytics.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-zinc-200">Deterministic Fallback:</strong> Zero-token deterministic execution for high speed.
                </span>
              </li>
            </ul>
          </div>

          <div className="rounded-lg bg-zinc-900/40 border border-zinc-800/80 p-4">
            <span className="text-[11px] text-zinc-400 uppercase tracking-wide">
              Active Tactical Scheme
            </span>
            <div className="text-base font-semibold text-zinc-100 mt-1">
              Progressive 4-3-3
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Half-space overloads against mid-to-low defensive block.
            </p>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-200">
            Analytics Modules
          </h2>
          <p className="text-xs text-zinc-400">
            Direct access to tactical laboratories and evaluation engines
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.href}
                href={mod.href}
                className="group rounded-lg bg-zinc-900/40 border border-zinc-800/80 p-4 transition-colors hover:border-zinc-700/80 flex flex-col justify-between"
              >
                <div>
                  <div className="w-8 h-8 rounded-md bg-zinc-850 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-zinc-200 transition-colors mb-3">
                    <Icon size={16} />
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-100">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    {mod.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors">
                  <span>Enter</span>
                  <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
