"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";

export interface MusicLibraryState {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterType: string;
  setFilterType: (type: string) => void;
  yearRangeIndices: [number, number];
  setYearRangeIndices: (range: [number, number]) => void;
  filterLyricist: string[];
  setFilterLyricist: (lyricist: string[]) => void;
  filterComposer: string[];
  setFilterComposer: (composer: string[]) => void;
  filterArranger: string[];
  setFilterArranger: (arranger: string[]) => void;
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
const URL_THROTTLE_MS = 300;
const VIEW_MODES = ["grid", "list"] as const;

export function useMusicLibraryState(
  initialSliderYearsLength: number,
  defaultViewMode: "grid" | "list" = "grid",
): MusicLibraryState {
  const getMaxYearIndex = useCallback(
    () => Math.max(0, initialSliderYearsLength - 1),
    [initialSliderYearsLength],
  );

  const [queryState, setQueryState] = useQueryStates({
    q: parseAsString.withDefault("").withOptions({
      shallow: true,
      throttleMs: URL_THROTTLE_MS,
    }),
    type: parseAsString.withDefault("全部").withOptions({
      shallow: true,
      throttleMs: URL_THROTTLE_MS,
    }),
    lyricist: parseAsArrayOf(parseAsString)
      .withDefault([])
      .withOptions({
        shallow: true,
        throttleMs: URL_THROTTLE_MS,
      }),
    composer: parseAsArrayOf(parseAsString)
      .withDefault([])
      .withOptions({
        shallow: true,
        throttleMs: URL_THROTTLE_MS,
      }),
    arranger: parseAsArrayOf(parseAsString)
      .withDefault([])
      .withOptions({
        shallow: true,
        throttleMs: URL_THROTTLE_MS,
      }),
    yearStart: parseAsInteger.withDefault(0).withOptions({
      shallow: true,
      throttleMs: URL_THROTTLE_MS,
    }),
    yearEnd: parseAsInteger.withDefault(getMaxYearIndex()).withOptions({
      shallow: true,
      throttleMs: URL_THROTTLE_MS,
    }),
    view: parseAsStringLiteral(VIEW_MODES).withDefault(defaultViewMode).withOptions({
      shallow: true,
    }),
    page: parseAsInteger.withDefault(1).withOptions({
      shallow: true,
    }),
    advanced: parseAsBoolean.withDefault(false).withOptions({
      shallow: true,
      throttleMs: URL_THROTTLE_MS,
    }),
  });

  const yearRangeIndices = useMemo<[number, number]>(() => {
    const maxIndex = getMaxYearIndex();
    const start = Math.max(0, Math.min(queryState.yearStart, maxIndex));
    const end = Math.max(0, Math.min(queryState.yearEnd, maxIndex));

    return start <= end ? [start, end] : [end, start];
  }, [queryState.yearStart, queryState.yearEnd, getMaxYearIndex]);

  const [isRestoringScroll, setIsRestoringScroll] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(STORAGE_KEY) !== null;
  });

  useEffect(() => {
    const maxIndex = getMaxYearIndex();
    if (
      queryState.yearStart !== yearRangeIndices[0] ||
      queryState.yearEnd !== yearRangeIndices[1]
    ) {
      void setQueryState({
        yearStart: yearRangeIndices[0] === 0 ? null : yearRangeIndices[0],
        yearEnd: yearRangeIndices[1] === maxIndex ? null : yearRangeIndices[1],
      });
    }
  }, [
    getMaxYearIndex,
    queryState.yearEnd,
    queryState.yearStart,
    setQueryState,
    yearRangeIndices,
  ]);

  const restoreScroll = useCallback(() => {
    const savedScroll = sessionStorage.getItem(STORAGE_KEY);
    if (!savedScroll) {
      setIsRestoringScroll(false);
      return;
    }

    const targetY = parseInt(savedScroll, 10);
    window.scrollTo(0, targetY);
    sessionStorage.removeItem(STORAGE_KEY);

    requestAnimationFrame(() => {
      setIsRestoringScroll(false);
    });
  }, []);

  const notifyDataReady = useCallback(() => {
    restoreScroll();
  }, [restoreScroll]);

  useEffect(() => {
    const handlePopState = () => {
      if (sessionStorage.getItem(STORAGE_KEY)) {
        setIsRestoringScroll(true);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleSongClick = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, window.scrollY.toString());
    }
  }, []);

  const setSearchQuery = useCallback(
    (query: string) => {
      void setQueryState({
        q: query || null,
        page: null,
      });
    },
    [setQueryState],
  );

  const setFilterType = useCallback(
    (type: string) => {
      void setQueryState({
        type: type === "全部" ? null : type,
        page: null,
      });
    },
    [setQueryState],
  );

  const setFilterLyricist = useCallback(
    (lyricist: string[]) => {
      void setQueryState({
        lyricist: lyricist.length > 0 ? lyricist : null,
        page: null,
      });
    },
    [setQueryState],
  );

  const setFilterComposer = useCallback(
    (composer: string[]) => {
      void setQueryState({
        composer: composer.length > 0 ? composer : null,
        page: null,
      });
    },
    [setQueryState],
  );

  const setFilterArranger = useCallback(
    (arranger: string[]) => {
      void setQueryState({
        arranger: arranger.length > 0 ? arranger : null,
        page: null,
      });
    },
    [setQueryState],
  );

  const setYearRangeIndices = useCallback(
    (range: [number, number]) => {
      const maxIndex = getMaxYearIndex();
      const start = Math.max(0, Math.min(range[0], maxIndex));
      const end = Math.max(start, Math.min(range[1], maxIndex));

      void setQueryState({
        yearStart: start === 0 ? null : start,
        yearEnd: end === maxIndex ? null : end,
        page: null,
      });
    },
    [getMaxYearIndex, setQueryState],
  );

  const setViewMode = useCallback(
    (mode: "grid" | "list") => {
      void setQueryState({
        view: mode === defaultViewMode ? null : mode,
      });
    },
    [defaultViewMode, setQueryState],
  );

  const setPaginationPage = useCallback(
    (page: number) => {
      const normalizedPage = Math.max(1, page);
      void setQueryState({
        page: normalizedPage === 1 ? null : normalizedPage,
      });
    },
    [setQueryState],
  );

  const setShowAdvancedFilters = useCallback(
    (show: boolean) => {
      void setQueryState({
        advanced: show ? true : null,
      });
    },
    [setQueryState],
  );

  const resetAllFilters = useCallback(() => {
    void setQueryState({
      q: null,
      type: null,
      lyricist: null,
      composer: null,
      arranger: null,
      yearStart: null,
      yearEnd: null,
      page: null,
    });
  }, [setQueryState]);

  return {
    searchQuery: queryState.q,
    setSearchQuery,
    filterType: queryState.type,
    setFilterType,
    yearRangeIndices,
    setYearRangeIndices,
    filterLyricist: queryState.lyricist,
    setFilterLyricist,
    filterComposer: queryState.composer,
    setFilterComposer,
    filterArranger: queryState.arranger,
    setFilterArranger,
    viewMode: queryState.view,
    setViewMode,
    currentPage: Math.max(1, queryState.page),
    setPaginationPage,
    showAdvancedFilters: queryState.advanced,
    setShowAdvancedFilters,
    resetAllFilters,
    handleSongClick,
    isRestoringScroll,
    notifyDataReady,
  };
}
