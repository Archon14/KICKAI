"use client";

import React, { useEffect, useState } from "react";
import LoadingPitch from "@/components/LoadingPitch";
import { getCoachHistory } from "@/lib/api";
import type { CoachLogEntry } from "@/lib/types";
import { RefreshCw, Search, Download } from "lucide-react";

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
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--kick-bg)] text-[var(--kick-primary)] border border-[var(--kick-border)]">
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
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--kick-bg)] text-[var(--kick-text)] border border-[var(--kick-border)]">
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

  function downloadLogs(format: "csv" | "json") {
    if (filteredLogs.length === 0) return;

    let content: string;
    let mime: string;

    if (format === "json") {
      content = JSON.stringify(filteredLogs, null, 2);
      mime = "application/json";
    } else {
      const headers = ["Timestamp", "Action", "Target", "Rationale", "Origin"];
      const escapeCsv = (value: unknown) =>
        `"${String(value ?? "").replace(/"/g, '""')}"`;

      const rows = filteredLogs.map((log) => [
        log.timestamp,
        log.action,
        log.option_id ?? "",
        log.note,
        log.provenance?.origin || log.provenance?.decision_rule || "coach_api",
      ]);

      content = [headers, ...rows]
        .map((row) => row.map(escapeCsv).join(","))
        .join("\\r\\n");
      mime = "text/csv;charset=utf-8";
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `kickai-session-logs-${new Date().toISOString().slice(0, 10)}.${format}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[var(--kick-border)]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--kick-text)]">
            Coach Override Audit Trail
          </h1>
          <p className="text-xs text-[var(--kick-muted)] mt-0.5">
            Tamper-evident logs recording tactical overrides and model challenges
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[var(--kick-card)] hover:brightness-110 text-[var(--kick-text)] text-xs border border-[var(--kick-border)] transition-colors cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={() => downloadLogs("csv")}
            disabled={loading || filteredLogs.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[var(--kick-primary)] text-[var(--kick-bg)] text-xs font-semibold disabled:opacity-40 cursor-pointer"
          >
            <Download size={13} /> CSV
          </button>
          <button
            onClick={() => downloadLogs("json")}
            disabled={loading || filteredLogs.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[var(--kick-card)] text-[var(--kick-text)] border border-[var(--kick-border)] text-xs disabled:opacity-40 cursor-pointer"
          >
            <Download size={13} /> JSON
          </button>
          <span className="text-xs font-mono text-[var(--kick-muted)] bg-[var(--kick-card)] border border-[var(--kick-border)] px-2 py-1 rounded">
            {logs.length} Entries
          </span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-2.5 top-2.5 text-[var(--kick-muted)]" />
          <input
            type="text"
            placeholder="Search notes, options..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--kick-card)] border border-[var(--kick-border)] rounded pl-8 pr-3 py-1.5 text-xs text-[var(--kick-text)] placeholder:text-[var(--kick-muted)] focus:outline-none focus:border-[var(--kick-primary)]"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {["all", "accept", "reject", "modify", "ask why"].map((act) => (
            <button
              key={act}
              onClick={() => setFilterAction(act)}
              className={`px-2.5 py-1 rounded text-xs capitalize transition-colors ${
                filterAction === act
                  ? "bg-[var(--kick-primary)] text-[#07140f] font-semibold"
                  : "text-[var(--kick-muted)] hover:text-[var(--kick-text)]"
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
        <div className="rounded-lg bg-[var(--kick-card)] border border-[var(--kick-border)] p-8 text-center text-xs text-[var(--kick-muted)]">
          No session log entries matched your filter.
        </div>
      ) : (
        <div className="rounded-lg bg-[var(--kick-card)] border border-[var(--kick-border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--kick-border)] text-[var(--kick-muted)] uppercase tracking-wide font-medium text-[11px]">
                  <th className="py-2.5 px-4 font-normal">Timestamp</th>
                  <th className="py-2.5 px-4 font-normal">Action</th>
                  <th className="py-2.5 px-4 font-normal">Target</th>
                  <th className="py-2.5 px-4 font-normal">Rationale</th>
                  <th className="py-2.5 px-4 font-normal">Origin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--kick-border)] text-[var(--kick-text)]">
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
                      className="hover:bg-[var(--kick-card)] transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-[var(--kick-muted)] whitespace-nowrap text-[11px]">
                        {dateStr}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>

                      <td className="py-3 px-4 font-mono text-[var(--kick-text)] whitespace-nowrap">
                        {log.option_id ? log.option_id : "—"}
                      </td>

                      <td className="py-3 px-4 max-w-md">
                        <span className="text-[var(--kick-text)] line-clamp-1">{log.note}</span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-[var(--kick-muted)]">
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
