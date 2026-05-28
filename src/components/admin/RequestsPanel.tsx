"use client";

import { apiGetAdminRequests, apiReplyRequest } from "@/lib/client-api";
import type { UserRequest, RequestStatus, RequestType } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface RequestsPanelProps {
  csrfToken: string;
  isSuper: boolean;
}

const STATUS_LABELS: Record<RequestStatus, string> = {
  pending: "待处理",
  replied: "已回复",
  approved: "已同意",
  rejected: "已拒绝",
};

const STATUS_COLORS: Record<RequestStatus, string> = {
  pending:
    "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10",
  replied: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10",
  approved:
    "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10",
  rejected: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10",
};

const TYPE_LABELS: Record<RequestType, string> = {
  song_feedback: "歌曲纠错",
  benefit_apply: "申请试听",
  admin_apply: "申请管理员",
};

interface ReplyState {
  reply: string;
  status: "replied" | "approved" | "rejected";
}

export default function RequestsPanel({
  csrfToken,
  isSuper,
}: RequestsPanelProps) {
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [replyStates, setReplyStates] = useState<Record<string, ReplyState>>(
    {},
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (p: number, type: string, status: string) => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiGetAdminRequests({
          type: type === "all" ? undefined : type,
          status: status === "all" ? undefined : status,
          page: p,
        });
        setRequests(data.requests);
        setTotal(data.total);
        setPage(p);
        setExpandedId(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "加载失败");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void fetchPage(1, typeFilter, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReply = useCallback(
    async (id: string) => {
      const state = replyStates[id];
      if (!state?.reply.trim()) return;

      setSavingId(id);
      setSaveMsg(null);
      try {
        await apiReplyRequest(
          { id, reply: state.reply.trim(), status: state.status },
          csrfToken,
        );
        setSaveMsg("已保存");
        // 更新本地状态
        setRequests((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  reply: state.reply.trim(),
                  status: state.status,
                  replied_at: new Date().toISOString(),
                }
              : r,
          ),
        );
        setExpandedId(null);
      } catch (e) {
        setSaveMsg(e instanceof Error ? e.message : "操作失败");
      } finally {
        setSavingId(null);
        setTimeout(() => setSaveMsg(null), 3000);
      }
    },
    [replyStates, csrfToken],
  );

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (loading && requests.length === 0) {
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
          onClick={() => fetchPage(page, typeFilter, statusFilter)}
          className="flex items-center gap-1.5 text-xs font-bold text-blue-500 hover:text-blue-600"
        >
          <RefreshCw size={13} />
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-3 px-1">
        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
          共 {total} 条
        </span>

        {/* 类型过滤（超管才能看全部类型） */}
        {isSuper && (
          <select
            value={typeFilter}
            onChange={(e) => {
              const val = e.target.value;
              setTypeFilter(val);
              void fetchPage(1, val, statusFilter);
            }}
            disabled={loading}
            className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
          >
            <option value="all">全部类型</option>
            <option value="song_feedback">歌曲纠错</option>
            <option value="benefit_apply">申请试听</option>
            <option value="admin_apply">申请管理员</option>
          </select>
        )}

        {/* 状态过滤 */}
        <select
          value={statusFilter}
          onChange={(e) => {
            const val = e.target.value;
            setStatusFilter(val);
            void fetchPage(1, typeFilter, val);
          }}
          disabled={loading}
          className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
        >
          <option value="all">全部状态</option>
          <option value="pending">待处理</option>
          <option value="replied">已回复</option>
          <option value="approved">已同意</option>
          <option value="rejected">已拒绝</option>
        </select>

        <div className="ml-auto flex items-center gap-2">
          {saveMsg && (
            <span
              className={cn(
                "text-xs font-bold px-2 py-1 rounded-md",
                saveMsg === "已保存"
                  ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10"
                  : "text-rose-500 bg-rose-50 dark:bg-rose-500/10",
              )}
            >
              {saveMsg}
            </span>
          )}
          <button
            onClick={() => fetchPage(page, typeFilter, statusFilter)}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            title="刷新"
          >
            <RefreshCw
              size={14}
              className={cn(loading && "animate-spin")}
            />
          </button>
        </div>
      </div>

      {/* 列表 */}
      {requests.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
          暂无记录
        </div>
      ) : (
        <div className="space-y-2">
          {requests.map((req) => {
            const isExpanded = expandedId === req.id;
            const isFeedback = req.type === "song_feedback";
            const defaultStatus = isFeedback ? "replied" : "approved";
            const replyState = replyStates[req.id] ?? {
              reply: req.reply ?? "",
              status: req.status === "pending" ? defaultStatus : req.status,
            };

            return (
              <div
                key={req.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden"
              >
                {/* 行头 */}
                <div className="flex items-center gap-3 px-4 py-3 text-xs">
                  {/* 类型 */}
                  <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {TYPE_LABELS[req.type]}
                  </span>

                  {/* 用户名 */}
                  <span className="font-bold text-slate-700 dark:text-slate-200 shrink-0 max-w-[80px] truncate">
                    {req.user_name ?? "—"}
                  </span>

                  {/* 内容预览 */}
                  <span className="flex-1 text-slate-500 dark:text-slate-400 truncate min-w-0">
                    {req.content}
                  </span>

                  {/* 状态 */}
                  <span
                    className={cn(
                      "shrink-0 text-[10px] font-bold px-2 py-0.5 rounded",
                      STATUS_COLORS[req.status],
                    )}
                  >
                    {STATUS_LABELS[req.status]}
                  </span>

                  {/* 时间 */}
                  <span className="text-slate-400 shrink-0 hidden sm:block">
                    {new Date(req.created_at).toLocaleDateString("zh-CN")}
                  </span>

                  {/* 展开 */}
                  <button
                    onClick={() =>
                      setExpandedId((prev) =>
                        prev === req.id ? null : req.id,
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
                </div>

                {/* 展开详情 + 回复表单 */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* 请求详情 */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-slate-400">
                        <span>
                          用户 ID:{" "}
                          <span className="font-mono text-slate-600 dark:text-slate-300">
                            {req.user_id.slice(0, 8)}…
                          </span>
                        </span>
                        {req.song_id && (
                          <span>
                            歌曲 ID:{" "}
                            <span className="font-mono text-slate-600 dark:text-slate-300">
                              {req.song_id}
                            </span>
                            {req.song_title && (
                              <span className="text-slate-500 dark:text-slate-400 ml-1">
                                ({req.song_title})
                              </span>
                            )}
                          </span>
                        )}
                        {req.category && (
                          <span>
                            类别:{" "}
                            <span className="text-slate-600 dark:text-slate-300">
                              {req.category}
                            </span>
                          </span>
                        )}
                        <span>
                          提交于{" "}
                          {new Date(req.created_at).toLocaleString("zh-CN", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2.5">
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {req.content}
                        </p>
                      </div>
                    </div>

                    {/* 回复表单 */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        回复
                      </p>

                      <textarea
                        rows={3}
                        maxLength={2000}
                        value={replyState.reply}
                        onChange={(e) =>
                          setReplyStates((prev) => ({
                            ...prev,
                            [req.id]: { ...replyState, reply: e.target.value },
                          }))
                        }
                        placeholder="输入回复内容..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                      />

                      {/* 状态选择 + 提交 */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* 状态按钮组：纠错只有"已回复"，申请类有"同意/拒绝" */}
                        {(
                          isFeedback
                            ? (["replied"] as const)
                            : (["approved", "rejected"] as const)
                        ).map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() =>
                              setReplyStates((prev) => ({
                                ...prev,
                                [req.id]: { ...replyState, status: s },
                              }))
                            }
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                              replyState.status === s
                                ? s === "approved"
                                  ? "bg-emerald-500 text-white"
                                  : s === "rejected"
                                    ? "bg-rose-500 text-white"
                                    : "bg-blue-500 text-white"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
                            )}
                          >
                            {s === "replied"
                              ? "标记已回复"
                              : s === "approved"
                                ? "同意"
                                : "拒绝"}
                          </button>
                        ))}

                        <button
                          onClick={() => handleReply(req.id)}
                          disabled={
                            savingId === req.id || !replyState.reply.trim()
                          }
                          className="ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold transition-colors disabled:opacity-60"
                        >
                          {savingId === req.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Check size={12} />
                          )}
                          提交回复
                        </button>

                        <button
                          onClick={() => setExpandedId(null)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 text-xs font-bold transition-colors hover:text-slate-700 dark:hover:text-slate-200"
                        >
                          <X size={12} />
                          取消
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => fetchPage(page - 1, typeFilter, statusFilter)}
            disabled={page <= 1 || loading}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs font-bold text-slate-500 min-w-20 text-center">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => fetchPage(page + 1, typeFilter, statusFilter)}
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
