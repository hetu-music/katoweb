"use client";

import {
  apiCreateRequest,
  apiGetMyRequests,
} from "@/lib/client-api";
import type { UserRequest, RequestType, RequestStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  MessageSquarePlus,
  RefreshCw,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface FeedbackAndBenefitsPanelProps {
  csrfToken: string;
  hasBenefits: boolean;
  isAdmin: boolean;
}

// ─── 状态标签 ─────────────────────────────────────────────────────────────────

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

// ─── 歌曲搜索选择器 ───────────────────────────────────────────────────────────

interface SongOption {
  id: number;
  title: string;
}

interface SongPickerProps {
  value: SongOption | null;
  onChange: (song: SongOption | null) => void;
}

function SongPicker({ value, onChange }: SongPickerProps) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<SongOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // 防抖搜索
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query.trim()) {
      setOptions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/public/songs/search?q=${encodeURIComponent(query)}&limit=10`,
        );
        const data = await res.json();
        setOptions(data.songs ?? []);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [query]);

  const handleSelect = (song: SongOption) => {
    onChange(song);
    setQuery("");
    setOptions([]);
    setOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setQuery("");
    setOptions([]);
  };

  return (
    <div ref={wrapperRef} className="relative">
      {value ? (
        // 已选中状态
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200/60 dark:border-blue-500/20">
          <span className="flex-1 text-sm text-slate-800 dark:text-slate-100 truncate">
            {value.title}
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 p-0.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        // 搜索输入
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => query && setOpen(true)}
            placeholder="输入歌曲名称搜索..."
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-transparent focus:border-blue-500/50 focus:bg-white dark:focus:bg-[#111] outline-none transition-all text-sm text-slate-800 dark:text-slate-200"
          />
          {loading && (
            <Loader2
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400"
            />
          )}
        </div>
      )}

      {/* 下拉列表 */}
      {open && !value && options.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
          {options.map((song) => (
            <button
              key={song.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(song);
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors truncate"
            >
              {song.title}
            </button>
          ))}
        </div>
      )}

      {/* 无结果提示 */}
      {open && !value && query.trim() && !loading && options.length === 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg px-4 py-3 text-xs text-slate-400">
          未找到相关歌曲
        </div>
      )}
    </div>
  );
}

// ─── 提交表单 ─────────────────────────────────────────────────────────────────

interface SubmitFormProps {
  csrfToken: string;
  hasBenefits: boolean;
  onSubmitted: () => void;
}

function SubmitForm({ csrfToken, hasBenefits, onSubmitted }: SubmitFormProps) {
  const [type, setType] = useState<RequestType>("song_feedback");
  const [selectedSong, setSelectedSong] = useState<{ id: number; title: string } | null>(null);
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError("请填写内容");
      return;
    }

    if (type === "song_feedback" && !selectedSong) {
      setError("歌曲纠错需要选择歌曲");
      return;
    }

    setSubmitting(true);
    try {
      await apiCreateRequest(
        {
          type,
          song_id: selectedSong?.id ?? null,
          category: category.trim() || null,
          content: content.trim(),
        },
        csrfToken,
      );
      setSuccess(true);
      setContent("");
      setSelectedSong(null);
      setCategory("");
      setTimeout(() => {
        setSuccess(false);
        onSubmitted();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 类型选择 */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
          类型
        </label>
        <div className="flex flex-wrap gap-2">
          {(
            [
              "song_feedback",
              ...(!hasBenefits ? (["benefit_apply"] as RequestType[]) : []),
              "admin_apply",
            ] as RequestType[]
          ).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                type === t
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
              )}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* 歌曲选择（仅纠错） */}
      {type === "song_feedback" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
              歌曲
            </label>
            <SongPicker value={selectedSong} onChange={setSelectedSong} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
              纠错类别
              <span className="text-slate-300 dark:text-slate-600 normal-case font-normal ml-1">
                (可选)
              </span>
            </label>
            <input
              type="text"
              maxLength={100}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="如：歌词错误、作者信息等"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-transparent focus:border-blue-500/50 focus:bg-white dark:focus:bg-[#111] outline-none transition-all text-sm text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>
      )}

      {/* 内容 */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">
          {type === "song_feedback"
            ? "纠错内容"
            : type === "benefit_apply"
              ? "申请理由"
              : "申请说明"}
        </label>
        <textarea
          rows={4}
          maxLength={2000}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={
            type === "song_feedback"
              ? "请描述具体的错误内容和正确信息..."
              : type === "benefit_apply"
                ? "请说明您希望获得在线试听权益的原因..."
                : "请说明您希望成为管理员的原因和能力..."
          }
          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-transparent focus:border-blue-500/50 focus:bg-white dark:focus:bg-[#111] outline-none transition-all text-sm text-slate-800 dark:text-slate-200 resize-none"
        />
        <p className="text-[10px] text-slate-400 text-right mr-1">
          {content.length} / 2000
        </p>
      </div>

      {/* 错误提示 */}
      {error && (
        <p className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      {/* 提交按钮 */}
      <div className="pt-1">
        <button
          type="submit"
          disabled={submitting || success || !csrfToken}
          className={cn(
            "px-6 py-2.5 rounded-full text-sm font-bold transition-all flex items-center gap-2",
            submitting || !csrfToken
              ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
              : success
                ? "bg-emerald-500 text-white"
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/10 active:scale-95",
          )}
        >
          {submitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : success ? (
            <Check size={16} />
          ) : (
            <Send size={16} />
          )}
          {success ? "已提交" : "提交"}
        </button>
      </div>
    </form>
  );
}

// ─── 请求历史列表 ─────────────────────────────────────────────────────────────

interface RequestListProps {
  requests: UserRequest[];
  loading: boolean;
  onRefresh: () => void;
}

function RequestList({ requests, loading, onRefresh }: RequestListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <Clock size={32} className="mb-3 text-slate-200 dark:text-slate-700" />
        <p className="text-sm">暂无提交记录</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {requests.map((req) => {
        const isExpanded = expandedId === req.id;
        const hasReply = !!req.reply;

        return (
          <div
            key={req.id}
            className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3">
              {/* 类型 */}
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shrink-0">
                {TYPE_LABELS[req.type]}
              </span>

              {/* 内容预览 */}
              <p className="flex-1 text-xs text-slate-600 dark:text-slate-400 truncate min-w-0">
                {req.content}
              </p>

              {/* 状态 */}
              <span
                className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded shrink-0",
                  STATUS_COLORS[req.status],
                )}
              >
                {STATUS_LABELS[req.status]}
              </span>

              {/* 展开按钮 */}
              <button
                onClick={() =>
                  setExpandedId((prev) => (prev === req.id ? null : req.id))
                }
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
              >
                {isExpanded ? (
                  <ChevronUp size={13} />
                ) : (
                  <ChevronDown size={13} />
                )}
              </button>
            </div>

            {isExpanded && (
              <div className="border-t border-slate-200/60 dark:border-slate-700/60 px-4 py-3 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
                {/* 完整内容 */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">
                    提交内容
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {req.content}
                  </p>
                </div>

                {/* 附加信息 */}
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-slate-400">
                  {req.song_id && (
                    <span>
                      歌曲 ID:{" "}
                      <span className="font-mono text-slate-600 dark:text-slate-300">
                        {req.song_id}
                      </span>
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

                {/* 回复内容 */}
                {hasReply && (
                  <div className="bg-blue-50 dark:bg-blue-500/10 rounded-lg px-3 py-2.5 border border-blue-100 dark:border-blue-500/20">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-blue-500 mb-1">
                      管理员回复
                    </p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {req.reply}
                    </p>
                    {req.replied_at && (
                      <p className="text-[10px] text-slate-400 mt-1.5">
                        {new Date(req.replied_at).toLocaleString("zh-CN", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* 刷新按钮 */}
      <div className="flex justify-center pt-2">
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <RefreshCw size={12} />
          刷新
        </button>
      </div>
    </div>
  );
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────

export default function FeedbackAndBenefitsPanel({
  csrfToken,
  hasBenefits,
  isAdmin,
}: FeedbackAndBenefitsPanelProps) {
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const { requests: data } = await apiGetMyRequests();
      setRequests(data);
    } catch {
      // 静默失败，保持空列表
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  const handleSubmitted = useCallback(() => {
    setShowForm(false);
    void fetchRequests();
  }, [fetchRequests]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 flex flex-col">
      {/* 权益状态卡片 */}
      <div
        className={cn(
          "rounded-2xl border p-6 flex items-center gap-4",
          hasBenefits
            ? "bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 border-blue-200/60 dark:border-blue-500/20"
            : "bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/60",
        )}
      >
        <div
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
            hasBenefits
              ? "bg-blue-100 dark:bg-blue-500/20"
              : "bg-slate-100 dark:bg-slate-800",
          )}
        >
          <Sparkles
            size={22}
            className={
              hasBenefits
                ? "text-blue-500"
                : "text-slate-400 dark:text-slate-500"
            }
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {hasBenefits ? "在线试听已开通" : "在线试听未开通"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            {hasBenefits
              ? "您已获得在线试听权益，可在每首歌曲的详情页直接播放高品质音频。"
              : "在线试听权益需要申请，管理员审核通过后即可使用。"}
          </p>
        </div>
        {!hasBenefits && !isAdmin && (
          <button
            onClick={() => {
              setShowForm(true);
            }}
            className="shrink-0 px-4 py-2 rounded-full text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            申请试听
          </button>
        )}
      </div>

      {/* 提交反馈区域 */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <MessageSquarePlus
              size={16}
              className="text-blue-500 shrink-0"
            />
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
              提交反馈 / 申请
            </span>
          </div>
          {showForm ? (
            <X size={16} className="text-slate-400" />
          ) : (
            <ChevronDown size={16} className="text-slate-400" />
          )}
        </button>

        {showForm && (
          <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-5 animate-in fade-in slide-in-from-top-2 duration-200">
            <SubmitForm
              csrfToken={csrfToken}
              hasBenefits={hasBenefits}
              onSubmitted={handleSubmitted}
            />
          </div>
        )}
      </div>

      {/* 历史记录 */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-6 flex-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            我的提交记录
          </h3>
          <span className="text-xs text-slate-400">
            共 {requests.length} 条
          </span>
        </div>
        <RequestList
          requests={requests}
          loading={loadingRequests}
          onRefresh={fetchRequests}
        />
      </div>
    </div>
  );
}
