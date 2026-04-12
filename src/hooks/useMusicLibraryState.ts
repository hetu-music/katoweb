"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
const VIEW_MODES = ["grid", "list"] as const;

export function useMusicLibraryState(
  initialSliderYearsLength: number,
  defaultViewMode: "grid" | "list" = "grid",
): MusicLibraryState {
  const getMaxYearIndex = useCallback(
    () => Math.max(0, initialSliderYearsLength - 1),
    [initialSliderYearsLength],
  );

  // ── URL 状态（nuqs）──────────────────────────────────────────────────────────
  // 职责：①初始化（从 URL 读取一次）②持久化（写入 URL）
  // ⚠️ 不直接用于渲染，避免 nuqs 在并发模式下协调渲染时产生的"第一次点击闪旧值"bug
  const [queryState, setQueryState] = useQueryStates({
    q: parseAsString.withDefault("").withOptions({ shallow: true }),
    type: parseAsString.withDefault("全部").withOptions({ shallow: true }),
    lyricist: parseAsArrayOf(parseAsString)
      .withDefault([])
      .withOptions({ shallow: true }),
    composer: parseAsArrayOf(parseAsString)
      .withDefault([])
      .withOptions({ shallow: true }),
    arranger: parseAsArrayOf(parseAsString)
      .withDefault([])
      .withOptions({ shallow: true }),
    yearStart: parseAsInteger.withDefault(0).withOptions({ shallow: true }),
    yearEnd: parseAsInteger
      .withDefault(getMaxYearIndex())
      .withOptions({ shallow: true }),
    view: parseAsStringLiteral(VIEW_MODES)
      .withDefault(defaultViewMode)
      .withOptions({ shallow: true }),
    page: parseAsInteger.withDefault(1).withOptions({ shallow: true }),
    advanced: parseAsBoolean.withDefault(false).withOptions({ shallow: true }),
  });

  // ── 本地 UI 状态（用于所有渲染）─────────────────────────────────────────────
  // lazy initializer 读取 queryState 一次（首次渲染时的 URL 值），之后由 setter 独立维护
  const [searchQuery, setSearchQueryState] = useState(() => queryState.q);
  const [filterType, setFilterTypeState] = useState(() => queryState.type);
  const [filterLyricist, setFilterLyricistState] = useState<string[]>(
    () => queryState.lyricist,
  );
  const [filterComposer, setFilterComposerState] = useState<string[]>(
    () => queryState.composer,
  );
  const [filterArranger, setFilterArrangerState] = useState<string[]>(
    () => queryState.arranger,
  );
  const [yearStart, setYearStartState] = useState(() => queryState.yearStart);
  const [yearEnd, setYearEndState] = useState(() => queryState.yearEnd);
  const [viewMode, setViewModeState] = useState<"grid" | "list">(
    () => queryState.view,
  );
  const [currentPage, setCurrentPageState] = useState(() =>
    Math.max(1, queryState.page),
  );
  const [showAdvancedFilters, setShowAdvancedFiltersState] = useState(
    () => queryState.advanced,
  );

  // ── 年份范围（从本地状态衍生）──────────────────────────────────────────────
  const yearRangeIndices = useMemo<[number, number]>(() => {
    const maxIndex = getMaxYearIndex();
    const start = Math.max(0, Math.min(yearStart, maxIndex));
    const end = Math.max(0, Math.min(yearEnd, maxIndex));
    return start <= end ? [start, end] : [end, start];
  }, [yearStart, yearEnd, getMaxYearIndex]);

  // ── 浏览器前进/后退同步 ──────────────────────────────────────────────────────
  // 用 ref 标记是否来自浏览器导航事件（而非用户主动操作）
  // 只有确认是 popstate 后，才从 queryState 同步到本地状态
  // 这样正常用户操作的路径完全不依赖 queryState 的读取
  const pendingPopstateRef = useRef(false);

  useEffect(() => {
    const handlePopState = () => {
      pendingPopstateRef.current = true;
      // 同时处理滚动恢复
      if (sessionStorage.getItem(STORAGE_KEY)) {
        setIsRestoringScroll(true);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // 当 queryState 变化时（nuqs 处理了 popstate 后会更新），若是浏览器导航，则同步本地状态
  useEffect(() => {
    if (!pendingPopstateRef.current) return;
    pendingPopstateRef.current = false;
    setSearchQueryState(queryState.q);
    setFilterTypeState(queryState.type);
    setFilterLyricistState(queryState.lyricist);
    setFilterComposerState(queryState.composer);
    setFilterArrangerState(queryState.arranger);
    setYearStartState(queryState.yearStart);
    setYearEndState(queryState.yearEnd);
    setViewModeState(queryState.view);
    setCurrentPageState(Math.max(1, queryState.page));
    setShowAdvancedFiltersState(queryState.advanced);
  }, [
    queryState.q,
    queryState.type,
    queryState.lyricist,
    queryState.composer,
    queryState.arranger,
    queryState.yearStart,
    queryState.yearEnd,
    queryState.view,
    queryState.page,
    queryState.advanced,
  ]);

  // ── 滚动恢复 ─────────────────────────────────────────────────────────────────
  const [isRestoringScroll, setIsRestoringScroll] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(STORAGE_KEY) !== null;
  });

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

  const handleSongClick = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, window.scrollY.toString());
    }
  }, []);

  // ── Setter：立即更新本地状态 + 异步写 URL（副作用）──────────────────────────

  const setSearchQuery = useCallback(
    (query: string) => {
      setSearchQueryState(query);
      setCurrentPageState(1);
      void setQueryState({ q: query || null, page: null });
    },
    [setQueryState],
  );

  const setFilterType = useCallback(
    (type: string) => {
      setFilterTypeState(type);
      setCurrentPageState(1);
      void setQueryState({ type: type === "全部" ? null : type, page: null });
    },
    [setQueryState],
  );

  const setFilterLyricist = useCallback(
    (lyricist: string[]) => {
      setFilterLyricistState(lyricist);
      setCurrentPageState(1);
      void setQueryState({
        lyricist: lyricist.length > 0 ? lyricist : null,
        page: null,
      });
    },
    [setQueryState],
  );

  const setFilterComposer = useCallback(
    (composer: string[]) => {
      setFilterComposerState(composer);
      setCurrentPageState(1);
      void setQueryState({
        composer: composer.length > 0 ? composer : null,
        page: null,
      });
    },
    [setQueryState],
  );

  const setFilterArranger = useCallback(
    (arranger: string[]) => {
      setFilterArrangerState(arranger);
      setCurrentPageState(1);
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
      setYearStartState(start);
      setYearEndState(end);
      setCurrentPageState(1);
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
      setViewModeState(mode);
      void setQueryState({ view: mode === defaultViewMode ? null : mode });
    },
    [defaultViewMode, setQueryState],
  );

  const setPaginationPage = useCallback(
    (page: number) => {
      const normalizedPage = Math.max(1, page);
      setCurrentPageState(normalizedPage);
      void setQueryState({
        page: normalizedPage === 1 ? null : normalizedPage,
      });
    },
    [setQueryState],
  );

  const setShowAdvancedFilters = useCallback(
    (show: boolean) => {
      setShowAdvancedFiltersState(show);
      void setQueryState({ advanced: show ? true : null });
    },
    [setQueryState],
  );

  const resetAllFilters = useCallback(() => {
    setSearchQueryState("");
    setFilterTypeState("全部");
    setFilterLyricistState([]);
    setFilterComposerState([]);
    setFilterArrangerState([]);
    setYearStartState(0);
    setYearEndState(getMaxYearIndex());
    setCurrentPageState(1);
    setShowAdvancedFiltersState(false);
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
  }, [getMaxYearIndex, setQueryState]);

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
    setPaginationPage,
    showAdvancedFilters,
    setShowAdvancedFilters,
    resetAllFilters,
    handleSongClick,
    isRestoringScroll,
    notifyDataReady,
  };
}
