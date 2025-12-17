"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { flushSync } from "react-dom";
import { Search, LayoutGrid, List, Disc, Calendar, Clock, Moon, Sun, SlidersHorizontal, X, Info, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTheme } from "next-themes";
import { MusicLibraryClientProps, Song } from "@/lib/types";
import { getCoverUrl, formatTime, filterSongs, calculateFilterOptions, createFuseInstance } from "@/lib/utils";
import { typeColorMap } from "@/lib/constants";
import { usePagination } from "@/hooks/usePagination";
import { useDebounce } from "@/hooks/useDebounce";
import Pagination from "./Pagination";
import SongFilters from "./SongFilters";
import About from "./About";
import FloatingActionButtons from "./FloatingActionButtons";

// 简易 classNames 工具 (替代 clsx/tailwind-merge)
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

// 1. 封面组件
const CoverArt = ({ song, className }: { song: Song; className?: string }) => {
  const coverUrl = getCoverUrl(song);

  return (
    <div className={cn(
      "relative overflow-hidden w-full h-full bg-slate-100 dark:bg-slate-800",
      "ring-1 ring-slate-900/5 dark:ring-white/10",
      className
    )}>
      {/* 封面图片 */}
      <Image
        src={coverUrl}
        alt={song.title}
        width={400}
        height={400}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {/* 装饰纹理 (可选，叠加在图片上可能不太明显，保留以前的装饰层思路但调整透明度) */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-black mix-blend-overlay transition-opacity" />
    </div>
  );
};

// 2. 网格模式卡片 (Grid Card)
const GridCard = ({ song, onClick, style, className }: { song: Song; onClick: () => void; style?: React.CSSProperties; className?: string }) => (
  <div onClick={onClick} className={cn("group flex flex-col gap-4 cursor-pointer", className)} style={style}>
    {/* 封面容器 */}
    <div className="relative aspect-square w-full rounded-sm overflow-hidden transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-2xl shadow-lg shadow-slate-200/50 dark:shadow-black/40 ring-1 ring-slate-900/5 dark:ring-white/10">
      <CoverArt song={song} />

      {/* 悬浮遮罩 */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors opacity-0 group-hover:opacity-100" />
    </div>

    {/* 信息区 */}
    <div className="space-y-1">
      <div className="flex justify-between items-start">
        <h3 className="text-xl font-serif text-slate-900 dark:text-slate-100 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1" title={song.title}>
          {song.title}
        </h3>
        <span className="text-xs font-mono text-slate-400 pt-1 shrink-0">{song.year || "未知"}</span>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 font-light flex items-center gap-2 overflow-hidden">
        <span className="truncate">{song.album || "单曲"}</span>
        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0"></span>
        <span className="text-xs uppercase tracking-wider text-slate-400 shrink-0">
          {(song.type && song.type[0]) || "歌曲"}
        </span>
      </p>
    </div>
  </div>
);

// 3. 列表模式行 (List Row)
const ListRow = ({ song, onClick, style, className }: { song: Song; onClick: () => void; style?: React.CSSProperties; className?: string }) => (
  <div onClick={onClick} className={cn("group flex items-center gap-6 p-4 rounded-xl hover:bg-white dark:hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700/50 hover:shadow-sm cursor-pointer", className)} style={style}>
    {/* 小封面 */}
    <div className="w-16 h-16 shrink-0 rounded shadow-sm overflow-hidden">
      <CoverArt song={song} />
    </div>

    {/* 主要信息 */}
    <div className="flex-grow min-w-0 flex flex-col justify-center">
      <h3 className="text-lg font-serif text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {song.title}
      </h3>
      <p className="text-sm text-slate-500 font-light truncate">
        {song.album || "未知专辑"}
      </p>
    </div>

    {/* 辅助信息 (在大屏幕显示) */}
    <div className="hidden md:flex items-center gap-8 text-sm text-slate-500 dark:text-slate-400 shrink-0">
      <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium w-24 text-center truncate">
        {(song.genre && song.genre[0]) || "未知流派"}
      </span>
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
const FilterPill = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "px-4 py-1.5 rounded-full text-sm transition-all duration-300 border select-none whitespace-nowrap",
      active
        ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200 dark:shadow-none"
        : "bg-transparent text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
    )}
  >
    {label}
  </button>
);

const MusicLibraryClient: React.FC<MusicLibraryClientProps> = ({
  initialSongsData,
}) => {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // 视图状态：Grid vs List
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // 高级筛选展开状态
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // 关于弹窗状态
  const [showAbout, setShowAbout] = useState(false);

  // 筛选状态
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const [filterType, setFilterType] = useState("全部");
  // const [filterYear, setFilterYear] = useState("全部"); // Deprecated
  const [yearRangeIndices, setYearRangeIndices] = useState<[number, number]>([0, 0]); // Indices for year slider
  const debouncedYearRangeIndices = useDebounce(yearRangeIndices, 300);

  const [filterLyricist, setFilterLyricist] = useState("全部");
  const [filterComposer, setFilterComposer] = useState("全部");
  const [filterArranger, setFilterArranger] = useState("全部");

  // 计算筛选选项
  const filterOptions = useMemo(() => {
    return calculateFilterOptions(initialSongsData);
  }, [initialSongsData]);

  // Memoize Fuse instance only when data changes
  const fuseInstance = useMemo(() => {
    return createFuseInstance(initialSongsData);
  }, [initialSongsData]);

  // Initialize year range when options are ready
  const sliderYears = useMemo(() => {
    // filterOptions.allYears includes "全部" at index 0, so we slice it
    return filterOptions.allYears.slice(1);
  }, [filterOptions.allYears]);

  useEffect(() => {
    // Only set if not already set or data changed significantly
    if (sliderYears.length > 0) {
      // Default to full range
      setYearRangeIndices([0, sliderYears.length - 1]);
    }
  }, [sliderYears.length]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 数据过滤 (使用 fuse.js 模糊搜索)
  const filteredWorks = useMemo(() => {
    // Derive selected years from range
    let selectedYear: string | (string | number)[] = "全部";
    if (sliderYears.length > 0) {
      const [start, end] = debouncedYearRangeIndices;
      // If range covers everything, treat as "全部" (or just pass all)
      if (start === 0 && end === sliderYears.length - 1) {
        selectedYear = "全部";
      } else {
        // Slice includes start, excludes end. But our indices are inclusive [start, end]
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
      fuseInstance
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
    fuseInstance
  ]);

  // 分页处理
  const {
    currentPage,
    totalPages,
    currentData: paginatedSongs,
    setCurrentPage: setPaginationPage,
  } = usePagination({
    data: filteredWorks,
    itemsPerPage: 24, // 每页显示24个结果
    initialPage: 1,
  });

  // 使用 filterOptions 中的类型
  const availableTypes = useMemo(() => {
    // 使用从数据中计算出的类型，这些类型已按 typeColorMap 排序
    return filterOptions.allTypes;
  }, [filterOptions]);

  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    // @ts-ignore
    if (!document.startViewTransition) {
      setTheme(theme === 'dark' ? 'light' : 'dark');
      return;
    }

    const x = e.clientX;
    const y = e.clientY;
    const endRadius = Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y)
    );

    document.documentElement.classList.add('no-transitions');

    // @ts-ignore
    const transition = document.startViewTransition(() => {
      flushSync(() => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
      });
    });

    transition.finished.then(() => {
      document.documentElement.classList.remove('no-transitions');
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
        }
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
      title: "河图 - 作品勘鉴",
      text: "河山万里，戏里讲了什么故事。",
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

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0F19] transition-colors duration-500 font-sans">

      {/* 顶部导航 */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FAFAFA]/80 dark:bg-[#0B0F19]/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="text-2xl font-serif font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-1">
            河图
            <span className="w-[2px] h-5 bg-blue-600 mx-2 rounded-full" />
            作品勘鉴
          </div>
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
              {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 max-w-7xl mx-auto px-6">

        {/* Header */}
        <section className="mb-16 space-y-4">
          <h1 className="text-5xl md:text-6xl font-serif text-slate-900 dark:text-slate-50">
            河山万里
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-light max-w-lg">
            你一定想知道，戏里讲了什么故事。
          </p>
        </section>

        {/* 控制栏 */}
        <section className="sticky top-20 z-40 bg-[#FAFAFA]/95 dark:bg-[#0B0F19]/95 backdrop-blur-sm py-4 mb-8 -mx-6 px-6 border-y border-transparent data-[scrolled=true]:border-slate-100">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row justify-between gap-4 md:items-center">

              {/* 左侧：筛选器 */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
                {availableTypes.map(type => {
                  if (type === "全部") {
                    const isAnyFilterActive =
                      searchQuery !== "" ||
                      filterType !== "全部" ||
                      filterLyricist !== "全部" ||
                      filterComposer !== "全部" ||
                      filterArranger !== "全部" ||
                      (sliderYears.length > 0 && (yearRangeIndices[0] !== 0 || yearRangeIndices[1] !== sliderYears.length - 1));

                    if (isAnyFilterActive) {
                      return (
                        <button
                          key="reset"
                          onClick={() => {
                            setSearchQuery("");
                            setFilterType("全部");
                            setFilterLyricist("全部");
                            setFilterComposer("全部");
                            setFilterArranger("全部");
                            if (sliderYears.length > 0) {
                              setYearRangeIndices([0, sliderYears.length - 1]);
                            }
                            setPaginationPage(1);
                          }}
                          className="px-4 py-1.5 rounded-full text-sm transition-all duration-300 border select-none whitespace-nowrap bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:border-red-300 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/30 flex items-center gap-1.5"
                        >
                          <RotateCcw size={12} />
                          Reset
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

                {/* 高级筛选按钮 */}
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={cn(
                    "p-2 rounded-lg transition-all duration-300 border shrink-0",
                    showAdvancedFilters
                      ? "bg-blue-600 text-white border-blue-600 shadow-md"
                      : "bg-transparent text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                  )}
                  title="高级筛选"
                >
                  {showAdvancedFilters ? <X size={16} /> : <SlidersHorizontal size={16} />}
                </button>
              </div>

              {/* 右侧：搜索与视图切换 */}
              <div className="flex items-center gap-4">
                <div className="relative group w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPaginationPage(1); // 搜索时重置页码
                    }}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full py-2 pl-9 pr-4 text-sm outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden md:block" />

                {/* 视图切换按钮组 */}
                <div className="flex bg-slate-100 dark:bg-slate-800/50 rounded-lg p-1 gap-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      "p-1.5 rounded-md transition-all",
                      viewMode === 'grid' ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-slate-400 hover:text-slate-600"
                    )}
                    title="Grid View"
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      "p-1.5 rounded-md transition-all",
                      viewMode === 'list' ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400" : "text-slate-400 hover:text-slate-600"
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
        <section className="min-h-[50vh] transition-all duration-500">
          {filteredWorks.length > 0 ? (
            <>
              {viewMode === 'grid' ? (
                // --- 网格模式 ---
                <div key={`grid-page-${currentPage}`} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
                  {paginatedSongs.map((work, i) => (
                    <GridCard
                      key={work.id}
                      song={work}
                      onClick={() => router.push(`/song/${work.id}`)}
                      className="animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
                      style={{ animationDelay: `${(i % 8) * 40}ms`, animationFillMode: 'both' }}
                    />
                  ))}
                </div>
              ) : (
                // --- 列表模式 ---
                <div key={`list-page-${currentPage}`} className="flex flex-col gap-2">
                  {/* 列表表头 */}
                  <div className="hidden md:flex px-4 py-2 text-xs font-bold tracking-wider text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800 mb-2">
                    <div className="w-16 mr-6">Cover</div>
                    <div className="flex-grow">Title / Album</div>
                    <div className="w-24 text-center ml-8">Genre</div>
                    <div className="w-16 ml-8">Year</div>
                    <div className="w-16 ml-8">Time</div>
                  </div>
                  {paginatedSongs.map((work, i) => (
                    <ListRow
                      key={work.id}
                      song={work}
                      onClick={() => router.push(`/song/${work.id}`)}
                      className="animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
                      style={{ animationDelay: `${(i % 8) * 40}ms`, animationFillMode: 'both' }}
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
              <p className="font-light">No works found.</p>
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


