"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
    viewMode: 'grid' | 'list';
    setViewMode: (mode: 'grid' | 'list') => void;
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
const SCROLL_RESTORE_DELAY_MS = 200;
const SCROLL_RESTORE_INTERVAL_MS = 50;
const MAX_SCROLL_ATTEMPTS = 20;
const SCROLL_TOLERANCE_PX = 100;

export function useMusicLibraryState(
    initialSliderYearsLength: number,
    defaultViewMode: 'grid' | 'list' = 'grid'
) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Initialization flag
    const [isInitialized, setIsInitialized] = useState(false);

    // Filter and view states
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("全部");
    const [filterLyricist, setFilterLyricist] = useState("全部");
    const [filterComposer, setFilterComposer] = useState("全部");
    const [filterArranger, setFilterArranger] = useState("全部");
    const [yearRangeIndices, setYearRangeIndices] = useState<[number, number]>([0, 0]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(defaultViewMode);
    const [currentPage, setCurrentPage] = useState(1);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    // Scroll restoration
    const [isRestoringScroll, setIsRestoringScroll] = useState(true);
    const hasRestoredScroll = useRef(false);

    // Track previous filters to detect actual changes
    const previousFilters = useRef<FilterState | null>(null);

    // Helper: Get max year index
    const getMaxYearIndex = useCallback(() => Math.max(0, initialSliderYearsLength - 1), [initialSliderYearsLength]);

    // Helper: Parse year range from URL
    const parseYearRange = useCallback((): [number, number] => {
        const maxIndex = getMaxYearIndex();
        const yearStartStr = searchParams.get("yearStart");
        const yearEndStr = searchParams.get("yearEnd");

        let startIdx = yearStartStr !== null ? parseInt(yearStartStr, 10) : 0;
        let endIdx = yearEndStr !== null ? parseInt(yearEndStr, 10) : maxIndex;

        // Clamp values
        startIdx = Math.max(0, Math.min(startIdx, maxIndex));
        endIdx = Math.max(0, Math.min(endIdx, maxIndex));

        return [startIdx, endIdx];
    }, [searchParams, getMaxYearIndex]);

    // Helper: Get URL param with default
    const getParam = useCallback((key: string, defaultValue: string) => {
        return searchParams.get(key) ?? defaultValue;
    }, [searchParams]);

    // Initialize state from URL on mount
    useEffect(() => {
        if (isInitialized) return;

        const q = getParam("q", "");
        const type = getParam("type", "全部");
        const lyricist = getParam("lyricist", "全部");
        const composer = getParam("composer", "全部");
        const arranger = getParam("arranger", "全部");
        const view = getParam("view", defaultViewMode) as 'grid' | 'list';
        const page = parseInt(getParam("page", "1"), 10);
        const advanced = getParam("advanced", "false") === "true";
        const [startIdx, endIdx] = parseYearRange();

        // Set all states
        setSearchQuery(q);
        setFilterType(type);
        setFilterLyricist(lyricist);
        setFilterComposer(composer);
        setFilterArranger(arranger);
        setViewMode(view);
        setCurrentPage(page);
        setShowAdvancedFilters(advanced);

        if (initialSliderYearsLength > 0) {
            setYearRangeIndices([startIdx, endIdx]);
        }

        // Initialize previous filters to prevent reset on first load
        previousFilters.current = {
            searchQuery: q,
            filterType: type,
            filterLyricist: lyricist,
            filterComposer: composer,
            filterArranger: arranger,
            yearRangeIndices: [startIdx, endIdx]
        };

        setIsInitialized(true);
    }, [searchParams, isInitialized, initialSliderYearsLength, defaultViewMode, getParam, parseYearRange]);

    // Reset page to 1 when filters change (excluding initialization)
    useEffect(() => {
        if (!isInitialized || !previousFilters.current) return;

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
                yearRangeIndices: [...yearRangeIndices]
            };
        }
    }, [isInitialized, searchQuery, filterType, filterLyricist, filterComposer, filterArranger, yearRangeIndices]);

    // Sync state to URL (debounced)
    useEffect(() => {
        if (!isInitialized) return;

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
        isInitialized, searchQuery, filterType, filterLyricist, filterComposer,
        filterArranger, viewMode, currentPage, showAdvancedFilters,
        yearRangeIndices, defaultViewMode, getMaxYearIndex
    ]);

    // Scroll restoration logic
    useEffect(() => {
        if (!isInitialized || hasRestoredScroll.current) {
            if (hasRestoredScroll.current) {
                setIsRestoringScroll(false);
            }
            return;
        }

        const savedScroll = sessionStorage.getItem(STORAGE_KEY);
        if (!savedScroll) {
            setIsRestoringScroll(false);
            return;
        }

        const targetY = parseInt(savedScroll, 10);
        let attempts = 0;

        const attemptScroll = () => {
            attempts++;
            const docHeight = Math.max(
                document.body.scrollHeight,
                document.documentElement.scrollHeight
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
                setIsRestoringScroll(false);
            }
        };

        setTimeout(attemptScroll, SCROLL_RESTORE_DELAY_MS);
    }, [isInitialized]);

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
        isRestoringScroll
    };
}
