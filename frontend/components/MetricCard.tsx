"use client";

import React from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    positive?: boolean;
  };
  accentColor?: "emerald" | "blue" | "danger" | "amber" | "purple";
  badge?: string;
}

export default function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  badge,
}: MetricCardProps) {
  return (
    <div className="rounded-lg bg-zinc-900/40 border border-zinc-800/80 p-4 transition-colors hover:border-zinc-700/70">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[11px] font-medium tracking-wide uppercase text-zinc-400">
            {title}
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-zinc-100 font-mono">
              {value}
            </span>
            {badge && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-zinc-400 line-clamp-1">{subtitle}</p>
          )}
        </div>

        {icon && (
          <div className="p-2 rounded-md bg-zinc-850/80 border border-zinc-800 text-zinc-400 flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex items-center text-[11px]">
          <span
            className={`font-medium mr-1.5 ${
              trend.positive ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {trend.positive ? "↑" : "↓"} {trend.value}
          </span>
          <span className="text-zinc-400">vs benchmark</span>
        </div>
      )}
    </div>
  );
}
