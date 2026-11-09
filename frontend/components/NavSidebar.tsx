"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import MockBadge from "./MockBadge";
import {
  Activity,
  Award,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Compass,
  Flame,
  LayoutDashboard,
  Mic,
  VideoIcon,
  Zap,
  Book,
} from "lucide-react";

export default function NavSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState("emerald");

  useEffect(() => {
    const saved = localStorage.getItem("kickai-theme");
    const selected = ["emerald", "electric", "purple", "crimson", "ocean", "gold", "lime"].includes(saved || "")
      ? saved!
      : "emerald";
    setTheme(selected);
    document.documentElement.setAttribute("data-theme", selected);
    document.documentElement.classList.add("dark");
  }, []);

  function changeTheme(selected: string) {
    setTheme(selected);
    localStorage.setItem("kickai-theme", selected);
    document.documentElement.setAttribute("data-theme", selected);
    document.documentElement.classList.add("dark");
  }

  const navItems = [
    { label: "Cinematic Presentation", href: "/presentation", icon: Zap },
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Tactical Lab", href: "/tactical", icon: Compass },
    { label: "Match Simulator", href: "/match", icon: Activity },
    { label: "Training Lab", href: "/training", icon: Flame },
    { label: "Player Evaluation", href: "/player", icon: Award },
    { label: "Session Logs", href: "/sessions", icon: ClipboardList },
    { label: "Video Analysis", href: "/video", icon: VideoIcon },
    { label: "AI Batch Intelligence", href: "/batch-analysis", icon: Activity },
    { label: "Before vs After AI", href: "/video-compare", icon: VideoIcon },
    { label: "Automatic Match Prediction", href: "/auto-predict", icon: Zap },
    { label: "Wiki", href: "/wiki", icon: Book },
  ];

  return (
    <aside
      className={`relative z-40 flex flex-col h-screen bg-[var(--kick-bg)] border-r border-[var(--kick-border)] transition-all duration-200 ease-out shrink-0 select-none ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-[var(--kick-border)]">
        <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-7 h-7 rounded-md bg-[var(--kick-primary)] border border-[var(--kick-border)] flex items-center justify-center text-xs font-bold text-white shrink-0">
            K
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-tight text-[var(--kick-text)]">
                Kick <span className="text-[var(--kick-muted)] font-normal">AI</span>
              </span>
            </div>
          )}
        </Link>

        {/* Toggle Collapse */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md text-[var(--kick-muted)] hover:text-[var(--kick-text)] hover:bg-[var(--kick-card)]/60 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Status Bar */}
      {!collapsed && (
        <div className="px-4 py-2.5 border-b border-[var(--kick-border)] flex items-center justify-between">
          <span className="text-[11px] text-[var(--kick-muted)]">System</span>
          <MockBadge />
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? "bg-[var(--kick-card)] text-[var(--kick-text)] font-semibold"
                  : "text-[var(--kick-muted)] hover:text-[var(--kick-text)] hover:bg-[var(--kick-card)]"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                size={16}
                className={`shrink-0 transition-colors ${
                  isActive ? "text-[var(--kick-primary)]" : "text-[var(--kick-muted)] group-hover:text-[var(--kick-text)]"
                }`}
              />

              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Theme Selector */}
      {!collapsed && (
        <div className="px-3 py-3 border-t border-[var(--kick-border)]">
          <label
            htmlFor="kickai-theme"
            className="block mb-2 text-xs font-semibold text-[var(--kick-muted)]"
          >
            Website Theme
          </label>
          <select
            id="kickai-theme"
            value={theme}
            onChange={(e) => changeTheme(e.target.value)}
            className="w-full rounded-lg border border-[var(--kick-border)] bg-[var(--kick-card)] text-[var(--kick-text)] px-3 py-2 text-xs outline-none focus:border-[var(--kick-primary)]"
          >
            <option value="emerald">💚 Emerald Football</option>
            <option value="electric">💙 Electric Blue</option>
            <option value="purple">💜 Cyber Purple</option>
            <option value="crimson">❤️ Crimson Elite</option>
            <option value="ocean">🌊 Ocean Teal</option>
            <option value="gold">🏆 Royal Gold</option>
            <option value="lime">⚡ Neon Lime</option>
          </select>
        </div>
      )}

      {/* Minimal Footer */}
      <div className="p-3 border-t border-[var(--kick-border)] text-[11px] text-[var(--kick-muted)]">
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <span>Football 105×68m</span>
            <span className="font-mono text-[var(--kick-muted)]">v1.0</span>
          </div>
        ) : (
          <div className="flex justify-center text-[var(--kick-muted)]">•</div>
        )}
      </div>
    </aside>
  );
}
