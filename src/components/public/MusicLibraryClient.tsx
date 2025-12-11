"use client";

import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { 
  Search, 
  Grid, 
  List, 
  X,
  RotateCcw, 
  Info, 
  Music, 
  Calendar, 
  Mic2,
  User,
  Disc
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { MusicLibraryClientProps, SongDetail } from "@/lib/types";
import {
  getCoverUrl,
  calculateFilterOptions,
  filterSongs,
  mapAndSortSongs,
} from "@/lib/utils";
import { typeColorMap, genreColorMap } from "@/lib/constants";
import About from "./About";
import TypeExplanation from "./TypeExplanation";
import SongFilters from "./SongFilters";
import Pagination from "./Pagination";
import { usePagination } from "@/hooks/usePagination";
import WallpaperControls from "./WallpaperControls";
import FloatingActionButtons from "./FloatingActionButtons";
import { useWallpaper } from "@/context/WallpaperContext";
import { motion, AnimatePresence } from "framer-motion";

const MusicLibraryClient: React.FC<MusicLibraryClientProps> = ({
  initialSongsData,
}) => {
  const router = useRouter();

  const [isClient, setIsClient] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("全部");
  const [selectedYear, setSelectedYear] = useState("全部");
  const [selectedLyricist, setSelectedLyricist] = useState("全部");
  const [selectedComposer, setSelectedComposer] = useState("全部");
  const [selectedArranger, setSelectedArranger] = useState("全部");
  const [viewMode, setViewMode] = useState("grid");
  const [aboutOpen, setAboutOpen] = useState(false);
  const [typeExplanationOpen, setTypeExplanationOpen] = useState(false);
  
  // Scroll Restoration States
  const [showScrollTop, setShowScrollTop] = useState(false);
  const hasRestoredScroll = useRef(false);
  const [restoringScroll, setRestoringScroll] = useState(true);

  // Wallpaper
  const {
    isLoading: wallpaperLoading,
    refreshWallpaper,
    wallpaperEnabled,
    toggleWallpaper,
    isHydrated,
  } = useWallpaper();

  const songsData = initialSongsData;

  const initialFiltersRef = useRef<{
    searchTerm: string;
    selectedType: string;
    selectedYear: string;
    selectedLyricist: string;
    selectedComposer: string;
    selectedArranger: string;
  } | null>(null);

  const isReturningFromDetail = useRef(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const getFirstElement = (arr: string[] | null | undefined): string => {
    return arr && arr.length > 0 && arr[0] ? arr[0] : "";
  };

  // Initialize Client & URL Params
  useEffect(() => {
    const initializeClient = () => {
      setIsClient(true);
    };
    initializeClient();

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);

      // Scroll restoration check
      const hasScrollPosition = sessionStorage.getItem("music_scrollY");
      if (hasScrollPosition) {
        isReturningFromDetail.current = true;
      }

      // Restore params
      const urlSearchTerm = params.get("q") || "";
      const urlType = params.get("type") || "全部";
      const urlYear = params.get("year") || "全部";
      const urlLyricist = params.get("lyricist") || "全部";
      const urlComposer = params.get("composer") || "全部";
      const urlArranger = params.get("arranger") || "全部";
      const urlViewMode = params.get("view") || "grid";

      setSearchTerm(urlSearchTerm);
      setSelectedType(urlType);
      setSelectedYear(urlYear);
      setSelectedLyricist(urlLyricist);
      setSelectedComposer(urlComposer);
      setSelectedArranger(urlArranger);
      setViewMode(urlViewMode);

      if (
        isReturningFromDetail.current &&
        (urlSearchTerm ||
          urlType !== "全部" ||
          urlYear !== "全部" ||
          urlLyricist !== "全部" ||
          urlComposer !== "全部" ||
          urlArranger !== "全部")
      ) {
        setDebouncedSearchTerm(urlSearchTerm);
      }

      setTimeout(() => setIsInitialized(true), 0);
    }
  }, []);

  // Clean up touch states
  useEffect(() => {
    if (isClient) {
      const cleanupTouchStates = () => {
        const elements = document.querySelectorAll(
          ".touch-active-pressed, .touch-navigating",
        );
        elements.forEach((element) => {
          element.classList.remove("touch-active-pressed", "touch-navigating");
        });
      };
      cleanupTouchStates();
      const handleFocus = () => cleanupTouchStates();
      const handleVisibilityChange = () => {
        if (!document.hidden) cleanupTouchStates();
      };
      const handlePopState = () => cleanupTouchStates();

      window.addEventListener("focus", handleFocus);
      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("popstate", handlePopState);

      const handleLoad = () => cleanupTouchStates();
      if (document.readyState === "complete") {
        handleLoad();
      } else {
        window.addEventListener("load", handleLoad);
      }

      return () => {
        window.removeEventListener("focus", handleFocus);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        window.removeEventListener("popstate", handlePopState);
        window.removeEventListener("load", handleLoad);
      };
    }
  }, [isClient]);

  // Scroll Restoration Logic
  useEffect(() => {
    if (!hasRestoredScroll.current && isClient) {
      const scrollY = sessionStorage.getItem("music_scrollY");
      if (scrollY) {
        const timeoutId = setTimeout(() => {
          window.scrollTo(0, parseInt(scrollY, 10));
          sessionStorage.removeItem("music_scrollY");
          hasRestoredScroll.current = true;
          setRestoringScroll(false);
        }, 200);
        return () => clearTimeout(timeoutId);
      } else {
        requestAnimationFrame(() => setRestoringScroll(false));
      }
    } else if (isClient) {
      setRestoringScroll(false);
    }
  }, [isClient]);

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

  const handleClearAllFilters = () => {
    setSearchTerm("");
    setSelectedType("全部");
    setSelectedYear("全部");
    setSelectedLyricist("全部");
    setSelectedComposer("全部");
    setSelectedArranger("全部");
    setViewMode("grid");
    setPaginationPage(1);

    if (typeof window !== "undefined") {
      const newUrl = window.location.pathname;
      window.history.replaceState(null, "", newUrl);
    }
    sessionStorage.removeItem("music_scrollY");
    sessionStorage.setItem("music_filters_reset", "true");
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
        // ignore
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert("链接已复制到剪贴板");
      } catch {
        // ignore
      }
    }
  };

  const filterOptions = useMemo(() => {
    return calculateFilterOptions(songsData);
  }, [songsData]);

  // Debounce Search
  useEffect(() => {
    if (!isInitialized || isReturningFromDetail.current) {
      setDebouncedSearchTerm(searchTerm);
      if (isReturningFromDetail.current) {
        isReturningFromDetail.current = false;
      }
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, isInitialized]);

  // Filter Logic
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

  const getInitialPage = () => {
    if (!isClient || typeof window === "undefined") return 1;
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get("page") || "1", 10);
  };

  const {
    currentPage,
    totalPages,
    currentData: paginatedSongs,
    setCurrentPage: setPaginationPage,
    startIndex,
    endIndex,
  } = usePagination({
    data: filteredSongs,
    itemsPerPage: 30,
    initialPage: getInitialPage(),
    resetOnDataChange: false,
  });

  const setCurrentPage = useCallback(
    (page: number) => {
      setPaginationPage(page);
      if (isClient && typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (page !== 1) {
          params.set("page", page.toString());
        } else {
          params.delete("page");
        }
        const newUrl = `${window.location.pathname}${params.toString() ? "?" + params.toString() : ""}`;
        window.history.replaceState(null, "", newUrl);
      }
    },
    [setPaginationPage, isClient],
  );

  // Sync URL
  useEffect(() => {
    if (!isClient || typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);

    if (searchTerm) params.set("q", searchTerm);
    else params.delete("q");
    if (selectedType && selectedType !== "全部") params.set("type", selectedType);
    else params.delete("type");
    if (selectedYear && selectedYear !== "全部") params.set("year", selectedYear);
    else params.delete("year");
    if (selectedLyricist && selectedLyricist !== "全部") params.set("lyricist", selectedLyricist);
    else params.delete("lyricist");
    if (selectedComposer && selectedComposer !== "全部") params.set("composer", selectedComposer);
    else params.delete("composer");
    if (selectedArranger && selectedArranger !== "全部") params.set("arranger", selectedArranger);
    else params.delete("arranger");
    if (viewMode && viewMode !== "grid") params.set("view", viewMode);
    else params.delete("view");

    if (isInitialized && initialFiltersRef.current) {
      const filtersChanged =
        searchTerm !== initialFiltersRef.current.searchTerm ||
        selectedType !== initialFiltersRef.current.selectedType ||
        selectedYear !== initialFiltersRef.current.selectedYear ||
        selectedLyricist !== initialFiltersRef.current.selectedLyricist ||
        selectedComposer !== initialFiltersRef.current.selectedComposer ||
        selectedArranger !== initialFiltersRef.current.selectedArranger;

      if (filtersChanged) {
        params.delete("page");
        setPaginationPage(1);
        initialFiltersRef.current = {
          searchTerm,
          selectedType,
          selectedYear,
          selectedLyricist,
          selectedComposer,
          selectedArranger,
        };
      }
    } else if (isInitialized && !initialFiltersRef.current) {
      initialFiltersRef.current = {
        searchTerm,
        selectedType,
        selectedYear,
        selectedLyricist,
        selectedComposer,
        selectedArranger,
      };
    }

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
    isClient,
    isInitialized,
    setPaginationPage,
  ]);

  useEffect(() => {
    if (!hasRestoredScroll.current && isClient && paginatedSongs.length > 0) {
      const scrollY = sessionStorage.getItem("music_scrollY");
      if (scrollY) {
        const timeoutId = setTimeout(() => {
          window.scrollTo(0, parseInt(scrollY, 10));
          sessionStorage.removeItem("music_scrollY");
          hasRestoredScroll.current = true;
          setRestoringScroll(false);
        }, 50);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [isClient, paginatedSongs.length, currentPage]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } },
  };

  return (
    <div className="relative min-h-screen text-slate-100">
      <div
        style={{ opacity: restoringScroll ? 0 : 1, transition: "opacity 0.4s ease-out" }}
        className="pb-24"
      >
        {aboutOpen && <About onClose={() => setAboutOpen(false)} />}
        {typeExplanationOpen && (
          <TypeExplanation onClose={() => setTypeExplanationOpen(false)} />
        )}

        {/* Hero Section */}
        <section className="relative pt-24 pb-12 px-6 flex flex-col items-center justify-center text-center z-10 overflow-hidden">
             {/* Background Decoration */}
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none -z-10" />
             
            <motion.div
             initial={{ opacity: 0, y: -30 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.7, ease: "easeOut" }}
             className="relative z-10"
            >
              <h1 
                className="text-6xl md:text-8xl font-black mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-purple-200 to-indigo-300 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] cursor-pointer hover:scale-[1.01] transition-transform duration-500"
                onClick={handleClearAllFilters}
              >
                  河图作品勘鉴
              </h1>
              <p className="text-xl md:text-2xl text-blue-100/80 font-light tracking-wide max-w-2xl mx-auto mb-10 leading-relaxed">
                聆听岁月流淌的声音，探索每一首歌曲背后的故事
              </p>
            </motion.div>

            {/* Search Bar */}
            <motion.div 
               className="w-full max-w-3xl relative group z-20"
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.2, duration: 0.5 }}
            >
                <div className="relative">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-blue-200/50 group-focus-within:text-blue-200 transition-colors">
                      <Search size={24} />
                  </div>
                  <input
                    type="text"
                    placeholder="搜索歌曲、专辑、歌词、作曲者..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-16 pl-14 pr-14 rounded-full bg-white/5 backdrop-blur-xl border border-white/20 text-white placeholder-blue-200/30 text-lg shadow-[0_8px_32px_rgba(0,0,0,0.1)] focus:outline-none focus:ring-2 focus:ring-purple-400/30 focus:bg-white/10 focus:border-white/30 transition-all duration-300"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full text-blue-200/50 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
            </motion.div>
        </section>

        {/* Main Content */}
        <div className="container mx-auto px-4 md:px-8">
          
          {/* Controls & Filters */}
          <div className="mb-10 space-y-6">
             {/* Filter Bar */}
             <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-5 shadow-xl"
             >
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
             </motion.div>

             {/* Status & Toggle Bar */}
             <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="flex flex-col md:flex-row items-center justify-between gap-4 px-2"
              >
                 {/* Stats */}
                 <div className="flex items-center gap-4 text-sm font-medium">
                    <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-400/20 rounded-full text-indigo-200">
                        <Disc size={16} />
                        <span>总计 <span className="text-white font-bold ml-1">{songsData.length}</span></span>
                    </div>
                    {(filteredSongs.length !== songsData.length) && (
                       <div className="flex items-center gap-2 px-4 py-2 bg-pink-500/10 border border-pink-400/20 rounded-full text-pink-200">
                           <div className="w-2 h-2 rounded-full bg-pink-400 animate-pulse"/>
                           <span>筛选 <span className="text-white font-bold ml-1">{filteredSongs.length}</span></span>
                       </div>
                    )}
                 </div>

                 {/* Actions */}
                 <div className="flex items-center gap-3">
                     <div className="hidden md:flex items-center gap-3 mr-4 border-r border-white/10 pr-4">
                         <WallpaperControls
                            enabled={wallpaperEnabled}
                            isLoading={wallpaperLoading}
                            onToggle={toggleWallpaper}
                            onRefresh={refreshWallpaper}
                            isHydrated={isHydrated}
                          />
                          <button
                            onClick={() => setAboutOpen(true)}
                            className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/20 hover:scale-105 transition-all text-white/80"
                            title="关于本站"
                          >
                            <Info size={18} />
                          </button>
                     </div>

                     <div className="flex bg-black/20 p-1 rounded-full border border-white/10 backdrop-blur-md">
                        <button
                          onClick={() => setViewMode("grid")}
                          className={`p-2.5 rounded-full transition-all duration-300 ${viewMode === 'grid' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/80'}`}
                          title="网格视图"
                        >
                           <Grid size={18} />
                        </button>
                        <button
                          onClick={() => setViewMode("list")}
                          className={`p-2.5 rounded-full transition-all duration-300 ${viewMode === 'list' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/80'}`}
                          title="列表视图"
                        >
                           <List size={18} />
                        </button>
                    </div>
                    
                    {/* Reset Button */}
                    {(searchTerm || selectedType !== "全部" || selectedYear !== "全部" || selectedLyricist !== "全部" || selectedComposer !== "全部" || selectedArranger !== "全部") && (
                        <button
                            onClick={handleClearAllFilters}
                            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 text-red-100 border border-red-500/30 hover:bg-red-500/30 hover:border-red-400/50 transition-all text-sm font-medium"
                        >
                            <RotateCcw size={14} />
                            重置
                        </button>
                    )}
                 </div>
             </motion.div>
          </div>

          {/* Song Grid/List */}
          <AnimatePresence mode="wait">
            {paginatedSongs.length === 0 ? (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }} 
                    className="flex flex-col items-center justify-center py-20 text-blue-100/50 min-h-[400px]"
                >
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-400/20 blur-2xl rounded-full" />
                        <Music size={80} strokeWidth={1} className="relative mb-6 opacity-60 text-blue-200" />
                    </div>
                    <p className="text-2xl font-light tracking-wider mb-2">没有找到相关歌曲</p>
                    <p className="text-sm opacity-60 mb-8">换个关键词试试，或者清除筛选条件</p>
                    <button 
                        onClick={handleClearAllFilters}
                        className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full transition-all hover:scale-105 active:scale-95"
                    >
                        清除所有筛选
                    </button>
                </motion.div>
            ) : viewMode === "grid" ? (
              <motion.div
                key="grid"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6"
              >
                {paginatedSongs.map((song) => (
                  <motion.div
                    key={song.id}
                    variants={itemVariants}
                    layoutId={`song-${song.id}`}
                    className="group"
                    onClick={(e) => {
                      sessionStorage.setItem("music_scrollY", String(window.scrollY));
                      router.push(`/song/${song.id}${window.location.search}`);
                    }}
                  >
                     <div className="relative aspect-square rounded-3xl overflow-hidden bg-white/5 cursor-pointer transform transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] ring-1 ring-white/10 hover:ring-white/30 group">
                        <Image
                            src={getCoverUrl(song)}
                            alt={song.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 transition-opacity duration-300"/>
                        
                        {/* Play Icon Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100 pointer-events-none">
                             <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/40 text-white shadow-2xl">
                                 <Music size={24} fill="currentColor" />
                             </div>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 p-5 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                            <h3 className="font-bold text-white text-xl truncate leading-tight mb-1 drop-shadow-md">{song.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-300/90 font-medium">
                                <span className="truncate max-w-[60%]">{song.album || "单曲"}</span>
                                <span className="w-1 h-1 bg-gray-400 rounded-full shrink-0"/>
                                <span>{song.year || "-"}</span>
                            </div>
                            <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                                {(song.type || []).slice(0, 3).map((t) => (
                                   <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/10 text-white/90">
                                     {t}
                                   </span>
                                ))}
                            </div>
                        </div>
                     </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
                <motion.div
                    key="list"
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="flex flex-col gap-3"
                >
                    {paginatedSongs.map((song) => (
                        <motion.div
                            key={song.id}
                            variants={itemVariants}
                            layoutId={`song-list-${song.id}`}
                            className="group flex items-center p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all hover:shadow-lg cursor-pointer"
                            onClick={() => {
                                sessionStorage.setItem("music_scrollY", String(window.scrollY));
                                router.push(`/song/${song.id}${window.location.search}`);
                            }}
                        >
                            <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-lg">
                                <Image 
                                    src={getCoverUrl(song)} 
                                    alt={song.title} 
                                    fill 
                                    className="object-cover group-hover:scale-110 transition-transform duration-500" 
                                />
                            </div>
                            
                            <div className="ml-5 flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                                <div className="md:col-span-4">
                                     <h3 className="text-white font-bold text-lg truncate group-hover:text-purple-300 transition-colors">{song.title}</h3>
                                     <p className="text-sm text-gray-400 truncate mt-0.5">{song.album || "单曲"}</p>
                                </div>
                                
                                <div className="hidden md:flex md:col-span-3 items-center gap-2 text-sm text-gray-400">
                                   <User size={14} className="text-gray-500"/>
                                   <span className="truncate">{getFirstElement(song.lyricist) || "未知作词"}</span>
                                </div>

                                <div className="hidden md:flex md:col-span-3 items-center gap-2 text-sm text-gray-400">
                                    <Mic2 size={14} className="text-gray-500"/>
                                    <span className="truncate">{getFirstElement(song.composer) || "未知作曲"}</span>
                                </div>

                                <div className="hidden md:flex md:col-span-2 items-center justify-end text-sm text-gray-500 font-mono">
                                    {song.year || "未知"}
                                </div>
                            </div>

                            <div className="ml-4 flex items-center">
                                <div className="p-2 rounded-full bg-white/5 text-gray-400 group-hover:bg-purple-500/20 group-hover:text-purple-200 transition-colors">
                                     <Music size={18} />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}
          </AnimatePresence>

          {/* Pagination */}
          {filteredSongs.length > 30 && (
             <motion.div 
               className="mt-16 mb-8"
               initial={{ opacity: 0 }}
               whileInView={{ opacity: 1 }}
               viewport={{ once: true }}
             >
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
             </motion.div>
          )}
        </div>
        
        {/* Floating Actions */}
        <FloatingActionButtons
          showScrollTop={showScrollTop}
          onScrollToTop={scrollToTop}
          onShare={handleShare}
        />
      </div>
    </div>
  );
};

export default MusicLibraryClient;
