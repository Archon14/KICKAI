"use client";

import React, { useState } from "react";
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
} from "lucide-react";

export default function NavSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Tactical Lab", href: "/tactical", icon: Compass },
    { label: "Match Simulator", href: "/match", icon: Activity },
    { label: "Training Lab", href: "/training", icon: Flame },
    { label: "Player Evaluation", href: "/player", icon: Award },
    { label: "Session Logs", href: "/sessions", icon: ClipboardList },
    { label: "Video Analysis", href: "/video", icon: VideoIcon },
    { label: "AI Face", href: "/face", icon: Mic },
  ];

  return (
    <aside
      className={`relative z-40 flex flex-col h-screen bg-[#09090b] border-r border-zinc-800 transition-all duration-200 ease-out shrink-0 select-none ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-zinc-800/80">
        <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-xs font-bold text-white shrink-0">
            K
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-tight text-zinc-100">
                Kick <span className="text-zinc-400 font-normal">AI</span>
              </span>
            </div>
          )}
        </Link>

        {/* Toggle Collapse */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Status Bar */}
      {!collapsed && (
        <div className="px-4 py-2.5 border-b border-zinc-800/60 flex items-center justify-between">
          <span className="text-[11px] text-zinc-400">System</span>
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
                  ? "bg-zinc-800 text-zinc-100 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/60"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                size={16}
                className={`shrink-0 transition-colors ${
                  isActive ? "text-emerald-400" : "text-zinc-400 group-hover:text-zinc-300"
                }`}
              />

              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Minimal Footer */}
      <div className="p-3 border-t border-zinc-800/80 text-[11px] text-zinc-400">
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <span>Football 105×68m</span>
            <span className="font-mono text-zinc-400">v1.0</span>
          </div>
        ) : (
          <div className="flex justify-center text-zinc-400">•</div>
        )}
      </div>
    </aside>
  );
}
