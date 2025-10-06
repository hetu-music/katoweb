"use client";
import React, { useState, useCallback, useEffect } from "react";
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
import type { Song, SongDetail, SongFieldConfig } from "../../lib/types";
import {
  convertEmptyStringToNull,
  formatField,
  validateField,
} from "../../lib/utils";
import { songFields, genreColorMap, typeColorMap } from "../../lib/constants";
import FloatingActionButtons from "../../components/FloatingActionButtons";
import Pagination from "../../components/Pagination";
import { usePagination } from "../../hooks/usePagination";
import { apiCreateSong, apiUpdateSong } from "../../lib/api";
import { useSongs } from "../../hooks/useSongs";
import { useAuth } from "../../hooks/useAuth";
import Account from "./Account";
import Notification from "./Notification";
import CoverUpload from "./CoverUpload";
import ScoreUpload from "./ScoreUpload";

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
    return (
      <>
        <tr className="border-b border-white/10 hover:bg-white/5 transition-colors">
          <td className="py-4 px-4 text-white/90">{idx + 1}</td>
          <td className="py-4 px-4 text-white/90 font-medium">{song.title}</td>
          <td className="py-4 px-4 text-white/80 hidden md:table-cell">
            {song.album || "-"}
          </td>
          <td className="py-4 px-4 text-white/80 hidden md:table-cell">
            {Array.isArray(song.lyricist)
              ? song.lyricist.join(", ")
              : song.lyricist || "-"}
          </td>
          <td className="py-4 px-4 text-white/80 hidden md:table-cell">
            {Array.isArray(song.composer)
              ? song.composer.join(", ")
              : song.composer || "-"}
          </td>
          <td className="py-4 px-4 text-white/80 hidden md:table-cell">
            {Array.isArray(song.type) ? song.type.join(", ") : song.type || "-"}
          </td>
          <td className="py-4 px-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleRowExpansion(song.id)}
                className="p-2 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 hover:text-blue-200 transition-all duration-200"
                title="查看详情"
              >
                {expandedRows.has(song.id) ? (
                  <EyeOff size={16} />
                ) : (
                  <Eye size={16} />
                )}
              </button>
              <button
                onClick={() => handleEdit(song)}
                className="p-2 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 hover:text-green-200 transition-all duration-200"
                title="编辑"
              >
                <Edit size={16} />
              </button>
            </div>
          </td>
        </tr>
        {expandedRows.has(song.id) && (
          <tr>
            <td colSpan={7} className="py-4 px-4 bg-white/5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {songFields.map((field) => (
                  <div key={field.key} className="flex flex-col">
                    <span className="text-blue-300 text-sm font-medium mb-1">
                      {field.label}:
                    </span>
                    <span className="text-white/80 text-sm break-words">
                      {field.key === "hascover"
                        ? song.hascover === true
                          ? "定制封面"
                          : song.hascover === false
                            ? "初号机（黑底机器人）"
                            : "白底狐狸（默认）"
                        : field.key === "nmn_status"
                          ? song.nmn_status === true
                            ? "有乐谱"
                            : "无乐谱"
                          : formatField(song[field.key], field.type)}
                    </span>
                  </div>
                ))}
              </div>
            </td>
          </tr>
        )}
      </>
    );
  },
);
SongRow.displayName = "SongRow";

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

  const {
    songs,
    setSongs,
    loading,
    setLoading,
    error,
    setError,
    searchTerm,
    setSearchTerm,
    filteredSongs,
    sortedSongs,
  } = useSongs(
    initialSongs,
    initialError,
    isClient ? searchParams?.get("q") || "" : "",
  );

  // 分页状态 - 使用默认值避免 hydration 错误
  const [currentPageState, setCurrentPageState] = useState(1);

  // 在客户端挂载后更新分页状态
  useEffect(() => {
    if (isClient && searchParams) {
      const pageFromUrl = parseInt(searchParams.get("page") || "1", 10);
      if (pageFromUrl !== currentPageState) {
        setCurrentPageState(pageFromUrl);
      }
    }
  }, [isClient, searchParams, currentPageState]);

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
    initialPage: currentPageState,
  });

  // 包装分页函数以同步URL
  const setCurrentPage = (page: number) => {
    setCurrentPageState(page);
    // 不需要调用 setPaginationPage，因为 usePagination 会通过 initialPage 自动更新
  };
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

  // URL同步逻辑 - 只在客户端执行
  useEffect(() => {
    if (!isClient || typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    if (searchTerm) params.set("q", searchTerm);
    else params.delete("q");
    if (currentPageState && currentPageState !== 1)
      params.set("page", currentPageState.toString());
    else params.delete("page");
    const newUrl = `${window.location.pathname}${params.toString() ? "?" + params.toString() : ""}`;
    if (newUrl !== window.location.pathname + window.location.search) {
      window.history.replaceState(null, "", newUrl);
      // 更新本地的 searchParams 状态
      setSearchParams(new URLSearchParams(params.toString()));
    }
  }, [searchTerm, currentPageState, isClient]);

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
        setLoading(true);
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
        setLoading(false);
      }
    },
    [newSong, csrfToken, setLoading, setSongs],
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
        setLoading(true);
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
        setLoading(false);
      }
    },
    [editSong, editForm, csrfToken, setLoading, setSongs],
  );

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8 flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1
              className="text-4xl font-bold text-white mb-0 cursor-pointer hover:text-blue-200 transition-colors duration-300 select-none"
              onClick={() => {
                // 重置搜索条件和页面
                setSearchTerm("");
                setCurrentPageState(1);
                setPaginationPage(1);
              }}
              title="点击重置搜索条件"
            >
              管理页面
            </h1>
            {/* 通知按钮 */}
            <button
              onClick={() => setShowNotification(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 text-blue-200 hover:from-blue-500/30 hover:to-purple-500/30 hover:text-blue-100 transition-all duration-200 shadow-sm font-medium"
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
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 search-container">
            <div className="h-[48px] flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/20 border-r-0 text-white rounded-l-2xl select-none min-w-[60px] max-w-[60px] w-[60px]">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="搜索歌曲、专辑等..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              style={{ marginLeft: "-1px" }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full text-gray-300 hover:text-white focus:outline-none bg-transparent active:bg-white/10 transition-all"
                aria-label="清空搜索"
              >
                <XCircle size={24} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 text-green-200 hover:from-green-500/30 hover:to-emerald-500/30 hover:text-green-100 transition-all duration-200 shadow-sm font-medium whitespace-nowrap"
          >
            <Plus size={20} />
            新增歌曲
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 sm:gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-white/20 rounded-full px-3 sm:px-4 py-2 shadow-sm min-w-0">
            <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse flex-shrink-0"></div>
            <span className="text-white font-medium text-xs sm:text-sm whitespace-nowrap">
              总计{" "}
              <span className="text-blue-200 font-semibold">
                {songs.length}
              </span>{" "}
              首
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-amber-300/30 rounded-full px-3 sm:px-4 py-2 shadow-sm min-w-0">
            <div className="w-2 h-2 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full flex-shrink-0"></div>
            <span className="text-white font-medium text-xs sm:text-sm whitespace-nowrap">
              筛选结果{" "}
              <span className="text-amber-200 font-semibold">
                {filteredSongs.length}
              </span>{" "}
              首
            </span>
          </div>
          {filteredSongs.length > 25 && (
            <div className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-sm border border-emerald-300/30 rounded-full px-3 sm:px-4 py-2 shadow-sm min-w-0">
              <div className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full flex-shrink-0"></div>
              <span className="text-white font-medium text-xs sm:text-sm whitespace-nowrap">
                当前页{" "}
                <span className="text-emerald-200 font-semibold">
                  {startIndex}-{endIndex}
                </span>{" "}
                首
              </span>
            </div>
          )}
        </div>

        {/* Loading and Error States */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <p className="text-white mt-2">加载中...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-4 mb-6">
            <p className="text-red-200">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-red-300 hover:text-red-100 text-sm underline"
            >
              关闭
            </button>
          </div>
        )}

        {/* Songs Table */}
        {!loading && (
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-white/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left py-4 px-4 text-white font-semibold">
                      序号
                    </th>
                    <th className="text-left py-4 px-4 text-white font-semibold">
                      标题
                    </th>
                    <th className="text-left py-4 px-4 text-white font-semibold hidden md:table-cell">
                      专辑
                    </th>
                    <th className="text-left py-4 px-4 text-white font-semibold hidden md:table-cell">
                      作词
                    </th>
                    <th className="text-left py-4 px-4 text-white font-semibold hidden md:table-cell">
                      作曲
                    </th>
                    <th className="text-left py-4 px-4 text-white font-semibold hidden md:table-cell">
                      类型
                    </th>
                    <th className="text-left py-4 px-4 text-white font-semibold">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
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
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        {/* No Results */}
        {!loading && filteredSongs.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 text-lg mb-2">没有找到匹配的歌曲</div>
            <div className="text-gray-500 text-sm">尝试调整搜索条件</div>
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {(showAdd || editSong) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-gradient-to-br from-purple-800 via-blue-900 to-indigo-900 border border-white/20 rounded-2xl shadow-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
                      " flex flex-col gap-2 bg-white/5 rounded-xl p-4 border border-white/10 shadow-sm"
                    }
                  >
                    <label className="block text-blue-100 font-semibold mb-1 text-sm tracking-wide">
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
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500/80 to-emerald-600/80 border-2 border-green-400/60 text-white hover:from-green-500 hover:to-emerald-600 hover:border-green-300 transition-all duration-200 font-semibold shadow-lg backdrop-blur-sm flex items-center justify-center group"
                  title={showAdd ? "提交" : "保存"}
                >
                  <Save
                    size={20}
                    className="group-hover:scale-110 transition-transform duration-200"
                  />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowAdd(false);
                    setEditSong(null);
                    setAddResultMessage(null);
                    setEditResultMessage(null);
                  }}
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-500/80 to-gray-600/80 border-2 border-gray-400/60 text-white hover:from-gray-500 hover:to-gray-600 hover:border-gray-300 transition-all duration-200 font-semibold shadow-lg backdrop-blur-sm flex items-center justify-center group"
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
            className={`relative max-w-sm w-full p-6 rounded-2xl shadow-2xl border-2 backdrop-blur-md transform transition-all duration-300 animate-in zoom-in-95 slide-in-from-bottom-2
            ${
              addResultMessage === "成功" || editResultMessage === "成功"
                ? "bg-gradient-to-br from-green-500/90 to-emerald-600/90 border-green-400/60 text-white"
                : "bg-gradient-to-br from-red-500/90 to-red-600/90 border-red-400/60 text-white"
            }
          `}
          >
            {/* 装饰性背景元素 */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent opacity-50"></div>

            {/* 图标和消息 */}
            <div className="relative flex flex-col items-center text-center space-y-4">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  addResultMessage === "成功" || editResultMessage === "成功"
                    ? "bg-green-400/30 border-2 border-green-300/50"
                    : "bg-red-400/30 border-2 border-red-300/50"
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
                <h3
                  className={`text-xl font-bold mb-2 ${
                    addResultMessage === "成功" || editResultMessage === "成功"
                      ? "text-green-100"
                      : "text-red-100"
                  }`}
                >
                  {addResultMessage === "成功" || editResultMessage === "成功"
                    ? "操作成功"
                    : "操作失败"}
                </h3>
                <p
                  className={`text-sm opacity-90 ${
                    addResultMessage === "成功" || editResultMessage === "成功"
                      ? "text-green-200"
                      : "text-red-200"
                  }`}
                >
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
              className={`absolute top-3 right-3 p-1 rounded-full hover:bg-white/20 transition-colors duration-200 ${
                addResultMessage === "成功" || editResultMessage === "成功"
                  ? "text-green-200"
                  : "text-red-200"
              }`}
            >
              <X size={16} />
            </button>

            {/* 自动关闭倒计时 */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 rounded-b-2xl overflow-hidden">
              <div
                className={`h-full transition-all duration-3000 ease-linear ${
                  addResultMessage === "成功" || editResultMessage === "成功"
                    ? "bg-green-300"
                    : "bg-red-300"
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
    "w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white/15 transition-all duration-200 rounded-xl";
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
                className={`px-3 py-1 text-xs rounded-full border transition select-none focus:outline-none ${colorMap[opt]} ${selected ? "ring-2 ring-blue-400 border-blue-400/80" : "border-transparent opacity-80"}`}
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
        <div className="text-xs text-gray-400 mt-1">可多选，点击标签切换</div>
        {errorMsg && (
          <div className="text-red-400 text-xs mt-1">{errorMsg}</div>
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
          <div className="text-red-400 text-xs mt-1">{errorMsg}</div>
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
            <div className="text-gray-400 text-xs mb-2 pl-1">暂无{f.label}</div>
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
                  " flex-1 border-l-4 border-transparent group-hover:border-blue-400 focus:border-blue-400 bg-white/15"
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
                className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500/20 text-red-200 hover:bg-red-500/60 hover:text-white transition-all duration-200 focus:outline-none"
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
            className="mt-1 flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-500/20 text-blue-200 hover:bg-blue-500/40 hover:text-white transition-all duration-200 text-xs font-medium"
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
          <div className="text-red-400 text-xs mt-1">{errorMsg}</div>
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
            <option value="" className="filter-option">
              白底狐狸（默认）
            </option>
            <option value="false" className="filter-option">
              初号机（黑底机器人）
            </option>
            <option value="true" className="filter-option">
              定制封面
            </option>
          </select>

          {/* 当选择定制封面时显示上传组件 */}
          {v === true && (
            <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
              <CoverUpload
                songId={typeof state.id === "number" ? state.id : undefined}
                csrfToken={csrfToken}
                hasExistingFile={state.hascover === true}
                onUploadSuccess={() => {
                  console.log("Cover uploaded successfully");
                }}
                onUploadError={(error) => {
                  console.error("Cover upload error:", error);
                }}
              />
            </div>
          )}

          {errorMsg && (
            <div className="text-red-400 text-xs mt-1">{errorMsg}</div>
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
            <option value="false" className="filter-option">
              无乐谱
            </option>
            <option value="true" className="filter-option">
              有乐谱
            </option>
          </select>

          {/* 当选择是时显示上传组件 */}
          {v === true && (
            <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
              <ScoreUpload
                songId={typeof state.id === "number" ? state.id : undefined}
                csrfToken={csrfToken}
                hasExistingFile={state.nmn_status === true}
                onUploadSuccess={() => {
                  console.log("Score uploaded successfully");
                }}
                onUploadError={(error) => {
                  console.error("Score upload error:", error);
                }}
              />
            </div>
          )}

          {errorMsg && (
            <div className="text-red-400 text-xs mt-1">{errorMsg}</div>
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
          <option value="">请选择</option>
          <option value="true">是</option>
          <option value="false">否</option>
        </select>
        {errorMsg && (
          <div className="text-red-400 text-xs mt-1">{errorMsg}</div>
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
          <div className="text-red-400 text-xs mt-1">{errorMsg}</div>
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
          <div className="text-red-400 text-xs mt-1">{errorMsg}</div>
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
      {errorMsg && <div className="text-red-400 text-xs mt-1">{errorMsg}</div>}
    </>
  );
}
