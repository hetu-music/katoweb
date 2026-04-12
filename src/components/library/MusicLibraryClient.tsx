"use client";

import AppNavbar from "@/components/shared/AppNavbar";
import FloatingActionButtons from "@/components/shared/FloatingActionButtons";
import Pagination from "@/components/shared/Pagination";
import { useFilteredSongs } from "@/hooks/useFilteredSongs";
import { useMouseDragScroll } from "@/hooks/useMouseDragScroll";
import { useMusicLibraryState } from "@/hooks/useMusicLibraryState";
import {
  DEFAULT_MUSIC_LIBRARY_VIEW_MODE,
  FILTER_OPTION_ALL,
  MUSIC_LIBRARY_VIEW_MODES,
  type MusicLibraryViewMode,
} from "@/lib/constants";
import type { MusicLibraryClientProps } from "@/lib/types";
import { cn } from "@/lib/utils";
import { extractLyricsSnippet } from "@/hooks/useLyricsIndex";
import { calculateFilterOptions } from "@/lib/utils-song";
import {
  Disc,
  LayoutGrid,
  List,
  Mic2,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import About from "./About";
import GridCard from "./GridCard";
import HeroSection from "./HeroSection";
import ListRow from "./ListRow";
import SongFilters from "./SongFilters";

const VIEW_MODE_ICONS: Record<MusicLibraryViewMode, React.ReactNode> = {
  grid: <LayoutGrid size={18} />,
  list: <List size={18} />,
};

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "whitespace-nowrap rounded-full border px-4 py-1.5 text-sm transition-all duration-300 select-none",
        active
          ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none"
          : "border-slate-200 bg-transparent text-slate-600 hover:border-blue-400 hover:bg-blue-50/50 dark:border-slate-700 dark:text-slate-400 dark:hover:border-blue-400 dark:hover:bg-blue-900/10",
      )}
    >
      {label}
    </button>
  );
}

const NAV_DEPTH_KEY = "__katoweb_nav_depth";

export default function MusicLibraryClient({
  initialSongsData,
}: MusicLibraryClientProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [activeSongId, setActiveSongId] = useState<number | null>(null);
  const [mountKey, setMountKey] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { containerRef, hasDraggedRef, dragHandlers } =
    useMouseDragScroll<HTMLDivElement>();

  const filterOptions = useMemo(
    () => calculateFilterOptions(initialSongsData),
    [initialSongsData],
  );
  const sliderYears = useMemo(
    () => filterOptions.allYears.slice(1),
    [filterOptions.allYears],
  );

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
  } = useMusicLibraryState(sliderYears.length, DEFAULT_MUSIC_LIBRARY_VIEW_MODE);

  const {
    filteredSongs,
    lyricsMap,
    lyricsState,
    searchQueryForFiltering,
    isAnyFilterActive,
    itemsPerPage,
  } = useFilteredSongs({
    songs: initialSongsData,
    filterOptions,
    sliderYears,
    searchQuery,
    filterType,
    yearRangeIndices,
    filterLyricist,
    filterComposer,
    filterArranger,
  });

  useEffect(() => {
    requestAnimationFrame(() => {
      setMounted(true);
    });
  }, []);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setActiveSongId(null);
        setMountKey((previous) => previous + 1);
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const timer = setTimeout(notifyDataReady, 0);
    return () => clearTimeout(timer);
  }, [mounted, filteredSongs, mountKey, notifyDataReady, viewMode]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredSongs.length / itemsPerPage)),
    [filteredSongs.length, itemsPerPage],
  );

  const safePage = useMemo(
    () => Math.min(Math.max(1, currentPage), totalPages),
    [currentPage, totalPages],
  );

  useEffect(() => {
    if (safePage !== currentPage) {
      setPaginationPage(safePage);
    }
  }, [currentPage, safePage, setPaginationPage]);

  const paginatedSongs = useMemo(() => {
    const startIndex = (safePage - 1) * itemsPerPage;
    return filteredSongs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSongs, itemsPerPage, safePage]);

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
        // Share cancelled.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("链接已复制到剪贴板");
    } catch {
      // Clipboard unavailable.
    }
  }, []);

  const handleTitleReset = useCallback(() => {
    sessionStorage.removeItem("music_library_scrollY");
    window.location.href = window.location.pathname;
  }, []);

  const navigateToSong = useCallback(
    (songId: number) => {
      setActiveSongId(songId);
      handleSongClick();

      const navDepth = parseInt(
        sessionStorage.getItem(NAV_DEPTH_KEY) || "0",
        10,
      );
      sessionStorage.setItem(NAV_DEPTH_KEY, String(navDepth + 1));
      router.push(`/song/${songId}`);
    },
    [handleSongClick, router],
  );

  const getLyricsSnippet = useCallback(
    (songId: number) => {
      if (!searchQueryForFiltering || lyricsState !== "ready") {
        return undefined;
      }

      return extractLyricsSnippet(
        lyricsMap.get(songId) || "",
        searchQueryForFiltering,
      );
    },
    [lyricsMap, lyricsState, searchQueryForFiltering],
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] transition-colors duration-500 dark:bg-[#0B0F19]">
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

      <main className="mx-auto max-w-7xl px-6 pb-20 pt-32">
        <section className="mb-8 md:mb-16">
          <div className="flex items-end justify-between gap-8">
            <HeroSection songCount={filteredSongs.length} />
          </div>
        </section>

        <section className="sticky top-20 z-40 -mx-6 mb-8 border-y border-transparent bg-[#FAFAFA]/95 px-6 py-4 backdrop-blur-sm dark:bg-[#0B0F19]/95 data-[scrolled=true]:border-slate-100">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col-reverse justify-between gap-4 md:flex-row md:items-center">
              <div
                ref={containerRef}
                {...dragHandlers}
                className="no-scrollbar flex w-full cursor-grab items-center gap-2 overflow-x-auto pb-2 active:cursor-grabbing md:w-auto md:pb-0"
              >
                {filterOptions.allTypes.map((type) => {
                  if (type === FILTER_OPTION_ALL && isAnyFilterActive) {
                    return (
                      <button
                        key="reset"
                        onClick={(event) => {
                          if (hasDraggedRef.current) {
                            event.preventDefault();
                            return;
                          }
                          resetAllFilters();
                          scrollToTop();
                        }}
                        className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-sm text-red-600 transition-all duration-300 hover:border-red-300 hover:bg-red-100 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400"
                      >
                        <RotateCcw size={12} />
                        重置
                      </button>
                    );
                  }

                  return (
                    <FilterPill
                      key={type}
                      label={type}
                      active={filterType === type}
                      onClick={() => {
                        if (hasDraggedRef.current) return;
                        setFilterType(type);
                      }}
                    />
                  );
                })}
              </div>

              <div className="flex w-full items-center gap-2 md:w-auto">
                <div className="group relative flex-1 md:w-64">
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
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-8 text-sm outline-none transition-colors focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900"
                  />
                  {searchQuery ? (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-slate-500"
                    >
                      <XCircle size={14} />
                    </button>
                  ) : lyricsState === "loading" ? (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      <span className="block h-3 w-3 animate-spin rounded-full border border-indigo-400/60 border-t-indigo-500" />
                    </span>
                  ) : lyricsState === "ready" ? (
                    <Mic2
                      size={13}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400/60"
                    />
                  ) : null}
                </div>

                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={cn(
                    "shrink-0 rounded-lg border p-2 transition-all duration-300",
                    showAdvancedFilters
                      ? "border-blue-600 bg-blue-600 text-white shadow-md"
                      : "border-slate-200 bg-white text-slate-600 hover:border-blue-400 hover:bg-blue-50/50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-blue-400 dark:hover:bg-blue-900/10",
                  )}
                  title="高级筛选"
                >
                  {showAdvancedFilters ? (
                    <X size={16} />
                  ) : (
                    <SlidersHorizontal size={16} />
                  )}
                </button>

                <div className="hidden h-6 w-px bg-slate-200 dark:bg-slate-700 md:block" />

                <div className="flex shrink-0 gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800/50">
                  {MUSIC_LIBRARY_VIEW_MODES.map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={cn(
                        "rounded-md p-1.5 transition-all",
                        viewMode === mode
                          ? "bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400"
                          : "text-slate-400 hover:text-slate-600",
                      )}
                      title={mode === "grid" ? "网格视图" : "列表视图"}
                    >
                      {VIEW_MODE_ICONS[mode]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {showAdvancedFilters && (
              <div className="animate-in slide-in-from-top-2 fade-in duration-300">
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

        <section
          className={cn(
            "min-h-[50vh] transition-opacity duration-200",
            isRestoringScroll ? "opacity-0 **:animate-none!" : "opacity-100",
          )}
        >
          {filteredSongs.length > 0 ? (
            <>
              {viewMode === "grid" ? (
                <div
                  key={`grid-page-${safePage}-${mountKey}`}
                  className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                >
                  {paginatedSongs.map((song, index) => (
                    <GridCard
                      key={song.id}
                      song={song}
                      isActive={activeSongId === song.id}
                      lyricsSnippet={getLyricsSnippet(song.id)}
                      onClick={() => navigateToSong(song.id)}
                      className="animate-in slide-in-from-bottom-8 fade-in duration-700 fill-mode-both"
                      style={{
                        animationDelay: `${(index % 8) * 40}ms`,
                        animationFillMode: "both",
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div
                  key={`list-page-${safePage}-${mountKey}`}
                  className="flex flex-col gap-2"
                >
                  <div className="mb-2 hidden border-b border-slate-100 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 md:flex">
                    <div className="mr-6 w-16">Cover</div>
                    <div className="grow">Title / Lyricist / Composer</div>
                    <div className="ml-8 w-24 text-center">Type</div>
                    <div className="ml-8 w-24 text-center">Genre</div>
                    <div className="ml-8 w-16">Year</div>
                    <div className="ml-8 w-16">Time</div>
                  </div>
                  {paginatedSongs.map((song, index) => (
                    <ListRow
                      key={song.id}
                      song={song}
                      isActive={activeSongId === song.id}
                      lyricsSnippet={getLyricsSnippet(song.id)}
                      onClick={() => navigateToSong(song.id)}
                      className="animate-in slide-in-from-bottom-8 fade-in duration-700 fill-mode-both"
                      style={{
                        animationDelay: `${(index % 8) * 40}ms`,
                        animationFillMode: "both",
                      }}
                    />
                  ))}
                </div>
              )}

              <div className="mt-12 flex justify-center">
                <Pagination
                  currentPage={safePage}
                  totalPages={totalPages}
                  onPageChange={setPaginationPage}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Disc size={48} className="mb-4 opacity-20" />
              <p className="font-light">没有符合条件的歌曲</p>
            </div>
          )}
        </section>
      </main>

      {showAbout && <About onClose={() => setShowAbout(false)} />}

      <FloatingActionButtons
        showScrollTop={showScrollTop}
        onScrollToTop={scrollToTop}
        onShare={handleShare}
      />
    </div>
  );
}
