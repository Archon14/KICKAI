"use client";

import React, { useState } from "react";
import { Download, FileText } from "lucide-react";
import { exportReport } from "@/lib/api";

export default function ExportPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("tactics");

  async function handleExport() {
    setLoading(true);
    try {
      const res = await exportReport(type);
      setData(res);
    } catch (e: any) {
      setData({ error: e.message || "Export failed" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-zinc-800/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">Export Reports</h1>
          <p className="text-xs text-zinc-400">Generate structured JSON reports from telemetry.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950/30 text-emerald-400 border border-emerald-500/20">
          <FileText size={12} /> Export
        </span>
      </div>

      <div className="rounded-lg bg-zinc-900/40 border border-zinc-800/80 p-6 space-y-4">
        <label className="block text-xs font-medium text-zinc-300">Report type</label>
        <input
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600 font-mono"
        />
        <button
          onClick={handleExport}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded bg-zinc-100 hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-900 font-semibold text-xs transition-colors cursor-pointer"
        >
          <Download size={14} /> {loading ? "Exporting..." : "Export"}
        </button>
      </div>

      {data && (
        <div className="rounded-lg bg-zinc-950/60 border border-zinc-800/60 p-4 overflow-x-auto">
          <pre className="text-[11px] font-mono text-zinc-300 whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
