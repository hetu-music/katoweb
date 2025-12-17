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

export function useMusicLibraryState(
    initialSliderYearsLength: number,
    defaultViewMode: 'grid' | 'list' = 'grid'
) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [isInitialized, setIsInitialized] = useState(false);

    // State definitions
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState("全部");
    const [filterLyricist, setFilterLyricist] = useState("全部");
    const [filterComposer, setFilterComposer] = useState("全部");
    const [filterArranger, setFilterArranger] = useState("全部");
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(defaultViewMode);
    const [currentPage, setCurrentPage] = useState(1);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [yearRangeIndices, setYearRangeIndices] = useState<[number, number]>([0, 0]);

    // Scroll restoration state
    const [isRestoringScroll, setIsRestoringScroll] = useState(true);
    const hasRestoredScroll = useRef(false);

    // Initialize state from URL on mount
    useEffect(() => {
        if (isInitialized) return;

        // Safely get params
        const getParam = (key: string, def: string) => {
            const val = searchParams.get(key);
            return val !== null ? val : def;
        };

        const q = getParam("q", "");
        const type = getParam("type", "全部");
        const lyricist = getParam("lyricist", "全部");
        const composer = getParam("composer", "全部");
        const arranger = getParam("arranger", "全部");
        const view = getParam("view", defaultViewMode) as 'grid' | 'list';
        const page = parseInt(getParam("page", "1"), 10);
        const advanced = getParam("advanced", "false") === "true";

        // Year range
        // If param exists, parse it. If not, default to full range using initialSliderYearsLength
        // Note: initialSliderYearsLength might be 0 initially if data is empty, but usually it's static data
        const maxIndex = Math.max(0, initialSliderYearsLength - 1);
        const yearStartStr = searchParams.get("yearStart");
        const yearEndStr = searchParams.get("yearEnd");

        let startIdx = 0;
        let endIdx = maxIndex;

        if (yearStartStr !== null) startIdx = parseInt(yearStartStr, 10);
        if (yearEndStr !== null) endIdx = parseInt(yearEndStr, 10);

        // Clamp
        startIdx = Math.max(0, Math.min(startIdx, maxIndex));
        endIdx = Math.max(0, Math.min(endIdx, maxIndex));

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

        setIsInitialized(true);
    }, [searchParams, isInitialized, initialSliderYearsLength, defaultViewMode]);

    // Handle year range initialization when sliderYearsLength updates (if it was 0 initially)
    useEffect(() => {
        if (!isInitialized && initialSliderYearsLength > 0) {
            // This block might be redundant if the main init effect runs, but good for safety
            // actually main effect depends on initialSliderYearsLength, so it will run when it changes.
        }
    }, [initialSliderYearsLength, isInitialized]);

    // Reset page to 1 when any filter changes
    useEffect(() => {
        if (!isInitialized) return;

        // Reset to page 1 when any filter changes
        setCurrentPage(1);
    }, [
        isInitialized,
        searchQuery,
        filterType,
        filterLyricist,
        filterComposer,
        filterArranger,
        yearRangeIndices[0],
        yearRangeIndices[1]
    ]);

    // Sync state to URL with debounce
    useEffect(() => {
        if (!isInitialized) return;

        const timer = setTimeout(() => {
            const params = new URLSearchParams();

            if (searchQuery) params.set("q", searchQuery);
            if (filterType !== "全部") params.set("type", filterType);
            if (filterLyricist !== "全部") params.set("lyricist", filterLyricist);
            if (filterComposer !== "全部") params.set("composer", filterComposer);
            if (filterArranger !== "全部") params.set("arranger", filterArranger);
            if (viewMode !== defaultViewMode) params.set("view", viewMode);
            if (currentPage > 1) params.set("page", currentPage.toString());
            if (showAdvancedFilters) params.set("advanced", "true");

            // Year range - only save if different from default full range
            const maxIndex = Math.max(0, initialSliderYearsLength - 1);
            if (yearRangeIndices[0] !== 0 || yearRangeIndices[1] !== maxIndex) {
                params.set("yearStart", yearRangeIndices[0].toString());
                params.set("yearEnd", yearRangeIndices[1].toString());
            }

            const newUrl = `${window.location.pathname}?${params.toString()}`;
            // Only replace if changed
            if (newUrl !== window.location.pathname + window.location.search) {
                window.history.replaceState(null, "", newUrl);
            }

        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [
        isInitialized,
        searchQuery,
        filterType,
        filterLyricist,
        filterComposer,
        filterArranger,
        viewMode,
        currentPage,
        showAdvancedFilters,
        yearRangeIndices,
        initialSliderYearsLength,
        defaultViewMode
    ]);

    // Scroll Restoration Logic
    useEffect(() => {
        // Attempt scroll restoration once initialized and data potentially ready
        // We rely on isInitialized to know we have set the filters.
        // The component using this hook should render the list. 
        // We add a small delay to allow list rendering.

        if (isInitialized && !hasRestoredScroll.current) {
            const savedScroll = sessionStorage.getItem("music_library_scrollY");
            if (savedScroll) {
                // Need a bit of time for layout to settle (items to populate)
                // Use requestAnimationFrame or setTimeout
                const targetY = parseInt(savedScroll, 10);
                let attempts = 0;
                const maxAttempts = 20;

                const attemptScroll = () => {
                    attempts++;

                    const docHeight = Math.max(
                        document.body.scrollHeight,
                        document.documentElement.scrollHeight
                    );

                    if (docHeight >= targetY + window.innerHeight * 0.5) {
                        window.scrollTo(0, targetY);

                        requestAnimationFrame(() => {
                            const currentY = window.scrollY;
                            const diff = Math.abs(currentY - targetY);

                            if (diff < 100 || attempts >= maxAttempts) {
                                sessionStorage.removeItem("music_library_scrollY");
                                hasRestoredScroll.current = true;
                                requestAnimationFrame(() => {
                                    setIsRestoringScroll(false);
                                });
                            } else {
                                setTimeout(attemptScroll, 50);
                            }
                        });
                    } else if (attempts < maxAttempts) {
                        setTimeout(attemptScroll, 50);
                    } else {
                        sessionStorage.removeItem("music_library_scrollY");
                        setIsRestoringScroll(false);
                    }
                };

                setTimeout(attemptScroll, 200);
            } else {
                setIsRestoringScroll(false);
            }
        } else if (isInitialized && hasRestoredScroll.current) {
            setIsRestoringScroll(false);
        }
    }, [isInitialized]);

    const handleSongClick = useCallback(() => {
        if (typeof window !== "undefined") {
            sessionStorage.setItem("music_library_scrollY", window.scrollY.toString());
        }
    }, []);

    const resetAllFilters = useCallback(() => {
        setSearchQuery("");
        setFilterType("全部");
        setFilterLyricist("全部");
        setFilterComposer("全部");
        setFilterArranger("全部");
        setYearRangeIndices([0, Math.max(0, initialSliderYearsLength - 1)]);
        setCurrentPage(1);
        // Keep view mode and advanced filters visibility
    }, [initialSliderYearsLength]);

    return {
        searchQuery, setSearchQuery,
        filterType, setFilterType,
        yearRangeIndices, setYearRangeIndices,
        filterLyricist, setFilterLyricist,
        filterComposer, setFilterComposer,
        filterArranger, setFilterArranger,
        viewMode, setViewMode,
        currentPage, setPaginationPage: setCurrentPage,
        showAdvancedFilters, setShowAdvancedFilters,
        resetAllFilters,
        handleSongClick,
        isRestoringScroll
    };
}
