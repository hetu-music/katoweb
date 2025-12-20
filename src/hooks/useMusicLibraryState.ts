"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";

export interface MusicLibraryState {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterType: string;
  setFilterType: (type: string) => void;
  yearRangeIndices: [number, number];
  setYearRangeIndices: (range: [number, number]) => void;
  filterLyricist: string;
  setFilterLyricist: (lyricist: string) => void;
  filterComposer: string;
  setFilterComposer: (composer: string) => void;
  filterArranger: string;
  setFilterArranger: (arranger: string) => void;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  currentPage: number;
  setPaginationPage: (page: number) => void;
  showAdvancedFilters: boolean;
  setShowAdvancedFilters: (show: boolean) => void;
  resetAllFilters: () => void;
  handleSongClick: () => void;
  isRestoringScroll: boolean;
  notifyDataReady: () => void;
}



const STORAGE_KEY = "music_library_scrollY";
const URL_DEBOUNCE_MS = 300;


export function useMusicLibraryState(
  initialSliderYearsLength: number,
  defaultViewMode: "grid" | "list" = "grid",
) {
  const searchParams = useSearchParams();

  // Helper: Get max year index
  const getMaxYearIndex = useCallback(
    () => Math.max(0, initialSliderYearsLength - 1),
    [initialSliderYearsLength],
  );

  // Helper: Parse year range from URL - memoized
  const parseYearRange = useMemo((): [number, number] => {
    const maxIndex = Math.max(0, initialSliderYearsLength - 1);
    const yearStartStr = searchParams.get("yearStart");
    const yearEndStr = searchParams.get("yearEnd");

    let startIdx = yearStartStr !== null ? parseInt(yearStartStr, 10) : 0;
    let endIdx = yearEndStr !== null ? parseInt(yearEndStr, 10) : maxIndex;

    // Clamp values
    startIdx = Math.max(0, Math.min(startIdx, maxIndex));
    endIdx = Math.max(0, Math.min(endIdx, maxIndex));

    return [startIdx, endIdx];
  }, [searchParams, initialSliderYearsLength]);

  // Initialize states directly from URL to avoid flickering
  const [searchQuery, setSearchQuery] = useState(
    () => searchParams.get("q") ?? "",
  );
  const [filterType, setFilterType] = useState(
    () => searchParams.get("type") ?? "全部",
  );
  const [filterLyricist, setFilterLyricist] = useState(
    () => searchParams.get("lyricist") ?? "全部",
  );
  const [filterComposer, setFilterComposer] = useState(
    () => searchParams.get("composer") ?? "全部",
  );
  const [filterArranger, setFilterArranger] = useState(
    () => searchParams.get("arranger") ?? "全部",
  );
  const [yearRangeIndices, setYearRangeIndices] = useState<[number, number]>(
    () => parseYearRange,
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    const view = searchParams.get("view");
    return view === "grid" || view === "list" ? view : defaultViewMode;
  });
  const [currentPage, setCurrentPage] = useState(() => {
    const page = searchParams.get("page");
    return page ? parseInt(page, 10) : 1;
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(
    () => searchParams.get("advanced") === "true",
  );

  // Scroll restoration - only set to true if there's actually a scroll position to restore
  const [isRestoringScroll, setIsRestoringScroll] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(STORAGE_KEY) !== null;
  });
  // Removed unused hasRestoredScroll ref

  // Sync state to URL (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      const maxIndex = getMaxYearIndex();

      // Only add non-default params to URL
      if (searchQuery) params.set("q", searchQuery);
      if (filterType !== "全部") params.set("type", filterType);
      if (filterLyricist !== "全部") params.set("lyricist", filterLyricist);
      if (filterComposer !== "全部") params.set("composer", filterComposer);
      if (filterArranger !== "全部") params.set("arranger", filterArranger);
      if (viewMode !== defaultViewMode) params.set("view", viewMode);
      if (currentPage > 1) params.set("page", currentPage.toString());
      if (showAdvancedFilters) params.set("advanced", "true");

      // Year range - only save if different from default full range
      if (yearRangeIndices[0] !== 0 || yearRangeIndices[1] !== maxIndex) {
        params.set("yearStart", yearRangeIndices[0].toString());
        params.set("yearEnd", yearRangeIndices[1].toString());
      }

      const newUrl = `${window.location.pathname}?${params.toString()}`;
      if (newUrl !== window.location.pathname + window.location.search) {
        window.history.replaceState(null, "", newUrl);
      }
    }, URL_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [
    searchQuery,
    filterType,
    filterLyricist,
    filterComposer,
    filterArranger,
    viewMode,
    currentPage,
    showAdvancedFilters,
    yearRangeIndices,
    defaultViewMode,
    getMaxYearIndex,
  ]);

  // Explicit scroll restoration - only called when data is signaled as ready
  const restoreScroll = useCallback(() => {
    const savedScroll = sessionStorage.getItem(STORAGE_KEY);
    if (!savedScroll) {
      setIsRestoringScroll(false);
      return;
    }

    const targetY = parseInt(savedScroll, 10);

    // Explicitly scroll without checking height loops - trusting the signal
    window.scrollTo(0, targetY);

    // Clean up and update state
    sessionStorage.removeItem(STORAGE_KEY);

    // Use RAF to ensure visual update happens after scroll
    requestAnimationFrame(() => {
      setIsRestoringScroll(false);
    });
  }, []);

  // Signal from the consumer that data/layout is ready
  const notifyDataReady = useCallback(() => {
    restoreScroll();
  }, [restoreScroll]);

  // Listen for browser's native back/forward navigation (popstate event)
  // When popstate occurs, we trust the component to re-render and call notifyDataReady again
  // OR we can optimistically try to restore if we still believe data is ready.
  // Given the structure, relying on the component lifecycle (useEffect -> notifyDataReady) is safer.
  // We keep a simple listener to ensure state consistency if needed, but primary driver is notifyDataReady.
  useEffect(() => {
    const handlePopState = () => {
      // If we have a saved key, ensure we flag as restoring
      if (sessionStorage.getItem(STORAGE_KEY)) {
        setIsRestoringScroll(true);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Save scroll position when navigating to song detail
  const handleSongClick = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, window.scrollY.toString());
    }
  }, []);

  // State setters wrappers that also reset pagination
  const setSearchQueryWrapped = useCallback((val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  }, []);

  const setFilterTypeWrapped = useCallback((val: string) => {
    setFilterType(val);
    setCurrentPage(1);
  }, []);

  const setFilterLyricistWrapped = useCallback((val: string) => {
    setFilterLyricist(val);
    setCurrentPage(1);
  }, []);

  const setFilterComposerWrapped = useCallback((val: string) => {
    setFilterComposer(val);
    setCurrentPage(1);
  }, []);

  const setFilterArrangerWrapped = useCallback((val: string) => {
    setFilterArranger(val);
    setCurrentPage(1);
  }, []);

  const setYearRangeIndicesWrapped = useCallback((val: [number, number]) => {
    setYearRangeIndices(val);
    setCurrentPage(1);
  }, []);

  // Reset all filters to default
  const resetAllFilters = useCallback(() => {
    setSearchQuery("");
    setFilterType("全部");
    setFilterLyricist("全部");
    setFilterComposer("全部");
    setFilterArranger("全部");
    setYearRangeIndices([0, getMaxYearIndex()]);
    setCurrentPage(1);
  }, [getMaxYearIndex]);

  return {
    searchQuery,
    setSearchQuery: setSearchQueryWrapped,
    filterType,
    setFilterType: setFilterTypeWrapped,
    yearRangeIndices,
    setYearRangeIndices: setYearRangeIndicesWrapped,
    filterLyricist,
    setFilterLyricist: setFilterLyricistWrapped,
    filterComposer,
    setFilterComposer: setFilterComposerWrapped,
    filterArranger,
    setFilterArranger: setFilterArrangerWrapped,
    viewMode,
    setViewMode,
    currentPage,
    setPaginationPage: setCurrentPage,
    showAdvancedFilters,
    setShowAdvancedFilters,
    resetAllFilters,
    handleSongClick,
    isRestoringScroll,
    notifyDataReady,
  };
}
