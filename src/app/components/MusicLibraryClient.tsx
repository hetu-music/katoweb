"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { Search, Grid, List, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MusicLibraryClientProps, SongDetail } from "../lib/types";
import {
  getCoverUrl,
  calculateFilterOptions,
  filterSongs,
  mapAndSortSongs,
} from "../lib/utils";
import { typeColorMap, genreColorMap } from "../lib/constants";
import About from "./About";
import TypeExplanation from "./TypeExplanation";
import SongFilters from "./SongFilters";
import WallpaperBackground from "./WallpaperBackground";
import WallpaperControls from "./WallpaperControls";
import FloatingActionButtons from "./FloatingActionButtons";
import { useWallpaper } from "../context/WallpaperContext";

const MusicLibraryClient: React.FC<MusicLibraryClientProps> = ({
  initialSongsData,
}) => {
  const router = useRouter();
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;

  // Helper function to safely get first array element
  const getFirstElement = (arr: string[] | null | undefined): string => {
    return arr && arr.length > 0 && arr[0] ? arr[0] : "";
  };

  // 1. 状态初始化
  const [searchTerm, setSearchTerm] = useState(
    () => searchParams?.get("q") || "",
  );
  const [selectedType, setSelectedType] = useState(
    () => searchParams?.get("type") || "全部",
  );
  const [selectedYear, setSelectedYear] = useState(
    () => searchParams?.get("year") || "全部",
  );
  const [selectedLyricist, setSelectedLyricist] = useState(
    () => searchParams?.get("lyricist") || "全部",
  );
  const [selectedComposer, setSelectedComposer] = useState(
    () => searchParams?.get("composer") || "全部",
  );
  const [selectedArranger, setSelectedArranger] = useState(
    () => searchParams?.get("arranger") || "全部",
  );
  const [viewMode, setViewMode] = useState(
    () => searchParams?.get("view") || "grid",
  );
  const [aboutOpen, setAboutOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const hasRestoredScroll = useRef(false);
  const [restoringScroll, setRestoringScroll] = useState(true);
  const [typeExplanationOpen, setTypeExplanationOpen] = useState(false);

  // 壁纸功能
  const {
    isLoading: wallpaperLoading,
    refreshWallpaper,
    wallpaperEnabled,
    toggleWallpaper,
    isHydrated,
  } = useWallpaper();

  const songsData = initialSongsData;

  // 2. 状态变化时同步到URL参数
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (searchTerm) params.set("q", searchTerm);
    else params.delete("q");
    if (selectedType && selectedType !== "全部")
      params.set("type", selectedType);
    else params.delete("type");
    if (selectedYear && selectedYear !== "全部")
      params.set("year", selectedYear);
    else params.delete("year");
    if (selectedLyricist && selectedLyricist !== "全部")
      params.set("lyricist", selectedLyricist);
    else params.delete("lyricist");
    if (selectedComposer && selectedComposer !== "全部")
      params.set("composer", selectedComposer);
    else params.delete("composer");
    if (selectedArranger && selectedArranger !== "全部")
      params.set("arranger", selectedArranger);
    else params.delete("arranger");
    if (viewMode && viewMode !== "grid") params.set("view", viewMode);
    else params.delete("view");
    const newUrl = `${window.location.pathname}${params.toString() ? "?" + params.toString() : ""}`;
    if (newUrl !== window.location.pathname + window.location.search) {
      window.history.replaceState(null, "", newUrl);
    }
  }, [
    searchTerm,
    selectedType,
    selectedYear,
    selectedLyricist,
    selectedComposer,
    selectedArranger,
    viewMode,
  ]);

  // 3. 滚动位置保存与恢复
  useEffect(() => {
    if (!hasRestoredScroll.current) {
      const scrollY = sessionStorage.getItem("music_scrollY");
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY, 10));
        sessionStorage.removeItem("music_scrollY");
        hasRestoredScroll.current = true;
      }
      requestAnimationFrame(() => setRestoringScroll(false));
    } else {
      setRestoringScroll(false);
    }
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleShare = async () => {
    const shareData = {
      title: "河图作品勘鉴",
      text: "来看看河图所有的作品吧！",
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        console.log("分享取消或失败");
      }
    } else {
      // 备用方案：复制链接到剪贴板
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert("链接已复制到剪贴板");
      } catch {
        console.log("复制失败");
      }
    }
  };

  // 使用 useMemo 优化筛选选项计算
  const filterOptions = useMemo(() => {
    return calculateFilterOptions(songsData);
  }, [songsData]);

  // 防抖搜索
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 过滤歌曲 - 使用防抖后的搜索词
  const filteredSongs = useMemo(() => {
    return mapAndSortSongs(
      filterSongs(
        songsData,
        debouncedSearchTerm,
        selectedType,
        selectedYear,
        selectedLyricist,
        selectedComposer,
        selectedArranger,
      ),
    );
  }, [
    debouncedSearchTerm,
    selectedType,
    selectedYear,
    songsData,
    selectedLyricist,
    selectedComposer,
    selectedArranger,
  ]);

  return (
    <WallpaperBackground>
      <div
        style={{ opacity: restoringScroll ? 0 : 1, transition: "opacity 0.2s" }}
      >
        {/* 关于弹窗 */}
        {aboutOpen && <About onClose={() => setAboutOpen(false)} />}
        {/* 类型说明弹窗 */}
        {typeExplanationOpen && (
          <TypeExplanation onClose={() => setTypeExplanationOpen(false)} />
        )}

        {/* 主容器 */}
        <div className="container mx-auto px-6 py-8">
          {/* 头部区域 */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-2">
              <div className="flex flex-col sm:flex-row sm:items-center w-full">
                <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-blue-300 to-indigo-400 drop-shadow-lg tracking-wider mb-2 sm:mb-0">
                  河图作品勘鉴
                </h1>
                {/* 小屏下按钮行 */}
                <div className="flex w-full sm:hidden justify-between mt-2 items-center">
                  <button
                    className="px-4 py-1 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200 text-sm font-medium shadow"
                    onClick={() => setAboutOpen(true)}
                  >
                    关于
                  </button>
                  <div className="flex items-center space-x-4">
                    <WallpaperControls
                      enabled={wallpaperEnabled}
                      isLoading={wallpaperLoading}
                      onToggle={toggleWallpaper}
                      onRefresh={refreshWallpaper}
                      isHydrated={isHydrated}
                    />
                    <button
                      onClick={() =>
                        setViewMode(viewMode === "grid" ? "list" : "grid")
                      }
                      className="h-10 w-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all duration-200"
                    >
                      {viewMode === "grid" ? (
                        <List size={20} />
                      ) : (
                        <Grid size={20} />
                      )}
                    </button>
                  </div>
                </div>
                {/* 大屏下关于按钮 */}
                <button
                  className="hidden sm:inline-block sm:ml-4 px-4 py-1 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200 text-sm font-medium shadow self-start sm:self-auto"
                  onClick={() => setAboutOpen(true)}
                >
                  关于
                </button>
              </div>
              {/* 大屏下壁纸控制和视图切换按钮 */}
              <div className="hidden sm:flex items-center space-x-4">
                <WallpaperControls
                  enabled={wallpaperEnabled}
                  isLoading={wallpaperLoading}
                  onToggle={toggleWallpaper}
                  onRefresh={refreshWallpaper}
                  isHydrated={isHydrated}
                />
                <button
                  onClick={() =>
                    setViewMode(viewMode === "grid" ? "list" : "grid")
                  }
                  className="p-2 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all duration-200"
                >
                  {viewMode === "grid" ? (
                    <List size={20} />
                  ) : (
                    <Grid size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* 搜索和筛选区域 - 上下布局，保证两端对齐 */}
            <div className="w-full flex flex-col gap-3">
              {/* 搜索框 */}
              <div className="w-full flex items-center relative">
                <div className="h-[48px] flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/20 border-r-0 text-white rounded-l-2xl select-none min-w-[60px] max-w-[60px] w-[60px]">
                  <Search size={20} />
                </div>
                <input
                  type="text"
                  placeholder="搜索歌曲、作词、作曲、编曲、专辑..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-[48px] w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white/15 transition-all duration-200 rounded-r-2xl border-l-0 min-w-0 pr-10"
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
              {/* 筛选框 */}
              <SongFilters
                selectedType={selectedType}
                setSelectedType={setSelectedType}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                selectedLyricist={selectedLyricist}
                setSelectedLyricist={setSelectedLyricist}
                selectedComposer={selectedComposer}
                setSelectedComposer={setSelectedComposer}
                selectedArranger={selectedArranger}
                setSelectedArranger={setSelectedArranger}
                filterOptions={filterOptions}
                onTypeExplanationOpen={() => setTypeExplanationOpen(true)}
              />
              {/* 歌曲总数和筛选数统计 */}
              <div className="mt-4 mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {/* 统计信息 */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 shadow-sm">
                    <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse"></div>
                    <span className="text-white font-medium text-sm">
                      总计{" "}
                      <span className="text-blue-200 font-semibold">
                        {songsData.length}
                      </span>{" "}
                      首
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 shadow-sm">
                    <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full"></div>
                    <span className="text-white font-medium text-sm">
                      已显示{" "}
                      <span className="text-purple-200 font-semibold">
                        {filteredSongs.length}
                      </span>{" "}
                      首
                    </span>
                  </div>
                </div>

                {/* 筛选状态指示器 */}
                {(searchTerm ||
                  selectedType !== "全部" ||
                  selectedYear !== "全部" ||
                  selectedLyricist !== "全部" ||
                  selectedComposer !== "全部" ||
                  selectedArranger !== "全部") && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-amber-300/30 rounded-full px-3 py-1.5 shadow-sm min-h-[32px]">
                      <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></div>
                      <span className="text-amber-200 font-medium text-xs">
                        已应用筛选
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedType("全部");
                        setSelectedYear("全部");
                        setSelectedLyricist("全部");
                        setSelectedComposer("全部");
                        setSelectedArranger("全部");
                      }}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur-sm border border-red-300/30 rounded-full px-3 py-1.5 text-red-200 hover:text-red-100 hover:bg-gradient-to-r hover:from-red-500/30 hover:to-pink-500/30 transition-all duration-200 text-xs font-medium shadow-sm active:scale-95 touch-manipulation min-h-[32px]"
                      title="清除所有筛选"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      <span>清除</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 歌曲列表 */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6">
              {filteredSongs.map((song) => (
                <div
                  key={song.id}
                  className="group cursor-pointer touch-active"
                  onClick={(e) => {
                    sessionStorage.setItem(
                      "music_scrollY",
                      String(window.scrollY),
                    );

                    if (
                      typeof window !== "undefined" &&
                      window.matchMedia("(hover: none) and (pointer: coarse)")
                        .matches
                    ) {
                      const target = e.currentTarget;

                      // 立即添加按下效果
                      target.classList.add("touch-active-pressed");

                      // 短暂延迟后开始导航
                      setTimeout(() => {
                        target.classList.remove("touch-active-pressed");
                        target.classList.add("touch-navigating");

                        // 立即开始导航，不等待动画完成
                        router.push(
                          `/song/${song.id}${window.location.search}`,
                        );
                      }, 180);
                    } else {
                      router.push(`/song/${song.id}${window.location.search}`);
                    }
                  }}
                >
                  <div className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4 transition-all duration-300 hover:bg-white/10 hover:scale-105 hover:shadow-2xl">
                    {/* 专辑封面 */}
                    <div className="relative mb-4">
                      <Image
                        src={getCoverUrl(song)}
                        alt={song.album || song.title}
                        width={400}
                        height={400}
                        className="w-full aspect-square object-cover rounded-xl"
                        style={{ objectFit: "cover" }}
                      />
                    </div>

                    {/* 歌曲信息 */}
                    <div className="space-y-1">
                      <h3 className="font-semibold text-white text-lg truncate">
                        {song.title}
                      </h3>
                      <p className="text-gray-300 text-sm truncate">
                        {song.album || "未知"}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {song.year || "未知"} •{" "}
                        {song.length
                          ? `${Math.floor(song.length / 60)}:${(song.length % 60).toString().padStart(2, "0")}`
                          : "未知"}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(song.genre || []).map((g: string) => (
                          <span
                            key={g}
                            className={`px-2 py-1 text-xs rounded-full border ${genreColorMap[g] || "bg-blue-500/20 text-blue-300 border-blue-400/30"}`}
                          >
                            {g}
                          </span>
                        ))}
                        {(song.type || []).map((t: string) => (
                          <span
                            key={t}
                            className={`px-2 py-1 text-xs rounded-full border ${typeColorMap[t] || "bg-gray-500/20 text-gray-300 border-gray-400/30"}`}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSongs.map((song, index) => (
                <div
                  key={song.id}
                  className="group flex items-center p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-200 cursor-pointer touch-active"
                  onClick={(e) => {
                    sessionStorage.setItem(
                      "music_scrollY",
                      String(window.scrollY),
                    );

                    if (
                      typeof window !== "undefined" &&
                      window.matchMedia("(hover: none) and (pointer: coarse)")
                        .matches
                    ) {
                      const target = e.currentTarget;

                      // 立即添加按下效果
                      target.classList.add("touch-active-pressed");

                      // 短暂延迟后开始导航
                      setTimeout(() => {
                        target.classList.remove("touch-active-pressed");
                        target.classList.add("touch-navigating");

                        // 立即开始导航
                        router.push(
                          `/song/${song.id}${window.location.search}`,
                        );
                      }, 180);
                    } else {
                      router.push(`/song/${song.id}${window.location.search}`);
                    }
                  }}
                >
                  {/* 序号 */}
                  <div className="w-8 text-center text-gray-400 text-sm">
                    {index + 1}
                  </div>

                  {/* 专辑封面 */}
                  <Image
                    src={getCoverUrl(song)}
                    alt={song.album || song.title}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-lg ml-4"
                    style={{ objectFit: "cover" }}
                  />

                  {/* 歌曲信息 */}
                  <div className="flex-1 ml-4">
                    {/* 小屏：精简显示 */}
                    <div className="flex items-center justify-between md:hidden">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium truncate">
                          {song.title}
                        </h3>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {getFirstElement(song.lyricist) && (
                            <span className="text-gray-300 text-sm truncate">
                              {getFirstElement(song.lyricist)}
                            </span>
                          )}
                          {getFirstElement(song.composer) && (
                            <span className="text-gray-300 text-sm truncate">
                              {getFirstElement(song.composer)}
                            </span>
                          )}
                          {getFirstElement((song as SongDetail).arranger) && (
                            <span className="text-gray-300 text-sm truncate">
                              {getFirstElement((song as SongDetail).arranger)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 ml-2">
                        {(song.genre || []).map((g: string) => (
                          <span
                            key={g}
                            className={`px-2 py-1 text-xs rounded-full border ${genreColorMap[g] || "bg-blue-500/20 text-blue-300 border-blue-400/30"}`}
                          >
                            {g}
                          </span>
                        ))}
                        {(song.type || []).map((t: string) => (
                          <span
                            key={t}
                            className={`px-2 py-1 text-xs rounded-full border ${typeColorMap[t] || "bg-gray-500/20 text-gray-300 border-gray-400/30"}`}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    {/* 大屏：原有详细显示 */}
                    <div className="hidden md:flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-medium">{song.title}</h3>
                        <p className="text-gray-400 text-sm">
                          {song.album || "未知"} • {song.year || "未知"}
                        </p>
                      </div>
                      <div className="flex items-center space-x-6 text-gray-400 text-sm">
                        <span>
                          作词: {getFirstElement(song.lyricist) || "未知"}
                        </span>
                        <span>
                          作曲: {getFirstElement(song.composer) || "未知"}
                        </span>
                        <span>
                          编曲:{" "}
                          {getFirstElement((song as SongDetail).arranger) ||
                            "未知"}
                        </span>
                        <span>
                          {song.length
                            ? `${Math.floor(song.length / 60)}:${(song.length % 60).toString().padStart(2, "0")}`
                            : "未知"}
                        </span>
                        <div className="flex flex-wrap gap-1 ml-4">
                          {(song.genre || []).map((g: string) => (
                            <span
                              key={g}
                              className={`px-2 py-1 text-xs rounded-full border ${genreColorMap[g] || "bg-blue-500/20 text-blue-300 border-blue-400/30"}`}
                            >
                              {g}
                            </span>
                          ))}
                          {(song.type || []).map((t: string) => (
                            <span
                              key={t}
                              className={`px-2 py-1 text-xs rounded-full border ${typeColorMap[t] || "bg-gray-500/20 text-gray-300 border-gray-400/30"}`}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 无结果提示 */}
          {filteredSongs.length === 0 && (
            <div className="text-center py-16">
              <div className="text-gray-400 text-lg mb-2">
                没有找到匹配的歌曲
              </div>
              <div className="text-gray-500 text-sm">
                尝试调整搜索条件或筛选器
              </div>
            </div>
          )}
        </div>

        {/* 浮动操作按钮组 */}
        <FloatingActionButtons
          showScrollTop={showScrollTop}
          onScrollToTop={scrollToTop}
          onShare={handleShare}
        />
      </div>
    </WallpaperBackground>
  );
};

export default MusicLibraryClient;
