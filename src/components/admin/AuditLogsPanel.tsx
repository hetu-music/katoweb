"use client";

import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface AuditLog {
  id: string;
  table_name: string;
  action_type: string;
  user_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_at: string | null;
}

interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
}

const ACTION_COLORS: Record<string, string> = {
  INSERT: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10",
  UPDATE: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10",
  DELETE: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10",
};

function shortId(id: string | null): string {
  if (!id) return "—";
  return id.slice(0, 8) + "…";
}

function formatDate(ts: string | null): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function AuditLogsPanel() {
  const [data, setData] = useState<AuditLogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadPage = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/audit-logs?page=${p}`);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error((d as { error?: string }).error ?? "加载失败");
      }
      const json: AuditLogsResponse = await res.json();
      setData(json);
      setPage(p);
      setExpandedId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1;

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={28} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-slate-500">
        <p className="text-sm">{error}</p>
        <button
          onClick={() => loadPage(page)}
          className="flex items-center gap-1.5 text-xs font-bold text-blue-500 hover:text-blue-600"
        >
          <RefreshCw size={13} />
          重试
        </button>
      </div>
    );
  }

  const logs = data?.logs ?? [];

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
          共 {data?.total ?? 0} 条记录
        </span>
        <button
          onClick={() => loadPage(page)}
          disabled={loading}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
          title="刷新"
        >
          <RefreshCw size={14} className={cn(loading && "animate-spin")} />
        </button>
      </div>

      {/* Log rows */}
      {logs.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
          暂无日志记录
        </div>
      ) : (
        <div className="space-y-1.5">
          {logs.map((log) => {
            const isExpanded = expandedId === log.id;
            const actionColor =
              ACTION_COLORS[log.action_type.toUpperCase()] ??
              "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800";
            const hasData = log.old_data || log.new_data;

            return (
              <div
                key={log.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden"
              >
                {/* Row */}
                <div className="flex items-center gap-3 px-4 py-2.5 text-xs">
                  {/* Action badge */}
                  <span
                    className={cn(
                      "shrink-0 px-2 py-0.5 rounded font-bold uppercase tracking-wide text-[10px]",
                      actionColor,
                    )}
                  >
                    {log.action_type}
                  </span>

                  {/* Table name */}
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-200 shrink-0">
                    {log.table_name}
                  </span>

                  {/* User */}
                  <span
                    className="text-slate-400 font-mono truncate"
                    title={log.user_id ?? undefined}
                  >
                    {shortId(log.user_id)}
                  </span>

                  {/* Timestamp */}
                  <span className="text-slate-400 ml-auto shrink-0">
                    {formatDate(log.changed_at)}
                  </span>

                  {/* Expand toggle */}
                  {hasData && (
                    <button
                      onClick={() =>
                        setExpandedId((prev) =>
                          prev === log.id ? null : log.id,
                        )
                      }
                      className="shrink-0 p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp size={13} />
                      ) : (
                        <ChevronDown size={13} />
                      )}
                    </button>
                  )}
                </div>

                {/* Expanded JSON diff */}
                {isExpanded && hasData && (
                  <div className="border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-px bg-slate-100 dark:bg-slate-800 animate-in fade-in slide-in-from-top-1 duration-150">
                    {log.old_data !== null && (
                      <div className="bg-white dark:bg-slate-900 p-3 space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-rose-500">
                          旧数据
                        </p>
                        <pre className="text-[11px] text-slate-600 dark:text-slate-400 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
                          {JSON.stringify(log.old_data, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.new_data !== null && (
                      <div className="bg-white dark:bg-slate-900 p-3 space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-500">
                          新数据
                        </p>
                        <pre className="text-[11px] text-slate-600 dark:text-slate-400 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
                          {JSON.stringify(log.new_data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => loadPage(page - 1)}
            disabled={page <= 1 || loading}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft size={14} />
          </button>

          <span className="text-xs font-bold text-slate-500 min-w-20 text-center">
            {page} / {totalPages}
          </span>

          <button
            onClick={() => loadPage(page + 1)}
            disabled={page >= totalPages || loading}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-40 transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
