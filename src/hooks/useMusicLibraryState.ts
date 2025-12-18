"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
}

interface FilterState {
  searchQuery: string;
  filterType: string;
  filterLyricist: string;
  filterComposer: string;
  filterArranger: string;
  yearRangeIndices: [number, number];
}

const STORAGE_KEY = "music_library_scrollY";
const URL_DEBOUNCE_MS = 300;
const SCROLL_RESTORE_DELAY_MS = 50; // Reduced from 200ms for faster restoration
const SCROLL_RESTORE_INTERVAL_MS = 30; // Reduced from 50ms for faster retry
const MAX_SCROLL_ATTEMPTS = 20;
const SCROLL_TOLERANCE_PX = 100;

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
  const hasRestoredScroll = useRef(false);

  // Track previous filters to detect actual changes - Initialize with current values
  const previousFilters = useRef<FilterState>({
    searchQuery: searchParams.get("q") ?? "",
    filterType: searchParams.get("type") ?? "全部",
    filterLyricist: searchParams.get("lyricist") ?? "全部",
    filterComposer: searchParams.get("composer") ?? "全部",
    filterArranger: searchParams.get("arranger") ?? "全部",
    yearRangeIndices: parseYearRange,
  });

  // Reset page to 1 when filters change
  useEffect(() => {
    const prev = previousFilters.current;
    const filtersChanged =
      prev.searchQuery !== searchQuery ||
      prev.filterType !== filterType ||
      prev.filterLyricist !== filterLyricist ||
      prev.filterComposer !== filterComposer ||
      prev.filterArranger !== filterArranger ||
      prev.yearRangeIndices[0] !== yearRangeIndices[0] ||
      prev.yearRangeIndices[1] !== yearRangeIndices[1];

    if (filtersChanged) {
      setCurrentPage(1);

      // Update tracked filters
      previousFilters.current = {
        searchQuery,
        filterType,
        filterLyricist,
        filterComposer,
        filterArranger,
        yearRangeIndices: [...yearRangeIndices],
      };
    }
  }, [
    searchQuery,
    filterType,
    filterLyricist,
    filterComposer,
    filterArranger,
    yearRangeIndices,
  ]);

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

  // Core scroll restoration function - reusable for both initial mount and popstate
  const performScrollRestoration = useCallback(() => {
    const savedScroll = sessionStorage.getItem(STORAGE_KEY);
    if (!savedScroll) {
      setIsRestoringScroll(false);
      return;
    }

    setIsRestoringScroll(true);
    const targetY = parseInt(savedScroll, 10);
    let attempts = 0;

    const attemptScroll = () => {
      attempts++;
      const docHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
      );

      // Check if document is tall enough for target scroll position
      if (docHeight >= targetY + window.innerHeight * 0.5) {
        window.scrollTo(0, targetY);

        requestAnimationFrame(() => {
          const currentY = window.scrollY;
          const diff = Math.abs(currentY - targetY);

          if (diff < SCROLL_TOLERANCE_PX || attempts >= MAX_SCROLL_ATTEMPTS) {
            // Success or max attempts - clean up
            sessionStorage.removeItem(STORAGE_KEY);
            hasRestoredScroll.current = true;
            requestAnimationFrame(() => setIsRestoringScroll(false));
          } else {
            // Try again
            setTimeout(attemptScroll, SCROLL_RESTORE_INTERVAL_MS);
          }
        });
      } else if (attempts < MAX_SCROLL_ATTEMPTS) {
        // Document not ready yet, try again
        setTimeout(attemptScroll, SCROLL_RESTORE_INTERVAL_MS);
      } else {
        // Max attempts reached, give up
        sessionStorage.removeItem(STORAGE_KEY);
        hasRestoredScroll.current = true;
        setIsRestoringScroll(false);
      }
    };

    setTimeout(attemptScroll, SCROLL_RESTORE_DELAY_MS);
  }, []);

  // Scroll restoration on initial mount
  useEffect(() => {
    if (hasRestoredScroll.current) {
      setIsRestoringScroll(false);
      return;
    }

    performScrollRestoration();
  }, [performScrollRestoration]);

  // Listen for browser's native back/forward navigation (popstate event)
  useEffect(() => {
    const handlePopState = () => {
      // Reset scroll restoration flag so restoration can run again
      hasRestoredScroll.current = false;
      // Perform scroll restoration
      performScrollRestoration();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [performScrollRestoration]);

  // Save scroll position when navigating to song detail
  const handleSongClick = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, window.scrollY.toString());
    }
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
    setPaginationPage: setCurrentPage,
    showAdvancedFilters,
    setShowAdvancedFilters,
    resetAllFilters,
    handleSongClick,
    isRestoringScroll,
  };
}
