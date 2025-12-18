"use client";
import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Search,
  Plus,
  Edit,
  Save,
  X,
  Eye,
  EyeOff,
  Bell,
  XCircle,
} from "lucide-react";
import type { Song, SongDetail, SongFieldConfig } from "@/lib/types";
import {
  convertEmptyStringToNull,
  formatField,
  validateField,
} from "@/lib/utils";
import { songFields, genreColorMap, typeColorMap } from "@/lib/constants";
import FloatingActionButtons from "@/components/public/FloatingActionButtons";
import Pagination from "@/components/public/Pagination";
import { usePagination } from "@/hooks/usePagination";
import { apiCreateSong, apiUpdateSong } from "@/lib/api";
import { useSongs } from "@/hooks/useSongs";
import { useAuth } from "@/hooks/useAuth";
import Account from "./Account";
import Notification from "./Notification";
import CoverUpload from "./CoverUpload";
import ScoreUpload from "./ScoreUpload";

// 判断歌曲信息是否完整的函数
function isSongIncomplete(song: SongDetail): boolean {
  // 检查所有配置字段
  for (const field of songFields) {
    // 封面、外链不用检测，视作已经填写
    if (
      ["hascover", "kugolink", "qmlink", "nelink", "comment"].includes(
        field.key,
      )
    )
      continue;

    const value = song[field.key];

    // 特殊处理乐谱状态：只有 true 算完整，false/null/undefined 算缺失
    if (field.key === "nmn_status") {
      if (value !== true) return true;
      continue;
    }

    // 检查 null 或 undefined
    if (value === null || value === undefined) {
      return true;
    }

    // 检查空数组
    if (Array.isArray(value) && value.length === 0) {
      return true;
    }

    // 检查空字符串
    if (typeof value === "string" && value.trim() === "") {
      return true;
    }
  }

  return false;
}

// 获取缺失的字段信息
function getMissingFields(song: SongDetail): string[] {
  const missing: string[] = [];

  for (const field of songFields) {
    // 封面、外链不用检测
    if (
      ["hascover", "kugolink", "qmlink", "nelink", "comment"].includes(
        field.key,
      )
    )
      continue;

    const value = song[field.key];
    let isEmpty = false;

    // 特殊处理乐谱状态
    if (field.key === "nmn_status") {
      if (value !== true) isEmpty = true;
    } else if (value === null || value === undefined) {
      isEmpty = true;
    } else if (Array.isArray(value) && value.length === 0) {
      isEmpty = true;
    } else if (typeof value === "string" && value.trim() === "") {
      isEmpty = true;
    }

    if (isEmpty) {
      missing.push(field.label);
    }
  }

  return missing;
}

// Memoized SongRow component
const SongRow = React.memo(
  ({
    song,
    idx,
    expandedRows,
    toggleRowExpansion,
    handleEdit,
  }: {
    song: SongDetail;
    idx: number;
    expandedRows: Set<number>;
    toggleRowExpansion: (id: number) => void;
    handleEdit: (song: Song) => void;
  }) => {
    const isExpanded = expandedRows.has(song.id);

    return (
      <>
        <tr
          className={`border-b border-slate-200 dark:border-slate-800 transition-colors ${isExpanded
            ? "bg-blue-50/50 dark:bg-blue-900/10"
            : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
            }`}
        >
          <td className="py-3 px-2 md:py-4 md:px-4 text-slate-500 dark:text-slate-400 font-mono text-sm">
            {idx + 1}
          </td>
          <td className="py-3 px-2 md:py-4 md:px-4 text-slate-900 dark:text-slate-100 font-medium">
            <div className="flex flex-col items-start gap-1 md:flex-row md:items-center md:gap-2">
              <span className="break-words line-clamp-2 md:line-clamp-none font-serif">
                {song.title}
              </span>
              {isSongIncomplete(song) && (
                <span className="inline-flex items-center px-1.5 py-0.5 md:px-2 md:py-1 rounded-full text-[10px] md:text-xs font-medium bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-200 dark:border-amber-400/30 whitespace-nowrap">
                  待完善
                </span>
              )}
            </div>
          </td>
          <td className="py-3 px-2 md:py-4 md:px-4 text-slate-600 dark:text-slate-300 hidden md:table-cell text-sm">
            {song.album || "-"}
          </td>
          <td className="py-3 px-2 md:py-4 md:px-4 text-slate-500 dark:text-slate-400 hidden md:table-cell text-sm">
            {Array.isArray(song.lyricist)
              ? song.lyricist.join(", ")
              : song.lyricist || "-"}
          </td>
          <td className="py-3 px-2 md:py-4 md:px-4 text-slate-500 dark:text-slate-400 hidden md:table-cell text-sm">
            {Array.isArray(song.composer)
              ? song.composer.join(", ")
              : song.composer || "-"}
          </td>
          <td className="py-3 px-2 md:py-4 md:px-4 text-slate-500 dark:text-slate-400 hidden md:table-cell text-sm">
            {Array.isArray(song.type) ? song.type.join(", ") : song.type || "-"}
          </td>
          <td className="py-3 px-2 md:py-4 md:px-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleRowExpansion(song.id)}
                className={`p-2 rounded-lg transition-all duration-200 ${isExpanded
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-300"
                  : "text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                  }`}
                title={isExpanded ? "收起详情" : "查看详情"}
              >
                {isExpanded ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button
                onClick={() => handleEdit(song)}
                className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10 transition-all duration-200"
                title="编辑"
              >
                <Edit size={16} />
              </button>
            </div>
          </td>
        </tr>
        {isExpanded && (
          <>
            {/* Mobile Expanded Row */}
            <tr className="md:hidden">
              <td
                colSpan={3}
                className="p-0 border-b border-slate-200 dark:border-slate-800"
              >
                <ExpandedContent song={song} />
              </td>
            </tr>
            {/* Desktop Expanded Row */}
            <tr className="hidden md:table-row">
              <td
                colSpan={7}
                className="p-0 border-b border-slate-200 dark:border-slate-800"
              >
                <ExpandedContent song={song} />
              </td>
            </tr>
          </>
        )}
      </>
    );
  },
);
SongRow.displayName = "SongRow";

function ExpandedContent({ song }: { song: SongDetail }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 shadow-inner relative overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="p-4 md:p-6">
        {/* 如果歌曲信息不完整，显示缺失字段提示 */}
        {isSongIncomplete(song) && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-100 dark:border-amber-500/20 shadow-sm flex items-start gap-4">
            <div className="p-2 bg-amber-100 dark:bg-amber-500/20 rounded-lg text-amber-600 dark:text-amber-300 shrink-0 mt-0.5">
              <XCircle size={18} />
            </div>
            <div>
              <h4 className="font-semibold mb-1">信息待完善</h4>
              <p className="text-sm opacity-80 mb-2">
                以下字段内容缺失，请及时补充：
              </p>
              <div className="flex flex-wrap gap-2">
                {getMissingFields(song).map((field) => (
                  <span
                    key={field}
                    className="px-2 py-1 bg-amber-100 border border-amber-200 rounded text-xs text-amber-700 dark:bg-amber-900/40 dark:border-amber-500/20 dark:text-amber-200"
                  >
                    {field}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {songFields.map((field) => {
            const value = song[field.key];
            // 使用更严格的空值检查
            // 对于乐谱(nmn_status)，只有 true 算完整
            // 对于其他 boolean (除了hascover) 或 number 0，算完整
            let isEmpty = false;

            if (field.key === "nmn_status") {
              isEmpty = value !== true;
            } else {
              isEmpty =
                value === null ||
                value === undefined ||
                (Array.isArray(value) && value.length === 0) ||
                (typeof value === "string" && value.trim() === "");
            }

            // 封面和外链视为已填写，不需要高亮
            const shouldHighlight =
              !["hascover", "kugolink", "qmlink", "nelink", "comment"].includes(
                field.key,
              ) && isEmpty;

            return (
              <div
                key={field.key}
                className={`
                  relative overflow-hidden rounded-xl border p-4 transition-all duration-200
                  ${shouldHighlight
                    ? "bg-red-50 border-red-200 hover:bg-red-100/50 dark:bg-red-500/5 dark:border-red-500/30 dark:hover:bg-red-500/10"
                    : "bg-white border-slate-200 hover:border-slate-300 dark:bg-slate-900/50 dark:border-slate-700 dark:hover:border-slate-600"
                  }
                `}
              >
                <div className="flex justify-between items-start mb-2">
                  <span
                    className={`text-xs font-semibold tracking-wider uppercase ${shouldHighlight
                      ? "text-red-500 dark:text-red-400"
                      : "text-slate-400 dark:text-slate-500"
                      }`}
                  >
                    {field.label}
                  </span>
                  {shouldHighlight && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400">
                      required
                    </span>
                  )}
                </div>

                <div
                  className={`text-sm break-words leading-relaxed font-medium ${shouldHighlight
                    ? "text-red-700 dark:text-red-200/90"
                    : "text-slate-700 dark:text-slate-200"
                    }`}
                >
                  {field.key === "hascover" ? (
                    song.hascover === true ? (
                      <span className="text-green-600 dark:text-green-400">
                        定制封面
                      </span>
                    ) : song.hascover === false ? (
                      <span className="text-purple-600 dark:text-purple-400">
                        初号机
                      </span>
                    ) : (
                      <span className="text-slate-400">白底狐狸 (默认)</span>
                    )
                  ) : field.key === "nmn_status" ? (
                    song.nmn_status === true ? (
                      <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                        ✓ 有乐谱
                      </span>
                    ) : (
                      <span className="text-slate-400">无乐谱</span>
                    )
                  ) : (
                    formatField(song[field.key], field.type) ||
                    (shouldHighlight ? (
                      "未填写"
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">
                        -
                      </span>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function AdminClientComponent({
  initialSongs,
  initialError,
}: {
  initialSongs: SongDetail[];
  initialError: string | null;
}) {
  // 使用 useState 来管理 URL 参数，避免 hydration 错误
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(
    null,
  );
  const [isClient, setIsClient] = useState(false);

  // 在客户端挂载后初始化 URL 参数
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== "undefined") {
      setSearchParams(new URLSearchParams(window.location.search));
    }
  }, []);

  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);

  const {
    songs,
    setSongs,
    loading,

    error,
    setError,
    searchTerm,
    setSearchTerm,
    filteredSongs: baseFilteredSongs,
    sortedSongs: baseSortedSongs,
  } = useSongs(
    initialSongs,
    initialError,
    isClient ? searchParams?.get("q") || "" : "",
  );

  // 在基础筛选结果上再应用待完善筛选
  const filteredSongs = useMemo(() => {
    if (showIncompleteOnly) {
      return baseFilteredSongs.filter((song) => isSongIncomplete(song));
    }
    return baseFilteredSongs;
  }, [baseFilteredSongs, showIncompleteOnly]);

  const sortedSongs = useMemo(() => {
    // 使用基础排序结果，再次过滤（保持原有排序逻辑）
    if (showIncompleteOnly) {
      return baseSortedSongs.filter((song) => isSongIncomplete(song));
    }
    return baseSortedSongs;
  }, [baseSortedSongs, showIncompleteOnly]);

  // 直接从 URL 获取初始页面，避免额外的状态
  const getInitialPage = () => {
    if (!isClient || !searchParams) return 1;
    return parseInt(searchParams.get("page") || "1", 10);
  };

  // 分页功能
  const {
    currentPage,
    totalPages,
    currentData: paginatedSongs,
    setCurrentPage: setPaginationPage,
    startIndex,
    endIndex,
  } = usePagination({
    data: sortedSongs,
    itemsPerPage: 25,
    initialPage: getInitialPage(),
    resetOnDataChange: false, // 由 URL 同步逻辑处理重置
  });

  // 包装分页函数以同步URL
  const setCurrentPage = useCallback(
    (page: number) => {
      setPaginationPage(page);

      // 同步更新 URL
      if (isClient && typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (page !== 1) {
          params.set("page", page.toString());
        } else {
          params.delete("page");
        }
        const newUrl = `${window.location.pathname}${params.toString() ? "?" + params.toString() : ""}`;
        window.history.replaceState(null, "", newUrl);
        setSearchParams(new URLSearchParams(params.toString()));
      }
    },
    [setPaginationPage, isClient, setSearchParams],
  );
  const { csrfToken, handleLogout, logoutLoading } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [newSong, setNewSong] = useState<Partial<Song>>({
    title: "",
    album: "",
  });
  const [addFormErrors, setAddFormErrors] = useState<Record<string, string>>(
    {},
  );
  const [editSong, setEditSong] = useState<SongDetail | null>(null);
  const [editForm, setEditForm] = useState<Partial<Song>>({});
  const [editFormErrors, setEditFormErrors] = useState<Record<string, string>>(
    {},
  );
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [addResultMessage, setAddResultMessage] = useState<string | null>(null);
  const [editResultMessage, setEditResultMessage] = useState<string | null>(
    null,
  );
  const [showNotification, setShowNotification] = useState(false);

  // Scroll listener
  React.useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // URL同步逻辑 - 只处理搜索词，页面由 setCurrentPage 处理
  useEffect(() => {
    if (!isClient || typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const currentQ = params.get("q") || "";

    // 只有当搜索词发生变化时才更新URL
    if (searchTerm !== currentQ) {
      if (searchTerm) {
        params.set("q", searchTerm);
      } else {
        params.delete("q");
      }
      // 搜索时重置到第一页
      params.delete("page");

      const newUrl = `${window.location.pathname}${params.toString() ? "?" + params.toString() : ""}`;
      window.history.replaceState(null, "", newUrl);
      setSearchParams(new URLSearchParams(params.toString()));

      // 重置分页到第一页
      setPaginationPage(1);
    }
  }, [searchTerm, isClient, setSearchParams, setPaginationPage]);

  // 自动弹出通知逻辑
  useEffect(() => {
    // 检查是否是新的登录会话
    const lastNotificationTime = localStorage.getItem("lastNotificationTime");
    const currentTime = new Date().getTime();
    const oneHour = 60 * 60 * 1000; // 1小时的毫秒数

    // 如果没有记录或者距离上次显示超过1小时，则显示通知
    if (
      !lastNotificationTime ||
      currentTime - parseInt(lastNotificationTime) > oneHour
    ) {
      // 延迟1秒显示，让页面先加载完成
      const timer = setTimeout(() => {
        setShowNotification(true);
        localStorage.setItem("lastNotificationTime", currentTime.toString());
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const toggleRowExpansion = useCallback((id: number) => {
    setExpandedRows((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
      return newExpanded;
    });
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      // 校验所有字段
      const errors: Record<string, string> = {};
      songFields.forEach((f) => {
        errors[f.key] = validateField(
          f,
          (newSong as Partial<SongDetail>)[f.key],
        );
      });
      setAddFormErrors(errors);
      const firstErrorKey = Object.keys(errors).find((k) => errors[k]);
      if (firstErrorKey) {
        // 尝试聚焦第一个有错的字段
        const el = document.querySelector(`[name='${firstErrorKey}']`);
        if (el && "focus" in el) (el as HTMLElement).focus();
        return;
      }
      try {
        setIsSubmitting(true);
        setAddResultMessage(null);
        const { /* year, */ ...songWithoutYear } = newSong;
        // 处理空字符串为 null
        const songToSubmit = convertEmptyStringToNull(songWithoutYear);
        const created = await apiCreateSong(songToSubmit, csrfToken);
        setSongs((prev) => [...prev, created]);
        setShowAdd(false);
        setNewSong({ title: "", album: "" });
        setAddFormErrors({});
        setAddResultMessage("成功");
        setTimeout(() => {
          setAddResultMessage(null);
        }, 2000);
      } catch (e: unknown) {
        if (e instanceof Error) {
          setAddResultMessage(e.message || "失败");
        } else {
          setAddResultMessage("失败");
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [newSong, csrfToken, setSongs],
  );

  const handleEdit = useCallback((song: SongDetail) => {
    setEditSong(song);
    setEditForm({ ...song });
  }, []);

  const handleEditSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editSong) return;
      // 校验所有字段
      const errors: Record<string, string> = {};
      songFields.forEach((f) => {
        errors[f.key] = validateField(
          f,
          (editForm as Partial<SongDetail>)[f.key],
        );
      });
      setEditFormErrors(errors);
      const firstErrorKey = Object.keys(errors).find((k) => errors[k]);
      if (firstErrorKey) {
        const el = document.querySelector(`[name='${firstErrorKey}']`);
        if (el && "focus" in el) (el as HTMLElement).focus();
        return;
      }
      try {
        setIsSubmitting(true);
        setEditResultMessage(null);
        const formWithoutYear = editForm;
        // 处理空字符串为 null
        const formToSubmit = convertEmptyStringToNull(formWithoutYear);
        // 一并传递 updated_at
        const updated = await apiUpdateSong(
          editSong.id,
          { ...formToSubmit, updated_at: editSong.updated_at },
          csrfToken,
        );
        setSongs((prev) =>
          prev.map((s) => (s.id === updated.id ? updated : s)),
        );
        setEditFormErrors({});
        setEditResultMessage("成功");
        setTimeout(() => {
          setEditSong(null);
          setEditResultMessage(null);
        }, 2000);
      } catch (e: unknown) {
        if (e instanceof Error) {
          if (e.message.includes("数据已被他人修改")) {
            setEditResultMessage("数据已被他人修改，请刷新页面后重试");
          } else {
            setEditResultMessage(e.message || "失败");
          }
        } else {
          setEditResultMessage("失败");
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [editSong, editForm, csrfToken, setSongs],
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0F19] transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8 flex flex-row items-center justify-between gap-4 pt-4">
          <div className="flex items-center gap-4">
            <h1
              className="text-4xl font-bold text-slate-900 dark:text-white mb-0 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300 select-none tracking-tight"
              onClick={() => {
                // 重置搜索条件和页面
                setSearchTerm("");
                setShowIncompleteOnly(false);
                setPaginationPage(1);
              }}
              title="点击重置搜索条件"
            >
              Admin Dashboard
            </h1>
            {/* 通知按钮 */}
            <button
              onClick={() => setShowNotification(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200 shadow-sm font-medium"
              title="查看操作说明"
            >
              <Bell size={16} />
              <span className="hidden sm:inline text-sm">说明</span>
            </button>
          </div>
          <Account
            csrfToken={csrfToken}
            handleLogout={handleLogout}
            logoutLoading={logoutLoading}
          />
        </div>

        {/* Search and Add Button */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="搜索歌曲、专辑等..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-10 pr-12 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                aria-label="清空搜索"
              >
                <XCircle size={18} />
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowIncompleteOnly(!showIncompleteOnly)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl border transition-all duration-200 shadow-sm font-medium whitespace-nowrap ${showIncompleteOnly
                ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20"
                : "bg-white text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-amber-500/10 dark:hover:text-amber-300 dark:hover:border-amber-500/20"
                }`}
              title={showIncompleteOnly ? "显示全部歌曲" : "只显示待完善歌曲"}
            >
              <div
                className={`w-2 h-2 rounded-full ${showIncompleteOnly ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-600"}`}
              ></div>
              {showIncompleteOnly ? "仅待完善" : "待完善"}
            </button>

            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-lg shadow-slate-200 dark:shadow-none hover:-translate-y-0.5 transition-all duration-200 font-medium whitespace-nowrap"
            >
              <Plus size={20} />
              新增歌曲
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 sm:gap-4 mb-8 flex-wrap">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-4 py-2 shadow-sm text-sm text-slate-600 dark:text-slate-400">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            总计{" "}
            <span className="text-slate-900 dark:text-slate-200 font-bold">
              {songs.length}
            </span>{" "}
            首
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-4 py-2 shadow-sm text-sm text-slate-600 dark:text-slate-400">
            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
            筛选{" "}
            <span className="text-slate-900 dark:text-slate-200 font-bold">
              {filteredSongs.length}
            </span>{" "}
            首
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-4 py-2 shadow-sm text-sm text-slate-600 dark:text-slate-400">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            待完善{" "}
            <span className="text-red-600 dark:text-red-400 font-bold">
              {songs.filter((song) => isSongIncomplete(song)).length}
            </span>{" "}
            首
          </div>
          {filteredSongs.length > 25 && (
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-4 py-2 shadow-sm text-sm text-slate-600 dark:text-slate-400">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              本页{" "}
              <span className="text-slate-900 dark:text-slate-200 font-bold">
                {startIndex}-{endIndex}
              </span>
            </div>
          )}
        </div>

        {/* Loading and Error States */}
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-blue-500"></div>
            <p className="text-slate-500 mt-4">正在加载数据...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 dark:bg-red-500/10 dark:border-red-500/20 rounded-2xl p-6 mb-8 text-center">
            <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-sm text-red-500 hover:text-red-700 dark:hover:text-red-300 underline"
            >
              关闭提示
            </button>
          </div>
        )}

        {/* Songs Table */}
        {!loading && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                    <th className="text-left py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-16 md:w-20">
                      #
                    </th>
                    <th className="text-left py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="text-left py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell w-32 lg:w-48">
                      Album
                    </th>
                    <th className="text-left py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell w-24 lg:w-32">
                      Lyricist
                    </th>
                    <th className="text-left py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell w-24 lg:w-32">
                      Composer
                    </th>
                    <th className="text-left py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider hidden md:table-cell w-24">
                      Type
                    </th>
                    <th className="text-left py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-24 md:w-32">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedSongs.map((song, idx) => (
                    <SongRow
                      key={song.id}
                      song={song}
                      idx={startIndex + idx - 1}
                      expandedRows={expandedRows}
                      toggleRowExpansion={toggleRowExpansion}
                      handleEdit={handleEdit}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 分页组件 */}
        {!loading && filteredSongs.length > 25 && (
          <div className="mt-12 mb-8 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        {/* No Results */}
        {!loading && filteredSongs.length === 0 && (
          <div className="text-center py-20">
            <div className="bg-slate-50 dark:bg-slate-800/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search
                size={32}
                className="text-slate-300 dark:text-slate-600"
              />
            </div>
            <div className="text-slate-900 dark:text-slate-200 text-lg font-medium mb-1">
              未找到匹配的歌曲
            </div>
            <div className="text-slate-500 dark:text-slate-400 text-sm">
              请尝试调整搜索关键词或筛选条件
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {(showAdd || editSong) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-linear-to-br from-purple-800 via-blue-900 to-indigo-900 border border-white/20 rounded-2xl shadow-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {showAdd ? "新增" : "编辑"}歌曲
              </h2>
              <button
                onClick={() => {
                  setShowAdd(false);
                  setEditSong(null);
                  setAddResultMessage(null);
                  setEditResultMessage(null);
                }}
                className="p-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-all duration-200"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={showAdd ? handleAdd : handleEditSubmit}
              className="space-y-8"
              id={showAdd ? "add-form" : "edit-form"}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {songFields.map((field) => (
                  <div
                    key={field.key}
                    className={
                      (field.type === "textarea" ? "md:col-span-2" : "") +
                      " flex flex-col gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800 shadow-sm"
                    }
                  >
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 text-sm tracking-wide">
                      {field.label}:
                    </label>
                    {renderInput(
                      field,
                      showAdd ? newSong : editForm,
                      showAdd ? setNewSong : setEditForm,
                      showAdd ? addFormErrors : editFormErrors,
                      showAdd ? setAddFormErrors : setEditFormErrors,
                      csrfToken,
                    )}
                  </div>
                ))}
              </div>
            </form>

            {/* 悬浮在右下角的操作按钮和提示信息 */}
            <div className="fixed bottom-8 right-8 z-60 flex flex-col items-end gap-4">
              {/* 操作按钮 - 竖向排列，圆形设计 */}
              <div className="flex flex-col items-center gap-3">
                <button
                  type="submit"
                  form={showAdd ? "add-form" : "edit-form"}
                  disabled={isSubmitting}
                  className={`w-14 h-14 rounded-full border-2 text-white transition-all duration-200 font-semibold shadow-lg backdrop-blur-sm flex items-center justify-center group ${isSubmitting
                    ? "bg-slate-500/50 border-slate-400/30 cursor-not-allowed"
                    : "bg-blue-600 border-blue-500 hover:bg-blue-500 hover:border-blue-400 dark:bg-blue-600 dark:border-blue-500"
                    }`}
                  title={showAdd ? "提交" : "保存"}
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save
                      size={20}
                      className="group-hover:scale-110 transition-transform duration-200"
                    />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowAdd(false);
                    setEditSong(null);
                    setAddResultMessage(null);
                    setEditResultMessage(null);
                  }}
                  className="w-14 h-14 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 font-semibold shadow-lg backdrop-blur-sm flex items-center justify-center group"
                  title="取消"
                >
                  <X
                    size={20}
                    className="group-hover:scale-110 transition-transform duration-200"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 中央提示消息 - 移到模态框外部 */}
      {addResultMessage || editResultMessage ? (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div
            className={`relative max-w-sm w-full p-6 rounded-2xl shadow-2xl border backdrop-blur-md transform transition-all duration-300 animate-in zoom-in-95 slide-in-from-bottom-2
            ${addResultMessage === "成功" || editResultMessage === "成功"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-900/90 dark:border-emerald-700 dark:text-emerald-100"
                : "bg-red-50 border-red-200 text-red-900 dark:bg-red-900/90 dark:border-red-700 dark:text-red-100"
              }
          `}
          >
            {/* 图标和消息 */}
            <div className="relative flex flex-col items-center text-center space-y-4">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center ${addResultMessage === "成功" || editResultMessage === "成功"
                  ? "bg-emerald-100 dark:bg-emerald-800/50 border-2 border-emerald-200 dark:border-emerald-600"
                  : "bg-red-100 dark:bg-red-800/50 border-2 border-red-200 dark:border-red-600"
                  }`}
              >
                {addResultMessage === "成功" || editResultMessage === "成功" ? (
                  <svg
                    width="32"
                    height="32"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <svg
                    width="32"
                    height="32"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
              </div>

              <div>
                <h3 className="text-xl font-bold mb-2">
                  {addResultMessage === "成功" || editResultMessage === "成功"
                    ? "操作成功"
                    : "操作失败"}
                </h3>
                <p className="text-sm opacity-90">
                  {addResultMessage || editResultMessage}
                </p>
              </div>
            </div>

            {/* 关闭按钮 */}
            <button
              onClick={() => {
                setAddResultMessage(null);
                setEditResultMessage(null);
              }}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors duration-200 opacity-60 hover:opacity-100"
            >
              <X size={16} />
            </button>

            {/* 自动关闭倒计时 */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/10 rounded-b-2xl overflow-hidden">
              <div
                className={`h-full transition-all duration-3000 ease-linear ${addResultMessage === "成功" || editResultMessage === "成功"
                  ? "bg-emerald-500"
                  : "bg-red-500"
                  }`}
              ></div>
            </div>
          </div>
        </div>
      ) : null}

      {/* 浮动操作按钮组 - 仅返回顶部 */}
      <FloatingActionButtons
        showScrollTop={showScrollTop}
        onScrollToTop={scrollToTop}
      />

      {/* 通知模态框 */}
      {showNotification && (
        <Notification onClose={() => setShowNotification(false)} />
      )}
    </div>
  );
}

function renderInput(
  f: SongFieldConfig,
  state: Partial<SongDetail>,
  setState: React.Dispatch<React.SetStateAction<Partial<SongDetail>>>,
  errors: Record<string, string>,
  setErrors: (e: Record<string, string>) => void,
  csrfToken: string,
) {
  const v = state[f.key];
  const baseInputClass =
    "w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 rounded-xl";
  const errorMsg = errors[f.key];

  const handleChange = (val: unknown) => {
    setState((s) => ({ ...s, [f.key]: val }));
    const err = validateField(f, val);
    setErrors({ ...errors, [f.key]: err });
  };

  if (f.key === "genre" || f.key === "type") {
    const options =
      f.key === "genre"
        ? Object.keys(genreColorMap)
        : Object.keys(typeColorMap);
    const colorMap = f.key === "genre" ? genreColorMap : typeColorMap;
    const arr: string[] = Array.isArray(v)
      ? v.filter((item): item is string => typeof item === "string")
      : typeof v === "string"
        ? [v]
        : [];
    return (
      <>
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => {
            const selected = arr.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                className={`px-3 py-1 text-xs rounded-full border transition select-none focus:outline-none ${colorMap[opt]} ${selected ? "ring-2 ring-blue-500 border-blue-500" : "border-transparent opacity-80"}`}
                onClick={() => {
                  const next = selected
                    ? arr.filter((x) => x !== opt)
                    : [...arr, opt];
                  handleChange(next);
                }}
              >
                {opt}
                {selected && <span className="ml-1">✔</span>}
              </button>
            );
          })}
        </div>
        <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          可多选，点击标签切换
        </div>
        {errorMsg && (
          <div className="text-red-500 text-xs mt-1">{errorMsg}</div>
        )}
      </>
    );
  }

  if (f.type === "textarea") {
    return (
      <>
        <textarea
          value={typeof v === "string" ? v : ""}
          onChange={(e) => handleChange(e.target.value)}
          rows={4}
          className={baseInputClass + " resize-vertical"}
          placeholder={`请输入${f.label}`}
          maxLength={f.maxLength}
        />
        {errorMsg && (
          <div className="text-red-500 text-xs mt-1">{errorMsg}</div>
        )}
      </>
    );
  }
  if (f.type === "array") {
    const arr: string[] = Array.isArray(v)
      ? v.filter((item): item is string => typeof item === "string")
      : typeof v === "string"
        ? [v]
        : [];
    return (
      <>
        <div className="space-y-2">
          {arr.length === 0 && (
            <div className="text-slate-400 dark:text-slate-500 text-xs mb-2 pl-1">
              暂无{f.label}
            </div>
          )}
          {arr.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 mb-1 group">
              <input
                value={typeof item === "string" ? item : ""}
                onChange={(e) => {
                  const newArr = [...arr];
                  newArr[idx] = e.target.value;
                  handleChange(newArr);
                }}
                className={
                  baseInputClass +
                  " flex-1 border-l-4 border-transparent group-hover:border-blue-500 focus:border-blue-500"
                }
                placeholder={`请输入${f.label}`}
                maxLength={f.arrayMaxLength}
              />
              <button
                type="button"
                onClick={() => {
                  const newArr = arr.filter((_, i) => i !== idx);
                  handleChange(newArr);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 text-red-500 hover:bg-red-500 hover:text-white dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white transition-all duration-200 focus:outline-none"
                title="删除"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                  <path
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    d="M4 4l8 8M12 4l-8 8"
                  />
                </svg>
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => handleChange([...arr, ""])}
            className="mt-1 flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/20 dark:text-blue-300 dark:hover:bg-blue-500/30 transition-all duration-200 text-xs font-medium"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
              <path
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                d="M7 2v10M2 7h10"
              />
            </svg>
            添加{f.label}
          </button>
        </div>
        {errorMsg && (
          <div className="text-red-500 text-xs mt-1">{errorMsg}</div>
        )}
      </>
    );
  }
  if (f.type === "boolean") {
    // 特殊处理封面字段
    if (f.key === "hascover") {
      return (
        <>
          <select
            value={v === true ? "true" : v === false ? "false" : ""}
            onChange={(e) =>
              handleChange(
                e.target.value === "true"
                  ? true
                  : e.target.value === "false"
                    ? false
                    : null,
              )
            }
            className={baseInputClass}
          >
            <option
              value=""
              className="filter-option text-slate-900 dark:text-slate-200 bg-white dark:bg-slate-900"
            >
              白底狐狸（默认）
            </option>
            <option
              value="false"
              className="filter-option text-slate-900 dark:text-slate-200 bg-white dark:bg-slate-900"
            >
              初号机（黑底机器人）
            </option>
            <option
              value="true"
              className="filter-option text-slate-900 dark:text-slate-200 bg-white dark:bg-slate-900"
            >
              定制封面
            </option>
          </select>

          {/* 当选择定制封面时显示上传组件 */}
          {v === true && (
            <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <CoverUpload
                songId={typeof state.id === "number" ? state.id : undefined}
                csrfToken={csrfToken}
                hasExistingFile={state.hascover === true}
                onUploadSuccess={() => {
                  // Cover upload success handled by component
                }}
                onUploadError={(error) => {
                  console.error("Cover upload error:", error);
                }}
              />
            </div>
          )}

          {errorMsg && (
            <div className="text-red-500 text-xs mt-1">{errorMsg}</div>
          )}
        </>
      );
    }

    // 特殊处理乐谱字段
    if (f.key === "nmn_status") {
      return (
        <>
          <select
            value={v === true ? "true" : v === false ? "false" : ""}
            onChange={(e) =>
              handleChange(
                e.target.value === "true"
                  ? true
                  : e.target.value === "false"
                    ? false
                    : null,
              )
            }
            className={baseInputClass}
          >
            <option
              value="false"
              className="filter-option text-slate-900 dark:text-slate-200 bg-white dark:bg-slate-900"
            >
              无乐谱
            </option>
            <option
              value="true"
              className="filter-option text-slate-900 dark:text-slate-200 bg-white dark:bg-slate-900"
            >
              有乐谱
            </option>
          </select>

          {/* 当选择是时显示上传组件 */}
          {v === true && (
            <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <ScoreUpload
                songId={typeof state.id === "number" ? state.id : undefined}
                csrfToken={csrfToken}
                hasExistingFile={state.nmn_status === true}
                onUploadSuccess={() => {
                  // Score upload success handled by component
                }}
                onUploadError={(error) => {
                  console.error("Score upload error:", error);
                }}
              />
            </div>
          )}

          {errorMsg && (
            <div className="text-red-500 text-xs mt-1">{errorMsg}</div>
          )}
        </>
      );
    }

    // 其他boolean字段的默认处理
    return (
      <>
        <select
          value={v === true ? "true" : v === false ? "false" : ""}
          onChange={(e) =>
            handleChange(
              e.target.value === "true"
                ? true
                : e.target.value === "false"
                  ? false
                  : null,
            )
          }
          className={baseInputClass}
        >
          <option
            value=""
            className="text-slate-900 dark:text-slate-200 bg-white dark:bg-slate-900"
          >
            请选择
          </option>
          <option
            value="true"
            className="text-slate-900 dark:text-slate-200 bg-white dark:bg-slate-900"
          >
            是
          </option>
          <option
            value="false"
            className="text-slate-900 dark:text-slate-200 bg-white dark:bg-slate-900"
          >
            否
          </option>
        </select>
        {errorMsg && (
          <div className="text-red-500 text-xs mt-1">{errorMsg}</div>
        )}
      </>
    );
  }
  if (f.type === "number") {
    return (
      <>
        <input
          type="number"
          value={typeof v === "number" && !isNaN(v) ? v : ""}
          onChange={(e) =>
            handleChange(e.target.value === "" ? null : Number(e.target.value))
          }
          className={baseInputClass}
          placeholder={`请输入${f.label}`}
          min={f.min}
          step={1}
        />
        {errorMsg && (
          <div className="text-red-500 text-xs mt-1">{errorMsg}</div>
        )}
      </>
    );
  }
  if (f.type === "date") {
    return (
      <>
        <input
          type="date"
          value={typeof v === "string" ? v.slice(0, 10) : ""}
          onChange={(e) => handleChange(e.target.value)}
          className={baseInputClass}
          maxLength={f.maxLength}
        />
        {errorMsg && (
          <div className="text-red-500 text-xs mt-1">{errorMsg}</div>
        )}
      </>
    );
  }
  return (
    <>
      <input
        value={typeof v === "string" ? v : ""}
        onChange={(e) => handleChange(e.target.value)}
        className={baseInputClass}
        placeholder={`请输入${f.label}`}
        maxLength={f.maxLength}
        type={f.isUrl ? "url" : "text"}
      />
      {errorMsg && <div className="text-red-500 text-xs mt-1">{errorMsg}</div>}
    </>
  );
}
