"use client";

import React, { useEffect, useState } from "react";
import LoadingPitch from "@/components/LoadingPitch";
import { getCoachHistory } from "@/lib/api";
import type { CoachLogEntry } from "@/lib/types";
import { RefreshCw, Search } from "lucide-react";

export default function SessionLogsPage() {
  const [logs, setLogs] = useState<CoachLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterAction, setFilterAction] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    setLoading(true);
    try {
      const data = await getCoachHistory();
      setLogs(data.history || []);
    } catch (err) {
      console.error("Failed to fetch coach logs:", err);
    } finally {
      setLoading(false);
    }
  }

  const getActionBadge = (action: string) => {
    switch (action.toLowerCase()) {
      case "accept":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950/40 text-emerald-400 border border-emerald-500/20">
            Accept
          </span>
        );
      case "reject":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-950/40 text-rose-400 border border-rose-500/20">
            Reject
          </span>
        );
      case "modify":
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-sky-950/40 text-sky-400 border border-sky-500/20">
            Modify
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/60">
            {action}
          </span>
        );
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesAction =
      filterAction === "all" ||
      log.action.toLowerCase() === filterAction.toLowerCase();
    const matchesQuery =
      searchQuery === "" ||
      log.note.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.option_id && log.option_id.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesAction && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-zinc-800/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100">
            Coach Override Audit Trail
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Tamper-evident logs recording tactical overrides and model challenges
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-zinc-850 hover:bg-zinc-800 text-zinc-300 text-xs border border-zinc-750 transition-colors cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <span className="text-xs font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded">
            {logs.length} Entries
          </span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-2.5 top-2.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search notes, options..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900/60 border border-zinc-800 rounded pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {["all", "accept", "reject", "modify", "ask why"].map((act) => (
            <button
              key={act}
              onClick={() => setFilterAction(act)}
              className={`px-2.5 py-1 rounded text-xs capitalize transition-colors ${
                filterAction === act
                  ? "bg-zinc-200 text-zinc-950 font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {act}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingPitch label="Loading audit logs..." />
      ) : filteredLogs.length === 0 ? (
        <div className="rounded-lg bg-zinc-900/40 border border-zinc-800 p-8 text-center text-xs text-zinc-400">
          No session log entries matched your filter.
        </div>
      ) : (
        <div className="rounded-lg bg-zinc-900/40 border border-zinc-800/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 uppercase tracking-wide font-medium text-[11px]">
                  <th className="py-2.5 px-4 font-normal">Timestamp</th>
                  <th className="py-2.5 px-4 font-normal">Action</th>
                  <th className="py-2.5 px-4 font-normal">Target</th>
                  <th className="py-2.5 px-4 font-normal">Rationale</th>
                  <th className="py-2.5 px-4 font-normal">Origin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {filteredLogs.map((log) => {
                  const dateStr = new Date(log.timestamp).toLocaleString("en-GB", {
                    dateStyle: "short",
                    timeStyle: "medium",
                  });
                  const origin =
                    log.provenance?.origin || log.provenance?.decision_rule || "coach_api";

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-zinc-850/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-zinc-400 whitespace-nowrap text-[11px]">
                        {dateStr}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>

                      <td className="py-3 px-4 font-mono text-zinc-300 whitespace-nowrap">
                        {log.option_id ? log.option_id : "—"}
                      </td>

                      <td className="py-3 px-4 max-w-md">
                        <span className="text-zinc-200 line-clamp-1">{log.note}</span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-zinc-400">
                        {origin}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
