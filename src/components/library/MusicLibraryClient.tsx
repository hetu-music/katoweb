"use client";

import { useFavorites } from "@/context/FavoritesContext";
import { extractLyricsSnippet, useLyricsIndex } from "@/hooks/useLyricsIndex";
import { useMusicLibraryState } from "@/hooks/useMusicLibraryState";

import { getTypeTagStyle } from "@/lib/constants";
import { MusicLibraryClientProps, Song } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/utils-common";
import {
  calculateFilterOptions,
  createFuseInstance,
  filterSongs,
  getCoverUrl,
} from "@/lib/utils-song";
import {
  Calendar,
  Clock,
  Disc,
  Heart,
  LayoutGrid,
  List,
  Mic2,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
  XCircle,
} from "lucide-react";
import { useDebouncedValue } from "@mantine/hooks";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import AppNavbar from "../shared/AppNavbar";
import FloatingActionButtons from "../shared/FloatingActionButtons";
import Pagination from "../shared/Pagination";
import About from "./About";
import HeroSection from "./HeroSection";
import MultiTagDisplay from "./MultiTagDisplay";
import SongFilters from "./SongFilters";

// 1. 封面组件
const CoverArt = ({
  song,
  className,
  isActive,
}: {
  song: Song;
  className?: string;
  isActive?: boolean;
}) => {
  const coverUrl = getCoverUrl(song);

  return (
    <div
      className={cn(
        "relative overflow-hidden w-full h-full bg-slate-100 dark:bg-slate-800",
        "ring-1 ring-slate-900/5 dark:ring-white/10",
        className,
      )}
    >
      {/* 封面图片 */}
      <Image
        src={coverUrl}
        alt={song.title}
        width={400}
        height={400}
        className={cn(
          "w-full h-full object-cover transition-transform duration-500",
          isActive ? "scale-105" : "group-hover:scale-105",
        )}
      />
      {/* 装饰纹理 (可选，叠加在图片上可能不太明显，保留以前的装饰层思路但调整透明度) */}
      <div
        className={cn(
          "absolute inset-0 bg-black mix-blend-overlay transition-opacity",
          isActive ? "opacity-10" : "opacity-0 group-hover:opacity-10",
        )}
      />
    </div>
  );
};

// 2. 网格模式卡片 (Grid Card)
const GridCard = ({
  song,
  onClick,
  style,
  className,
  isActive,
  lyricsSnippet,
}: {
  song: Song;
  onClick: () => void;
  style?: React.CSSProperties;
  className?: string;
  isActive?: boolean;
  lyricsSnippet?: string;
}) => {
  const { isFavorite, toggleFavorite, isLoggedIn } = useFavorites();
  const active = isFavorite(song.id);

  return (
    <div
      onClick={onClick}
      className={cn("group flex flex-col gap-4 cursor-pointer", className)}
      style={style}
    >
      {/* 封面容器 */}
      <div
        className={cn(
          "relative aspect-square w-full rounded-sm overflow-hidden transition-all duration-500 shadow-lg shadow-slate-200/50 dark:shadow-black/40 ring-1 ring-slate-900/5 dark:ring-white/10",
          isActive
            ? "-translate-y-2 shadow-2xl"
            : "group-hover:-translate-y-2 group-hover:shadow-2xl",
        )}
      >
        <CoverArt song={song} isActive={isActive} />

        {/* 悬浮遮罩 */}
        <div
          className={cn(
            "absolute inset-0 bg-black/0 transition-colors opacity-0",
            isActive
              ? "bg-black/10 opacity-100"
              : "group-hover:bg-black/10 group-hover:opacity-100",
          )}
        />

        {/* 收藏按钮 — 仅登录用户可见 */}
        {isLoggedIn && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(song.id);
            }}
            aria-label={active ? "取消收藏" : "收藏"}
            title={active ? "取消收藏" : "收藏"}
            className={cn(
              "absolute top-2 right-2 p-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm transition-all duration-200",
              active
                ? "opacity-100 text-rose-500"
                : "opacity-100 lg:opacity-0 lg:group-hover:opacity-100 text-slate-500 dark:text-slate-400 hover:text-rose-500",
            )}
          >
            <Heart size={16} className={active ? "fill-current" : ""} />
          </button>
        )}
      </div>

      {/* 信息区 */}
      <div className="space-y-1">
        <div className="flex justify-between items-start gap-4">
          <h2
            className={cn(
              "text-xl text-slate-900 dark:text-slate-100 leading-tight transition-colors line-clamp-1 flex-1 min-w-0",
              isActive
                ? "text-blue-600 dark:text-blue-400"
                : "group-hover:text-blue-600 dark:group-hover:text-blue-400",
            )}
            title={song.title}
          >
            {song.title}
          </h2>
          <span className="text-xs font-mono text-slate-400 shrink-0">
            {song.year || "未知"}
          </span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-light flex items-center gap-2 overflow-hidden">
          <span className="truncate">{song.album || "单曲"}</span>
          {song.type && song.type[0] && (
            <>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
              <span
                className={cn(
                  "text-sm font-light uppercase tracking-wider shrink-0",
                  getTypeTagStyle(song.type[0]),
                )}
              >
                {song.type[0]}
              </span>
            </>
          )}
        </p>
        {/* 歌词命中片段 */}
        {lyricsSnippet && (
          <div className="mt-1.5 pl-2 border-l-2 border-slate-200 dark:border-slate-700">
            <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate leading-relaxed">
              {lyricsSnippet}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// 3. 列表模式行 (List Row)
const ListRow = ({
  song,
  onClick,
  style,
  className,
  isActive,
  lyricsSnippet,
}: {
  song: Song;
  onClick: () => void;
  style?: React.CSSProperties;
  className?: string;
  isActive?: boolean;
  lyricsSnippet?: string;
}) => {
  const { isFavorite, toggleFavorite, isLoggedIn } = useFavorites();
  const active = isFavorite(song.id);

  return (
    <div
      onClick={onClick}
      className={cn(
        "group flex items-center gap-6 p-4 rounded-xl transition-colors cursor-pointer relative z-20 hover:z-30",
        isActive
          ? "bg-slate-100 dark:bg-slate-800/50"
          : "hover:bg-slate-100 dark:hover:bg-slate-800/50",
        className,
      )}
      style={style}
    >
      {/* 小封面 */}
      <div className="w-16 h-16 shrink-0 rounded shadow-sm overflow-hidden">
        <CoverArt song={song} isActive={isActive} />
      </div>

      {/* 主要信息 */}
      <div className="grow min-w-0 flex flex-col justify-center">
        <h2
          className={cn(
            "text-lg text-slate-900 dark:text-slate-100 truncate transition-colors",
            isActive
              ? "text-blue-600 dark:text-blue-400"
              : "group-hover:text-blue-600 dark:group-hover:text-blue-400",
          )}
        >
          {song.title}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-light truncate">
          {song.lyricist?.join(" ") || "-"}{" "}
          <span className="opacity-50 mx-1">/</span>{" "}
          {song.composer?.join(" ") || "-"}
        </p>
        {/* 歌词命中片段 */}
        {lyricsSnippet && (
          <div className="mt-1 pl-2 border-l-2 border-slate-200 dark:border-slate-700">
            <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate leading-relaxed">
              {lyricsSnippet}
            </p>
          </div>
        )}
      </div>

      {/* 辅助信息 (在大屏幕显示) */}
      <div className="hidden md:flex items-center gap-8 text-sm text-slate-500 dark:text-slate-400 shrink-0">
        <MultiTagDisplay tags={song.type} type="type" />
        <MultiTagDisplay tags={song.genre} type="genre" />
        <div className="flex items-center gap-2 w-16 font-mono text-xs opacity-70">
          <Calendar size={14} />
          {song.year || "-"}
        </div>
        <div className="flex items-center gap-2 w-16 font-mono text-xs opacity-70">
          <Clock size={14} />
          {formatTime(song.length)}
        </div>
      </div>

      {/* 收藏按钮 — 仅登录用户可见 */}
      {isLoggedIn && (
        <div className="flex items-center shrink-0 ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(song.id);
            }}
            aria-label={active ? "取消收藏" : "收藏"}
            title={active ? "取消收藏" : "收藏"}
            className={cn(
              "p-2 rounded-lg transition-all duration-200",
              active
                ? "text-rose-500"
                : "text-slate-400 dark:text-slate-500 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 hover:text-rose-400",
            )}
          >
            <Heart size={16} className={active ? "fill-current" : ""} />
          </button>
        </div>
      )}
    </div>
  );
};

// 筛选按钮组件
const FilterPill = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "px-4 py-1.5 rounded-full text-sm transition-all duration-300 border select-none whitespace-nowrap",
      active
        ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200 dark:shadow-none"
        : "bg-transparent text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10",
    )}
  >
    {label}
  </button>
);

const MusicLibraryClient: React.FC<MusicLibraryClientProps> = ({
  initialSongsData,
}) => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Use requestAnimationFrame to avoid synchronous setState in effect
    requestAnimationFrame(() => {
      setMounted(true);
    });
  }, []);

  // 计算筛选选项
  const filterOptions = useMemo(() => {
    return calculateFilterOptions(initialSongsData);
  }, [initialSongsData]);

  // Initialize year range options
  const sliderYears = useMemo(() => {
    return filterOptions.allYears.slice(1);
  }, [filterOptions.allYears]);

  // 使用自定义 Hook 管理状态
  const {
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    yearRangeIndices,
    setYearRangeIndices,
    filterLyricist,
    setFilterLyricist,
    filterComposer,
    setFilterComposer,
    filterArranger,
    setFilterArranger,
    viewMode,
    setViewMode,
    currentPage,
    setPaginationPage,
    showAdvancedFilters,
    setShowAdvancedFilters,
    resetAllFilters,
    handleSongClick,
    isRestoringScroll,
    notifyDataReady,
  } = useMusicLibraryState(sliderYears.length);

  const [showAbout, setShowAbout] = useState(false);
  const [activeSongId, setActiveSongId] = useState<number | null>(null);

  /*
   * Force re-render key for list/grid content.
   * Incremented on pageshow (back navigation/bfcache) to replay entrance animations.
   */
  const [mountKey, setMountKey] = useState(0);

  // Reset active state activeSongId and trigger animation replay when returning to the page
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      // Only replay animation if the page is being restored from the bfcache
      if (event.persisted) {
        setActiveSongId(null);
        setMountKey((prev) => prev + 1);
      }
    };

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  // Debounced values for expensive filtering operations
  // Debounced values for expensive filtering operations
  const [debouncedSearchQuery] = useDebouncedValue(searchQuery, 300);
  const resolvedSearchQuery =
    searchQuery === "" ? searchQuery : debouncedSearchQuery;
  const [debouncedYearRangeIndices] = useDebouncedValue(yearRangeIndices, 300);
  const resolvedYearRangeIndices =
    yearRangeIndices[0] === 0 && yearRangeIndices[1] === sliderYears.length - 1
      ? yearRangeIndices
      : debouncedYearRangeIndices;

  // 基础 Fuse 实例（不含歌词，首屏立即可用）
  const fuseInstance = useMemo(() => {
    return createFuseInstance(initialSongsData);
  }, [initialSongsData]);

  // 后台异步拉取歌词索引
  const {
    lyricsFuseInstance,
    lyricsMap,
    state: lyricsState,
  } = useLyricsIndex(initialSongsData);

  // 搜索活跃时使用的 Fuse 实例：歌词索引就绪后自动升级
  const activeFuseInstance = resolvedSearchQuery
    ? (lyricsFuseInstance ?? fuseInstance)
    : fuseInstance;

  // 数据过滤 (使用 fuse.js 模糊搜索)
  const filteredWorks = useMemo(() => {
    // Derive selected years from range
    let selectedYear: string | (string | number)[] = "全部";
    if (sliderYears.length > 0) {
       const [start, end] = resolvedYearRangeIndices;
      // If range covers everything, treat as "全部"
      if (start === 0 && end === sliderYears.length - 1) {
        selectedYear = "全部";
      } else {
        selectedYear = sliderYears.slice(start, end + 1);
      }
    }

    return filterSongs(
      initialSongsData,
       resolvedSearchQuery,
       filterType,
       selectedYear,
      filterLyricist,
      filterComposer,
      filterArranger,
      activeFuseInstance,
    );
  }, [
    initialSongsData,
    resolvedSearchQuery,
    filterType,
    resolvedYearRangeIndices,
    sliderYears,
    filterLyricist,
    filterComposer,
    filterArranger,
    activeFuseInstance,
  ]);

  // Notify hook when data is ready for scroll restoration
  useEffect(() => {
    // We only notify when we are mounted and have data
    if (mounted) {
      // Small timeout to ensure layout has time to settle (especially animations)
      const t = setTimeout(notifyDataReady, 0);
      return () => clearTimeout(t);
    }
  }, [mounted, filteredWorks, viewMode, mountKey, notifyDataReady]);

  // 分页处理 — currentPage 来自本地 useState（立即响应用户操作），不经过 nuqs 读路径
  const ITEMS_PER_PAGE = 24;
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredWorks.length / ITEMS_PER_PAGE)),
    [filteredWorks.length],
  );
  // 防止 currentPage 超出有效范围（如过滤器变化导致总页数减少时）
  const safePage = useMemo(
    () => Math.min(Math.max(1, currentPage), totalPages),
    [currentPage, totalPages],
  );
  const paginatedSongs = useMemo(() => {
    const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredWorks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredWorks, safePage]);

  // 使用 filterOptions 中的类型
  const availableTypes = useMemo(() => {
    // 使用从数据中计算出的类型，这些类型已按 typeColorMap 排序
    return filterOptions.allTypes;
  }, [filterOptions]);

  // Scroll to top logic
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleShare = useCallback(async () => {
    const shareData = {
      title: "河图作品勘鉴",
      text: "你一定想知道，戏里讲了什么故事。",
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // Share cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert("链接已复制到剪贴板");
      } catch {
        // Copy failed
      }
    }
  }, []);

  // Handle title click - comprehensive reset
  const handleTitleReset = useCallback(() => {
    // Clear sessionStorage (scroll position)
    sessionStorage.removeItem("music_library_scrollY");

    // Navigate to clean URL without any parameters, then reload
    window.location.href = window.location.pathname;
  }, []);

  // Mouse drag to scroll functionality
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const hasDragged = useRef(false); // 跟踪是否发生了实际拖动

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
    hasDragged.current = false; // 重置拖动标记
    scrollContainerRef.current.style.cursor = "grabbing";
    scrollContainerRef.current.style.userSelect = "none";
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !scrollContainerRef.current) return;
      e.preventDefault();
      const x = e.pageX - scrollContainerRef.current.offsetLeft;
      const walk = (x - startX) * 2; // 乘以2让滚动更灵敏

      // 如果移动距离超过5px，标记为已拖动
      if (Math.abs(walk) > 5) {
        hasDragged.current = true;
      }

      scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    },
    [isDragging, startX, scrollLeft],
  );

  const handleMouseUpOrLeave = useCallback(() => {
    setIsDragging(false);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.style.cursor = "grab";
      scrollContainerRef.current.style.userSelect = "auto";
    }
    // 延迟重置拖动标记，确保 onClick 事件能够检测到
    setTimeout(() => {
      hasDragged.current = false;
    }, 50);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0F19] transition-colors duration-500">
      {/* 顶部导航 */}
      <AppNavbar
        title={
          <>
            河图
            <span className="mx-2 h-5 w-[2px] translate-y-[1.5px] rounded-full bg-blue-600" />
            作品勘鉴
          </>
        }
        onTitleClick={handleTitleReset}
        onAboutClick={() => setShowAbout(true)}
        titleTooltip="点击刷新页面"
      />

      <main className="pt-32 pb-20 max-w-7xl mx-auto px-6">
        {/* ── Hero ── */}
        <section className="mb-8 md:mb-16">
          <div className="flex items-end justify-between gap-8">
            <HeroSection songCount={filteredWorks.length} />
          </div>
        </section>

        {/* 控制栏 */}
        <section className="sticky top-20 z-40 bg-[#FAFAFA]/95 dark:bg-[#0B0F19]/95 backdrop-blur-sm py-4 mb-8 -mx-6 px-6 border-y border-transparent data-[scrolled=true]:border-slate-100">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col-reverse md:flex-row justify-between gap-4 md:items-center">
              {/* Left Group (Desktop) / Bottom Group (Mobile): Type Filters */}
              <div
                ref={scrollContainerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
                className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0 w-full md:w-auto cursor-grab active:cursor-grabbing"
              >
                {availableTypes.map((type) => {
                  if (type === "全部") {
                    const isAnyFilterActive =
                      searchQuery !== "" ||
                      filterType !== "全部" ||
                      filterLyricist.length > 0 ||
                      filterComposer.length > 0 ||
                      filterArranger.length > 0 ||
                      (sliderYears.length > 0 &&
                        (yearRangeIndices[0] !== 0 ||
                          yearRangeIndices[1] !== sliderYears.length - 1));

                    if (isAnyFilterActive) {
                      return (
                        <button
                          key="reset"
                          onClick={(e) => {
                            if (hasDragged.current) {
                              e.preventDefault();
                              return;
                            }
                            resetAllFilters();
                            scrollToTop();
                          }}
                          className="px-4 py-1.5 rounded-full text-sm transition-all duration-300 border select-none whitespace-nowrap bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:border-red-300 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/30 flex items-center gap-1.5"
                        >
                          <RotateCcw size={12} />
                          重置
                        </button>
                      );
                    }
                  }

                  return (
                    <FilterPill
                      key={type}
                      label={type}
                      active={filterType === type}
                      onClick={() => {
                        if (hasDragged.current) return; // 如果刚拖动过，忽略点击
                        setFilterType(type);
                        setPaginationPage(1); // 切换类型时重置页码
                      }}
                    />
                  );
                })}
              </div>

              {/* Right Group (Desktop) / Top Group (Mobile): Search & Controls */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative group flex-1 md:w-64">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder={
                      lyricsState === "ready"
                        ? "搜索歌曲、创作者、歌词..."
                        : "搜索歌曲、创作者..."
                    }
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPaginationPage(1); // 搜索时重置页码
                    }}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full py-2 pl-9 pr-8 text-sm outline-none focus:border-blue-500 transition-colors"
                  />
                  {searchQuery ? (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setPaginationPage(1);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-slate-500"
                    >
                      <XCircle size={14} />
                    </button>
                  ) : lyricsState === "loading" ? (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      <span className="block w-3 h-3 rounded-full border border-indigo-400/60 border-t-indigo-500 animate-spin" />
                    </span>
                  ) : lyricsState === "ready" ? (
                    <Mic2
                      size={13}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400/60"
                    />
                  ) : null}
                </div>

                {/* Advanced Filter Button */}
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={cn(
                    "p-2 rounded-lg transition-all duration-300 border shrink-0",
                    showAdvancedFilters
                      ? "bg-blue-600 text-white border-blue-600 shadow-md"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10",
                  )}
                  title="高级筛选"
                >
                  {showAdvancedFilters ? (
                    <X size={16} />
                  ) : (
                    <SlidersHorizontal size={16} />
                  )}
                </button>

                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden md:block" />

                {/* View Toggle */}
                <div className="flex bg-slate-100 dark:bg-slate-800/50 rounded-lg p-1 gap-1 shrink-0">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "p-1.5 rounded-md transition-all",
                      viewMode === "grid"
                        ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400"
                        : "text-slate-400 hover:text-slate-600",
                    )}
                    title="网格视图"
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "p-1.5 rounded-md transition-all",
                      viewMode === "list"
                        ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400"
                        : "text-slate-400 hover:text-slate-600",
                    )}
                    title="列表视图"
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* 高级筛选面板 */}
            {showAdvancedFilters && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <SongFilters
                  yearRangeIndices={yearRangeIndices}
                  setYearRangeIndices={setYearRangeIndices}
                  sliderYears={sliderYears}
                  selectedLyricist={filterLyricist}
                  setSelectedLyricist={setFilterLyricist}
                  selectedComposer={filterComposer}
                  setSelectedComposer={setFilterComposer}
                  selectedArranger={filterArranger}
                  setSelectedArranger={setFilterArranger}
                  filterOptions={filterOptions}
                />
              </div>
            )}
          </div>
        </section>

        {/* 内容展示区 */}
        <section
          className={cn(
            "min-h-[50vh] transition-opacity duration-200",
            isRestoringScroll ? "opacity-0 **:animate-none!" : "opacity-100",
          )}
        >
          {filteredWorks.length > 0 ? (
            <>
              {viewMode === "grid" ? (
                // --- 网格模式 ---
                <div
                  key={`grid-page-${currentPage}-${mountKey}`}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12"
                >
                  {paginatedSongs.map((work, i) => (
                    <GridCard
                      key={work.id}
                      song={work}
                      isActive={activeSongId === work.id}
                      lyricsSnippet={
                         resolvedSearchQuery && lyricsState === "ready"
                           ? extractLyricsSnippet(
                               lyricsMap.get(work.id) || "",
                               resolvedSearchQuery,
                             )
                           : undefined
                      }
                      onClick={() => {
                        setActiveSongId(work.id);
                        handleSongClick();
                        const d = parseInt(
                          sessionStorage.getItem("__katoweb_nav_depth") || "0",
                          10,
                        );
                        sessionStorage.setItem(
                          "__katoweb_nav_depth",
                          String(d + 1),
                        );
                        router.push(`/song/${work.id}`);
                      }}
                      className="animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
                      style={{
                        animationDelay: `${(i % 8) * 40}ms`,
                        animationFillMode: "both",
                      }}
                    />
                  ))}
                </div>
              ) : (
                // --- 列表模式 ---
                <div
                  key={`list-page-${currentPage}-${mountKey}`}
                  className="flex flex-col gap-2"
                >
                  {/* 列表表头 */}
                  <div className="hidden md:flex px-4 py-2 text-xs font-bold tracking-wider text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800 mb-2">
                    <div className="w-16 mr-6">Cover</div>
                    <div className="grow">Title / Lyricist / Composer</div>
                    <div className="w-24 text-center ml-8">Type</div>
                    <div className="w-24 text-center ml-8">Genre</div>
                    <div className="w-16 ml-8">Year</div>
                    <div className="w-16 ml-8">Time</div>
                  </div>
                  {paginatedSongs.map((work, i) => (
                    <ListRow
                      key={work.id}
                      song={work}
                      isActive={activeSongId === work.id}
                      lyricsSnippet={
                         resolvedSearchQuery && lyricsState === "ready"
                           ? extractLyricsSnippet(
                               lyricsMap.get(work.id) || "",
                               resolvedSearchQuery,
                             )
                           : undefined
                      }
                      onClick={() => {
                        setActiveSongId(work.id);
                        handleSongClick();
                        const d = parseInt(
                          sessionStorage.getItem("__katoweb_nav_depth") || "0",
                          10,
                        );
                        sessionStorage.setItem(
                          "__katoweb_nav_depth",
                          String(d + 1),
                        );
                        router.push(`/song/${work.id}`);
                      }}
                      className="animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
                      style={{
                        animationDelay: `${(i % 8) * 40}ms`,
                        animationFillMode: "both",
                      }}
                    />
                  ))}
                </div>
              )}

              {/* 分页控制 (在内容底部) */}
              <div className="mt-12 flex justify-center">
                <Pagination
                  currentPage={safePage}
                  totalPages={totalPages}
                  onPageChange={setPaginationPage}
                />
              </div>
            </>
          ) : (
            // --- 空状态 ---
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Disc size={48} className="mb-4 opacity-20" />
              <p className="font-light">没有符合条件的歌曲</p>
            </div>
          )}
        </section>
      </main>

      {/* 关于弹窗 */}
      {showAbout && <About onClose={() => setShowAbout(false)} />}

      <FloatingActionButtons
        showScrollTop={showScrollTop}
        onScrollToTop={scrollToTop}
        onShare={handleShare}
      />
    </div>
  );
};

export default MusicLibraryClient;
