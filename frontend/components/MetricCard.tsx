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
    <div className="rounded-lg bg-[var(--kick-card)] border border-[var(--kick-border)] p-4 transition-colors hover:border-[var(--kick-primary)]">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[11px] font-medium tracking-wide uppercase text-[var(--kick-muted)]">
            {title}
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-[var(--kick-text)] font-mono">
              {value}
            </span>
            {badge && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--kick-bg)] text-[var(--kick-text)] border border-[var(--kick-border)]">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-[var(--kick-muted)] line-clamp-1">{subtitle}</p>
          )}
        </div>

        {icon && (
          <div className="p-2 rounded-md bg-[var(--kick-bg)] border border-[var(--kick-border)] text-[var(--kick-muted)] flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-2.5 pt-2 border-t border-[var(--kick-border)] flex items-center text-[11px]">
          <span
            className={`font-medium mr-1.5 ${
              trend.positive ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {trend.positive ? "↑" : "↓"} {trend.value}
          </span>
          <span className="text-[var(--kick-muted)]">vs benchmark</span>
        </div>
      )}
    </div>
  );
}
