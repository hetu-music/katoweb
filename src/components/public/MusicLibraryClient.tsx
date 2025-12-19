"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { flushSync } from "react-dom";
import {
  Search,
  LayoutGrid,
  List,
  Disc,
  Calendar,
  Clock,
  Moon,
  Sun,
  SlidersHorizontal,
  X,
  Info,
  RotateCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTheme } from "next-themes";
import { MusicLibraryClientProps, Song } from "@/lib/types";
import {
  getCoverUrl,
  formatTime,
  filterSongs,
  calculateFilterOptions,
  createFuseInstance,
} from "@/lib/utils";
import { getTypeTagStyle, getGenreTagStyle } from "@/lib/constants";
import { usePagination } from "@/hooks/usePagination";
import { useDebounce } from "@/hooks/useDebounce";
import { useMusicLibraryState } from "@/hooks/useMusicLibraryState";
import Pagination from "./Pagination";
import SongFilters from "./SongFilters";
import About from "./About";
import FloatingActionButtons from "./FloatingActionButtons";

// 简易 classNames 工具 (替代 clsx/tailwind-merge)
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

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
}: {
  song: Song;
  onClick: () => void;
  style?: React.CSSProperties;
  className?: string;
  isActive?: boolean;
}) => (
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
    </div>

    {/* 信息区 */}
    <div className="space-y-1">
      <div className="flex justify-between items-start gap-4">
        <h3
          className={cn(
            "text-xl text-slate-900 dark:text-slate-100 leading-tight transition-colors line-clamp-1 flex-1 min-w-0",
            isActive
              ? "text-blue-600 dark:text-blue-400"
              : "group-hover:text-blue-600 dark:group-hover:text-blue-400",
          )}
          title={song.title}
        >
          {song.title}
        </h3>
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
    </div>
  </div>
);

// 3. 列表模式行 (List Row)
const ListRow = ({
  song,
  onClick,
  style,
  className,
  isActive,
}: {
  song: Song;
  onClick: () => void;
  style?: React.CSSProperties;
  className?: string;
  isActive?: boolean;
}) => (
  <div
    onClick={onClick}
    className={cn(
      "group flex items-center gap-6 p-4 rounded-xl transition-colors cursor-pointer",
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
      <h3
        className={cn(
          "text-lg text-slate-900 dark:text-slate-100 truncate transition-colors",
          isActive
            ? "text-blue-600 dark:text-blue-400"
            : "group-hover:text-blue-600 dark:group-hover:text-blue-400",
        )}
      >
        {song.title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 font-light truncate">
        {song.lyricist?.join(", ") || "-"}{" "}
        <span className="opacity-50 mx-1">/</span>{" "}
        {song.composer?.join(", ") || "-"}
      </p>
    </div>

    {/* 辅助信息 (在大屏幕显示) */}
    <div className="hidden md:flex items-center gap-8 text-sm text-slate-500 dark:text-slate-400 shrink-0">
      {song.type && song.type[0] && (
        <span
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium w-24 text-center truncate border",
            getTypeTagStyle(song.type[0], "subtle"),
          )}
        >
          {song.type[0]}
        </span>
      )}
      {song.genre && song.genre[0] ? (
        <span
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium w-24 text-center truncate border",
            getGenreTagStyle(song.genre[0]),
          )}
        >
          {song.genre[0]}
        </span>
      ) : (
        <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium w-24 text-center truncate">
          未知流派
        </span>
      )}
      <div className="flex items-center gap-2 w-16 font-mono text-xs opacity-70">
        <Calendar size={14} />
        {song.year || "-"}
      </div>
      <div className="flex items-center gap-2 w-16 font-mono text-xs opacity-70">
        <Clock size={14} />
        {formatTime(song.length)}
      </div>
    </div>
  </div>
);

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
  const { setTheme, resolvedTheme } = useTheme();
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
  } = useMusicLibraryState(sliderYears.length);

  // 关于弹窗状态 (Local UI state)
  const [showAbout, setShowAbout] = useState(false);
  const [activeSongId, setActiveSongId] = useState<number | null>(null);

  // Debounced values for expensive filtering operations
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const debouncedYearRangeIndices = useDebounce(yearRangeIndices, 300);

  // Memoize Fuse instance only when data changes
  const fuseInstance = useMemo(() => {
    return createFuseInstance(initialSongsData);
  }, [initialSongsData]);

  // 数据过滤 (使用 fuse.js 模糊搜索)
  const filteredWorks = useMemo(() => {
    // Derive selected years from range
    let selectedYear: string | (string | number)[] = "全部";
    if (sliderYears.length > 0) {
      const [start, end] = debouncedYearRangeIndices;
      // If range covers everything, treat as "全部"
      if (start === 0 && end === sliderYears.length - 1) {
        selectedYear = "全部";
      } else {
        selectedYear = sliderYears.slice(start, end + 1);
      }
    }

    return filterSongs(
      initialSongsData,
      debouncedSearchQuery,
      filterType,
      selectedYear,
      filterLyricist,
      filterComposer,
      filterArranger,
      fuseInstance,
    );
  }, [
    initialSongsData,
    debouncedSearchQuery,
    filterType,
    debouncedYearRangeIndices,
    sliderYears,
    filterLyricist,
    filterComposer,
    filterArranger,
    fuseInstance,
  ]);

  // 分页处理
  const {
    totalPages,
    currentData: paginatedSongs,
    setCurrentPage: setPaginationInternal,
  } = usePagination({
    data: filteredWorks,
    itemsPerPage: 24,
    initialPage: currentPage, // Pass controlled page
  });

  // Sync pagination hook state with our controlled state if needed
  // Note: usePagination usually maintains its own state if not controlled perfectly.
  // We need to ensure when 'currentPage' changes (from URL), usePagination updates.
  // The 'initialPage' prop is only used on mount or reset.
  // We need to make sure the hook updates when currentPage changes.
  useEffect(() => {
    setPaginationInternal(currentPage);
  }, [currentPage, setPaginationInternal]);

  // When usePagination updates page internally (if it does), we should sync back?
  // Our shared hook exposes setPaginationPage which updates state and URL.
  // We pass setPaginationPage to the Pagination component below.
  // So we are driving it from outside. All good.

  // 使用 filterOptions 中的类型
  const availableTypes = useMemo(() => {
    // 使用从数据中计算出的类型，这些类型已按 typeColorMap 排序
    return filterOptions.allTypes;
  }, [filterOptions]);

  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!document.startViewTransition) {
      setTheme(resolvedTheme === "dark" ? "light" : "dark");
      return;
    }

    const x = e.clientX;
    const y = e.clientY;
    const endRadius = Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y),
    );

    document.documentElement.classList.add("no-transitions");

    const transition = document.startViewTransition(() => {
      flushSync(() => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
      });
    });

    transition.finished.then(() => {
      document.documentElement.classList.remove("no-transitions");
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];

      document.documentElement.animate(
        {
          clipPath: clipPath,
        },
        {
          duration: 500,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    });
  };

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
  const [isTitleActive, setIsTitleActive] = useState(false);

  const handleTitleReset = useCallback(() => {
    setIsTitleActive(true);
    setTimeout(() => setIsTitleActive(false), 1000);

    // Close advanced filters panel
    setShowAdvancedFilters(false);

    // Reset all filters and pagination
    resetAllFilters();

    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [resetAllFilters, setShowAdvancedFilters]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0F19] transition-colors duration-500">
      {/* 顶部导航 */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FAFAFA]/80 dark:bg-[#0B0F19]/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <button
            onClick={handleTitleReset}
            className={cn(
              "text-2xl font-bold tracking-tight flex items-center gap-1 cursor-pointer transition-colors font-serif",
              isTitleActive
                ? "text-blue-600 dark:text-blue-400"
                : "text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400",
            )}
            title="点击刷新页面"
          >
            河图
            <span className="w-[2px] h-5 bg-blue-600 mx-2 rounded-full translate-y-[1.5px]" />
            作品勘鉴
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAbout(true)}
              className="p-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
              title="About"
            >
              <Info size={20} />
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
            >
              {mounted ? (
                resolvedTheme === "dark" ? (
                  <Moon size={20} className="animate-in fade-in duration-200" />
                ) : (
                  <Sun size={20} className="animate-in fade-in duration-200" />
                )
              ) : (
                <div className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 max-w-7xl mx-auto px-6">
        {/* Header */}
        <section className="mb-16 space-y-4">
          <h1 className="text-5xl md:text-6xl text-slate-900 dark:text-slate-50">
            谣歌 <span>{filteredWorks.length}</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-light max-w-lg">
            你一定想知道，戏里讲了什么故事。
          </p>
        </section>

        {/* 控制栏 */}
        <section className="sticky top-20 z-40 bg-[#FAFAFA]/95 dark:bg-[#0B0F19]/95 backdrop-blur-sm py-4 mb-8 -mx-6 px-6 border-y border-transparent data-[scrolled=true]:border-slate-100">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col-reverse md:flex-row justify-between gap-4 md:items-center">
              {/* Left Group (Desktop) / Bottom Group (Mobile): Type Filters */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0 w-full md:w-auto">
                {availableTypes.map((type) => {
                  if (type === "全部") {
                    const isAnyFilterActive =
                      searchQuery !== "" ||
                      filterType !== "全部" ||
                      filterLyricist !== "全部" ||
                      filterComposer !== "全部" ||
                      filterArranger !== "全部" ||
                      (sliderYears.length > 0 &&
                        (yearRangeIndices[0] !== 0 ||
                          yearRangeIndices[1] !== sliderYears.length - 1));

                    if (isAnyFilterActive) {
                      return (
                        <button
                          key="reset"
                          onClick={resetAllFilters}
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
                    placeholder="搜索歌曲、歌词等..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPaginationPage(1); // 搜索时重置页码
                    }}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full py-2 pl-9 pr-4 text-sm outline-none focus:border-blue-500 transition-colors"
                  />
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
                    title="Grid View"
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
                    title="List View"
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
                  key={`grid-page-${currentPage}`}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12"
                >
                  {paginatedSongs.map((work, i) => (
                    <GridCard
                      key={work.id}
                      song={work}
                      isActive={activeSongId === work.id}
                      onClick={() => {
                        setActiveSongId(work.id);
                        handleSongClick();
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
                  key={`list-page-${currentPage}`}
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
                      onClick={() => {
                        setActiveSongId(work.id);
                        handleSongClick();
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
                  currentPage={currentPage}
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
