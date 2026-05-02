"use client";

import FloatingActionButtons from "@/components/shared/FloatingActionButtons";
import Pagination from "@/components/shared/Pagination";
import ThemeToggle from "@/components/shared/ThemeToggle";
import { useSyncedQueryState } from "@/hooks/useSyncedQueryState";
import {
  mergeAutoCompleteData,
  useAutoComplete,
} from "@/hooks/useAutoComplete";

import { useSongs } from "@/hooks/useSongs";
import {
  type MusicProviderType,
  type SearchResultItem,
} from "@/lib/api-auto-complete";
import { apiCreateSong, apiUpdateSong } from "@/lib/client-api";
import { genreColorMap, songFields, typeColorMap } from "@/lib/constants";
import {
  createEmptySongFormState,
  songFormStateSchema,
  toSongFormPayload,
  toSongFormState,
  type SongArrayFieldItem,
  type SongFormStateValues,
} from "@/lib/song-form";
import type {
  Song,
  SongDetail,
  SongFieldConfig,
  SongFormFieldKey,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { convertEmptyStringToNull, formatField } from "@/lib/utils-common";
import { getCoverUrl } from "@/lib/utils-song";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Edit,
  Eye,
  EyeOff,
  Home,
  Plus,
  Save,
  Search,
  User,
  Wand2,
  X,
  XCircle,
  Tag,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { parseAsInteger, parseAsString } from "nuqs";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Controller,
  FormProvider,
  type Resolver,
  useFieldArray,
  useForm,
  useFormContext,
} from "react-hook-form";
import CoverUpload from "./CoverUpload";
import Notification from "./Notification";
import ScoreUpload from "./ScoreUpload";

// Reuse CoverArt logic simply for small thumbs
const AdminCoverArt = ({
  song,
  className,
}: {
  song: Song;
  className?: string;
}) => {
  const coverUrl = getCoverUrl(song);
  return (
    <div
      className={cn(
        "relative overflow-hidden w-full h-full bg-slate-100 dark:bg-slate-800",
        className,
      )}
    >
      <Image
        src={coverUrl}
        alt={song.title}
        width={100}
        height={100}
        className="w-full h-full object-cover"
      />
    </div>
  );
};

function getInputValue(value: string | number | null | undefined) {
  return value ?? "";
}

function hasSongId(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

const CREATOR_FIELD_KEYS = [
  "lyricist",
  "composer",
  "arranger",
  "artist",
  "albumartist",
] as const satisfies readonly SongFormFieldKey[];

type CreatorFieldKey = (typeof CREATOR_FIELD_KEYS)[number];

const MISSING_FIELD_LABEL_OVERRIDES: Partial<Record<SongFormFieldKey, string>> = {
  lyrics: "歌词",
};

function isCreatorFieldKey(value: SongFormFieldKey): value is CreatorFieldKey {
  return CREATOR_FIELD_KEYS.includes(value as CreatorFieldKey);
}

// --- Logic Helpers ---

function isSongIncomplete(song: SongDetail): boolean {
  for (const field of songFields) {
    if (
      ["hascover", "kugolink", "qmlink", "nelink", "comment"].includes(
        field.key,
      )
    )
      continue;
    const value = song[field.key];
    if (field.key === "nmn_status") {
      if (value !== true) return true;
      continue;
    }
    if (value === null || value === undefined) return true;
    if (Array.isArray(value) && value.length === 0) return true;
    if (typeof value === "string" && value.trim() === "") return true;
  }
  return false;
}

function getMissingFields(song: SongDetail): string[] {
  const missing: string[] = [];
  for (const field of songFields) {
    if (
      ["hascover", "kugolink", "qmlink", "nelink", "comment"].includes(
        field.key,
      )
    )
      continue;
    const value = song[field.key];
    let isEmpty = false;
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
      missing.push(MISSING_FIELD_LABEL_OVERRIDES[field.key] ?? field.label);
    }
  }
  return missing;
}

// --- Component: AdminListRow ---

const AdminListRow = React.memo(
  ({
    song,
    idx,
    isExpanded,
    toggleRowExpansion,
    handleEdit,
  }: {
    song: SongDetail;
    idx: number;
    isExpanded: boolean;
    toggleRowExpansion: (id: number) => void;
    handleEdit: (song: SongDetail) => void;
  }) => {
    const missingFields = getMissingFields(song);
    const visibleMissingFields = missingFields.slice(0, 4);
    const hiddenMissingCount = missingFields.length - visibleMissingFields.length;

    return (
      <div className="flex flex-col bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden transition-all hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900/30">
        {/* Main Row Content */}
        <div
          className={cn(
            "flex items-center gap-4 p-4 cursor-pointer transition-colors",
            isExpanded ? "bg-slate-50 dark:bg-slate-800/80" : "",
          )}
          onClick={() => toggleRowExpansion(song.id)}
        >
          {/* Index */}
          <div className="w-8 shrink-0 text-center font-mono text-sm text-slate-400">
            {idx}
          </div>

          {/* Cover */}
          <div className="w-12 h-12 shrink-0 rounded-md overflow-hidden border border-slate-100 dark:border-slate-700">
            <AdminCoverArt song={song} />
          </div>

          {/* Title & Status */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="max-w-full font-medium text-slate-900 dark:text-slate-100 truncate">
                {song.title}
              </h3>
              {visibleMissingFields.map((field) => (
                <span
                  key={field}
                  className="shrink-0 inline-flex items-center rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:border-amber-700/50 dark:bg-amber-900/40 dark:text-amber-300"
                >
                  {field}
                </span>
              ))}
              {hiddenMissingCount > 0 && (
                <span className="shrink-0 inline-flex items-center rounded-full border border-amber-200/80 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300">
                  +{hiddenMissingCount}项
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 truncate">
              <span>{song.album || "未归档"}</span>
              <span className="opacity-40">/</span>
              <span>
                {Array.isArray(song.lyricist)
                  ? song.lyricist.join(", ")
                  : song.lyricist || "-"}
              </span>
            </div>
          </div>

          {/* Meta Info (Desktop) */}
          <div className="hidden lg:flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400 shrink-0 mr-4">
            <div className="w-32 text-right truncate">
              {Array.isArray(song.composer)
                ? song.composer.join(", ")
                : song.composer || "-"}
            </div>
            <div className="w-24 text-center">
              {Array.isArray(song.type) && song.type[0] ? (
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs border",
                    typeColorMap[song.type[0]]
                      ?.replace("bg-", "border-")
                      .replace("text-", "text-") || "border-slate-200",
                  )}
                >
                  {song.type[0]}
                </span>
              ) : (
                "-"
              )}
            </div>
          </div>

          {/* Actions */}
          <div
            className="flex items-center gap-2 shrink-0 ml-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(song);
              }}
              className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20 transition-colors"
              title="编辑"
            >
              <Edit size={18} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleRowExpansion(song.id);
              }}
              className={cn(
                "p-2 rounded-lg transition-colors",
                isExpanded
                  ? "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20"
                  : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
              )}
            >
              {isExpanded ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-black/20 p-6 animate-in slide-in-from-top-2 duration-200">
            <ExpandedContent song={song} />
          </div>
        )}
      </div>
    );
  },
);
AdminListRow.displayName = "AdminListRow";

// --- Component: ExpandedContent ---

function ExpandedContent({ song }: { song: SongDetail }) {
  const missing = getMissingFields(song);

  return (
    <div className="space-y-6">
      {missing.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">
              信息待完善
            </h4>
            <div className="flex flex-wrap gap-2">
              {missing.map((field) => (
                <span
                  key={field}
                  className="px-2 py-0.5 text-xs bg-white dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800 rounded-md text-amber-800 dark:text-amber-300"
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

          const isCritical = ![
            "hascover",
            "kugolink",
            "qmlink",
            "nelink",
            "comment",
          ].includes(field.key);
          const shouldHighlight = isCritical && isEmpty;

          return (
            <div
              key={field.key}
              className={cn(
                "p-3 rounded-lg border text-sm transition-colors",
                shouldHighlight
                  ? "bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30"
                  : "bg-white border-slate-100 dark:bg-slate-800 dark:border-slate-700",
              )}
            >
              <div className="flex justify-between mb-1">
                <span
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wider",
                    shouldHighlight
                      ? "text-red-600 dark:text-red-400"
                      : "text-slate-400 dark:text-slate-500",
                  )}
                >
                  {field.label}
                </span>
                {shouldHighlight && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                )}
              </div>

              <div
                className={cn(
                  "font-medium truncate",
                  shouldHighlight
                    ? "text-red-700 dark:text-red-300"
                    : "text-slate-700 dark:text-slate-200",
                )}
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
                    <span className="text-slate-400">默认</span>
                  )
                ) : field.key === "nmn_status" ? (
                  song.nmn_status === true ? (
                    <span className="text-green-600 dark:text-green-400">
                      ✓ 有乐谱
                    </span>
                  ) : (
                    <span className="text-slate-400">无乐谱</span>
                  )
                ) : (
                  formatField(song[field.key], field.type) || "-"
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Main Component ---

export default function AdminClientComponent({
  initialSongs,
  initialError,
}: {
  initialSongs: SongDetail[];
  initialError: string | null;
}) {
  // States
  const [searchTerm, setSearchTerm] = useSyncedQueryState<string>(
    "q",
    parseAsString.withDefault("").withOptions({
      shallow: true,
    }),
  );
  const [currentPage, setCurrentPage] = useSyncedQueryState<number>(
    "page",
    parseAsInteger.withDefault(1).withOptions({
      shallow: true,
    }),
  );
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);

  // Data Hooks
  const {
    songs,
    setSongs,
    loading,
    filteredSongs: baseFilteredSongs,
    sortedSongs: baseSortedSongs,
  } = useSongs(initialSongs, initialError, searchTerm);

  // Filter Logic
  const filteredSongs = useMemo(() => {
    return showIncompleteOnly
      ? baseFilteredSongs.filter(isSongIncomplete)
      : baseFilteredSongs;
  }, [baseFilteredSongs, showIncompleteOnly]);

  const sortedSongs = useMemo(() => {
    return showIncompleteOnly
      ? baseSortedSongs.filter(isSongIncomplete)
      : baseSortedSongs;
  }, [baseSortedSongs, showIncompleteOnly]);

  const ITEMS_PER_PAGE = 24;
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(sortedSongs.length / ITEMS_PER_PAGE)),
    [sortedSongs.length],
  );
  const safePage = useMemo(
    () => Math.min(Math.max(1, currentPage), totalPages),
    [currentPage, totalPages],
  );
  const paginatedSongs = useMemo(() => {
    const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
    return sortedSongs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedSongs, safePage]);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE + 1;

  useEffect(() => {
    if (safePage !== currentPage) {
      setCurrentPage(safePage);
    }
  }, [currentPage, safePage, setCurrentPage]);

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, page));
    },
    [setCurrentPage],
  );

  // Auth & Actions
  const [csrfToken, setCsrfToken] = useState("");
  useEffect(() => {
    fetch("/api/public/csrf-token")
      .then((r) => r.json())
      .then((d) => setCsrfToken(d.csrfToken || ""));
  }, []);
  const [formMode, setFormMode] = useState<"add" | "edit" | null>(null);
  const [editSong, setEditSong] = useState<SongDetail | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [operationMsg, setOperationMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const songForm = useForm<SongFormStateValues>({
    resolver: zodResolver(songFormStateSchema) as Resolver<SongFormStateValues>,
    defaultValues: createEmptySongFormState(),
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  // 自动补全 Hook
  const autoComplete = useAutoComplete(csrfToken, (msg) => {
    setOperationMsg({ type: "error", text: msg });
    setTimeout(() => setOperationMsg(null), 3000);
  });

  // Scroll listener
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 200);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Notification Auto-Show
  useEffect(() => {
    const lastTime = localStorage.getItem("lastNotificationTime");
    const now = Date.now();
    if (!lastTime || now - parseInt(lastTime) > 3600000) {
      const t = setTimeout(() => {
        setShowNotification(true);
        localStorage.setItem("lastNotificationTime", now.toString());
      }, 1000);
      return () => clearTimeout(t);
    }
  }, []);

  const scrollToTop = useCallback(
    () => window.scrollTo({ top: 0, behavior: "smooth" }),
    [],
  );

  const toggleRowExpansion = useCallback((id: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const closeSongForm = useCallback(() => {
    setFormMode(null);
    setEditSong(null);
    autoComplete.reset();
    songForm.reset(createEmptySongFormState());
  }, [autoComplete, songForm]);

  const openAddForm = useCallback(() => {
    setEditSong(null);
    setFormMode("add");
    autoComplete.reset();
    songForm.reset(createEmptySongFormState());
  }, [autoComplete, songForm]);

  const startEdit = useCallback(
    (song: SongDetail) => {
      setEditSong(song);
      setFormMode("edit");
      autoComplete.reset();
      songForm.reset(toSongFormState(song));
    },
    [autoComplete, songForm],
  );

  const handleSongSubmit = songForm.handleSubmit(async (data) => {
    if (!csrfToken) {
      setOperationMsg({ type: "error", text: "缺少安全令牌，请刷新后重试" });
      setTimeout(() => setOperationMsg(null), 3000);
      return;
    }

    const payload = toSongFormPayload(data);

    try {
      if (formMode === "add") {
        const created = await apiCreateSong(
          convertEmptyStringToNull(payload),
          csrfToken,
        );
        setSongs((prev) => [...prev, created]);
        closeSongForm();
        setOperationMsg({ type: "success", text: "创建成功" });
      } else if (formMode === "edit" && editSong) {
        const updated = await apiUpdateSong(
          editSong.id,
          {
            ...convertEmptyStringToNull(payload),
            updated_at: editSong.updated_at,
          },
          csrfToken,
        );
        setSongs((prev) =>
          prev.map((s) => (s.id === updated.id ? updated : s)),
        );
        closeSongForm();
        setOperationMsg({ type: "success", text: "更新成功" });
      }
    } catch (err: unknown) {
      setOperationMsg({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : formMode === "add"
              ? "创建失败"
              : "更新失败",
      });
    } finally {
      setTimeout(() => setOperationMsg(null), 3000);
    }
  });

  // 自动补全处理函数
  const handleAutoComplete = async (provider: MusicProviderType) => {
    const values = toSongFormPayload(songForm.getValues());
    const artists = Array.isArray(values.artist) ? values.artist : undefined;
    await autoComplete.handleAutoComplete(provider, values.title, artists);
  };

  const handleSelectSearchResult = async (song: SearchResultItem) => {
    const data = await autoComplete.handleSelectSearchResult(song);
    if (data) {
      songForm.reset(
        toSongFormState(
          mergeAutoCompleteData(toSongFormPayload(songForm.getValues()), data),
        ),
      );
      setOperationMsg({ type: "success", text: "自动补全成功" });
      setTimeout(() => setOperationMsg(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0F19] transition-colors duration-500 font-sans">
      {/* Navbar to match MusicLibraryClient */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FAFAFA]/80 dark:bg-[#0B0F19]/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="text-2xl font-bold tracking-tight flex items-center gap-1 font-serif text-slate-900 dark:text-white">
            勘鉴
            <span className="w-[2px] h-5 bg-blue-600 mx-2 rounded-full translate-y-[1.5px]" />
            管理后台
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNotification(true)}
              className="p-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
              title="使用说明"
            >
              <Bell size={20} />
            </button>
            <ThemeToggle className="p-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400" />
            <Link
              href="/profile"
              className="p-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
              title="个人中心"
            >
              <User size={20} />
            </Link>
            <Link
              href="/"
              className="p-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
              title="返回主页"
            >
              <Home size={20} />
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 max-w-7xl mx-auto px-6">
        {/* Header & Stats */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50 mb-4">
              Dashboard
            </h1>
            <div className="flex flex-wrap gap-3">
              <div className="px-3 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-sm font-medium border border-blue-100 dark:border-blue-800">
                总计 {songs.length} 首
              </div>
              {showIncompleteOnly && (
                <div className="px-3 py-1 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 rounded-full text-sm font-medium border border-amber-100 dark:border-amber-800">
                  待完善 {filteredSongs.length} 首
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/imagery"
              className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-full font-medium shadow-sm hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700 transition-all hover:-translate-y-0.5"
            >
              <Tag size={18} className="text-violet-500" />
              <span>意象管理</span>
            </Link>
            <button
              onClick={openAddForm}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-medium shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
            >
              <Plus size={20} />
              <span>新增歌曲</span>
            </button>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="sticky top-20 z-40 bg-[#FAFAFA]/95 dark:bg-[#0B0F19]/95 backdrop-blur-sm py-4 mb-8 -mx-6 px-6 border-y border-transparent data-[scrolled=true]:border-slate-100">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Filter Pills */}
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
              <button
                onClick={() => {
                  setShowIncompleteOnly(false);
                  setCurrentPage(1);
                }}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm border transition-all whitespace-nowrap",
                  !showIncompleteOnly
                    ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white"
                    : "bg-transparent text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-300",
                )}
              >
                全部歌曲
              </button>
              <button
                onClick={() => {
                  setShowIncompleteOnly(true);
                  setCurrentPage(1);
                }}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm border transition-all whitespace-nowrap flex items-center gap-1.5",
                  showIncompleteOnly
                    ? "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-500/30"
                    : "bg-transparent text-slate-500 border-slate-200 dark:border-slate-800 hover:border-amber-300 hover:text-amber-600",
                )}
              >
                <AlertCircle size={14} />
                待完善
              </button>
            </div>

            {/* Search */}
            <div className="relative group w-full md:w-64">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="搜索标题、专辑、作者..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full py-2 pl-9 pr-8 text-sm outline-none focus:border-blue-500 transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-slate-500"
                >
                  <XCircle size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* List Content */}
        <div className="space-y-4 min-h-[50vh]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-4" />
              <p className="font-light">Loading...</p>
            </div>
          ) : filteredSongs.length > 0 ? (
            <>
              {/* List Header (Desktop) */}
              <div className="hidden lg:flex px-4 py-2 text-xs font-bold tracking-wider text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800 mb-2">
                <div className="w-8 shrink-0 text-center">#</div>
                <div className="w-12 shrink-0 ml-4 mr-0">Cover</div>
                <div className="flex-1 ml-4">Basic Info</div>
                <div className="w-32 mr-6 text-right">Composer</div>
                <div className="w-24 text-center mr-6">Type</div>
                <div className="w-20 ml-2">Actions</div>
              </div>

              <div className="flex flex-col gap-3">
                {paginatedSongs.map((song, i) => (
                  <AdminListRow
                    key={song.id}
                    song={song}
                    idx={startIndex + i}
                    isExpanded={expandedRows.has(song.id)}
                    toggleRowExpansion={toggleRowExpansion}
                    handleEdit={() => startEdit(song)}
                  />
                ))}
              </div>

              <div className="mt-12 flex justify-center">
                <Pagination
                  currentPage={safePage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Search size={48} className="mb-4 opacity-20" />
              <p className="font-light">没有找到符合条件的歌曲</p>
            </div>
          )}
        </div>
      </main>

      {/* Floating Buttons */}
      <FloatingActionButtons
        showScrollTop={showScrollTop}
        onScrollToTop={scrollToTop}
      />

      {/* Operation Toast */}
      {operationMsg && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4">
          <div
            className={cn(
              "px-6 py-3 rounded-full shadow-xl flex items-center gap-3 border backdrop-blur-md",
              operationMsg.type === "success"
                ? "bg-emerald-50/90 text-emerald-800 border-emerald-200 dark:bg-emerald-900/90 dark:text-emerald-100 dark:border-emerald-800"
                : "bg-red-50/90 text-red-800 border-red-200 dark:bg-red-900/90 dark:text-red-100 dark:border-red-800",
            )}
          >
            {operationMsg.type === "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <XCircle size={18} />
            )}
            <span className="font-medium">{operationMsg.text}</span>
          </div>
        </div>
      )}

      {/* Logic for Modal: Reuse similar markup for both Add/Edit */}
      {formMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#151921] w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col pt-0 animate-in zoom-in-95 duration-200 border border-slate-200/50 dark:border-slate-800">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-[#151921]/50 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {formMode === "add" ? "添加新歌曲" : "编辑歌曲"}
                </h2>
                {/* 自动补全按钮 - 仅在编辑模式下显示 */}
                {formMode === "edit" && editSong && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleAutoComplete("netease")}
                      disabled={autoComplete.isAutoCompleting}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                        "bg-linear-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400",
                        "text-white shadow-md shadow-red-500/20 hover:shadow-lg hover:shadow-red-500/30",
                        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md",
                      )}
                      title="从网易云音乐自动补全"
                    >
                      {autoComplete.isAutoCompleting &&
                      autoComplete.currentProvider === "netease" ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Wand2 size={16} />
                      )}
                      <span>网易云</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAutoComplete("kugou")}
                      disabled={autoComplete.isAutoCompleting}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                        "bg-linear-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400",
                        "text-white shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30",
                        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md",
                      )}
                      title="从酷狗音乐自动补全"
                    >
                      {autoComplete.isAutoCompleting &&
                      autoComplete.currentProvider === "kugou" ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Wand2 size={16} />
                      )}
                      <span>酷狗</span>
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={closeSongForm}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <FormProvider {...songForm}>
              <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <form
                  id="song-form"
                  onSubmit={handleSongSubmit}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {songFields.map((field) => (
                      <div
                        key={field.key}
                        className={cn(
                          "flex flex-col gap-2",
                          field.type === "textarea" ? "md:col-span-2" : "",
                        )}
                      >
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                          {field.label}
                          {field.key === "title" && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </label>
                        <RenderInput
                          field={field}
                          csrfToken={csrfToken}
                          songId={editSong?.id}
                        />
                      </div>
                    ))}
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#151921] flex justify-end gap-3 sticky bottom-0 z-10">
                <button
                  type="button"
                  onClick={closeSongForm}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  form="song-form"
                  disabled={songForm.formState.isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  {songForm.formState.isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  {formMode === "add" ? "确认添加" : "保存修改"}
                </button>
              </div>
            </FormProvider>
          </div>
        </div>
      )}

      {/* 搜索结果选择弹窗 */}
      {autoComplete.showSearchResults && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#151921] w-full max-w-lg max-h-[70vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-slate-200/50 dark:border-slate-800">
            {/* 弹窗 Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-[#151921]/50 backdrop-blur-md">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                选择歌曲
              </h3>
              <button
                onClick={() => autoComplete.closeSearchResults()}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* 搜索结果列表 */}
            <div className="flex-1 overflow-y-auto">
              {autoComplete.searchResults.map(
                (result: SearchResultItem, index: number) => (
                  <button
                    key={result.id}
                    onClick={() => handleSelectSearchResult(result)}
                    className={cn(
                      "w-full px-6 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                      "border-b border-slate-100 dark:border-slate-800 last:border-b-0",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-sm font-medium shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 dark:text-white truncate">
                          {result.name}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {result.artists.join(", ") || "未知艺术家"}
                        </div>
                        {result.album && (
                          <div className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                            专辑: {result.album}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ),
              )}
            </div>

            {/* 弹窗 Footer */}
            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#151921]">
              <p className="text-xs text-slate-400 text-center">
                共找到 {autoComplete.searchResults.length}{" "}
                个结果，点击选择要补全的歌曲
              </p>
            </div>
          </div>
        </div>
      )}

      {showNotification && (
        <Notification onClose={() => setShowNotification(false)} />
      )}
    </div>
  );
}

// --- Component: RenderInput ---
// Refactored for cleaner look

function RenderInput({
  field,
  csrfToken,
  songId,
}: {
  field: SongFieldConfig;
  csrfToken: string;
  songId?: number;
}) {
  const { control } = useFormContext<SongFormStateValues>();

  if (isCreatorFieldKey(field.key)) {
    return <CreatorFieldArrayInput fieldKey={field.key} />;
  }

  return (
    <Controller
      control={control}
      name={field.key}
      render={({ field: controllerField, fieldState }) => {
        const value = controllerField.value;
        const errorMessage = fieldState.error?.message;
        const baseClass = cn(
          "w-full px-4 py-2.5 bg-white dark:bg-black/20 border rounded-xl outline-none transition-all",
          errorMessage
            ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
            : "border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10",
        );

        if (field.key === "genre" || field.key === "type") {
          const options =
            field.key === "genre"
              ? Object.keys(genreColorMap)
              : Object.keys(typeColorMap);
          const arr = Array.isArray(value)
            ? value.filter((item): item is string => typeof item === "string")
            : typeof value === "string"
              ? [value]
              : [];

          return (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {options.map((opt) => {
                  const isActive = arr.includes(opt);
                  const colorClass =
                    (field.key === "genre" ? genreColorMap : typeColorMap)[
                      opt
                    ] || "bg-slate-100 text-slate-600";

                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        const next = isActive
                          ? arr.filter((x) => x !== opt)
                          : [...arr, opt];
                        controllerField.onChange(next);
                      }}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                        isActive
                          ? "ring-2 ring-offset-1 ring-blue-500 dark:ring-offset-[#151921]"
                          : "opacity-80 grayscale-[0.3] hover:grayscale-0 hover:opacity-100",
                        colorClass
                          .replace("bg-", "bg-opacity-20 bg-")
                          .replace("text-", "text-"),
                      )}
                      style={{
                        backgroundColor: isActive ? undefined : "transparent",
                        borderColor: isActive ? "transparent" : "currentColor",
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              <FieldErrorMessage message={errorMessage} />
            </div>
          );
        }

        if (field.type === "textarea") {
          return (
            <>
              <textarea
                {...controllerField}
                value={getInputValue(
                  typeof value === "string" || typeof value === "number"
                    ? value
                    : undefined,
                )}
                onChange={(e) => controllerField.onChange(e.target.value)}
                className={baseClass}
                rows={4}
                placeholder={`请输入${field.label}`}
              />
              <FieldErrorMessage className="mt-1" message={errorMessage} />
            </>
          );
        }

        if (field.type === "boolean") {
          const isCover = field.key === "hascover";
          const isScore = field.key === "nmn_status";

          return (
            <div className="space-y-3">
              <div className="flex gap-4">
                <select
                  {...controllerField}
                  value={
                    value === true ? "true" : value === false ? "false" : ""
                  }
                  onChange={(e) => {
                    const nextValue =
                      e.target.value === "true"
                        ? true
                        : e.target.value === "false"
                          ? false
                          : null;
                    controllerField.onChange(nextValue);
                  }}
                  className={cn(
                    baseClass,
                    "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100",
                    "[&>option]:bg-white [&>option]:dark:bg-slate-800 [&>option]:text-slate-900 [&>option]:dark:text-slate-100",
                  )}
                >
                  {isCover ? (
                    <>
                      <option value="">白底狐狸 (默认)</option>
                      <option value="false">初号机 (黑底)</option>
                      <option value="true">定制封面</option>
                    </>
                  ) : (
                    <>
                      <option value="false">否 / 无</option>
                      <option value="true">是 / 有</option>
                    </>
                  )}
                </select>
              </div>

              {isCover && value === true && hasSongId(songId) && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-slate-800">
                  <CoverUpload
                    songId={songId}
                    csrfToken={csrfToken}
                    onUploadSuccess={() => void 0}
                    onUploadError={console.error}
                  />
                </div>
              )}

              {isScore && value === true && hasSongId(songId) && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-slate-800">
                  <ScoreUpload
                    songId={songId}
                    csrfToken={csrfToken}
                    onUploadSuccess={() => void 0}
                    onUploadError={console.error}
                  />
                </div>
              )}

              <FieldErrorMessage message={errorMessage} />
            </div>
          );
        }

        return (
          <>
            <input
              {...controllerField}
              type={
                field.type === "number"
                  ? "number"
                  : field.type === "date"
                    ? "date"
                    : "text"
              }
              value={getInputValue(
                typeof value === "string" || typeof value === "number"
                  ? value
                  : undefined,
              )}
              onChange={(e) =>
                controllerField.onChange(
                  field.type === "number"
                    ? e.target.value === ""
                      ? null
                      : Number(e.target.value)
                    : e.target.value,
                )
              }
              className={baseClass}
              placeholder={`请输入${field.label}`}
            />
            <FieldErrorMessage className="mt-1" message={errorMessage} />
          </>
        );
      }}
    />
  );
}

function CreatorFieldArrayInput({ fieldKey }: { fieldKey: CreatorFieldKey }) {
  const { control, formState, getFieldState, register } =
    useFormContext<SongFormStateValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: fieldKey,
  });
  const errorMessage = getFieldState(fieldKey, formState).error?.message;
  const baseClass = cn(
    "w-full px-4 py-2.5 bg-white dark:bg-black/20 border rounded-xl outline-none transition-all",
    errorMessage
      ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
      : "border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10",
  );

  return (
    <div className="space-y-2">
      {fields.map((item, index) => (
        <div key={item.id} className="flex gap-2">
          <input
            {...register(`${fieldKey}.${index}.value`)}
            className={baseClass}
          />
          <button
            type="button"
            onClick={() => remove(index)}
            className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => append({ value: "" } satisfies SongArrayFieldItem)}
        className="text-xs font-medium text-blue-600 hover:text-blue-500 flex items-center gap-1"
      >
        <Plus size={14} /> 添加一项
      </button>
      <FieldErrorMessage message={errorMessage} />
    </div>
  );
}

function FieldErrorMessage({
  message,
  className,
}: {
  message?: string;
  className?: string;
}) {
  if (!message) {
    return null;
  }

  return <p className={cn("text-xs text-red-500", className)}>{message}</p>;
}
