"use client";

import ThemeToggle from "@/components/shared/ThemeToggle";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import type { ImageryCategory, ImageryItem } from "@/lib/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { PaletteEntry, SongResult } from "./ImageryDetailPanel";
import ImageryDetailPanel from "./ImageryDetailPanel";

// ─── constants ────────────────────────────────────────────────────────────────

const INITIAL_BATCH = 80;
const BATCH_SIZE = 60;

// ─── types ────────────────────────────────────────────────────────────────────

interface Props {
  items: ImageryItem[];
  categories: ImageryCategory[];
}

interface WordDisplayData {
  item: ImageryItem;
  paletteText: string;
  paletteAccent: string;
  fontSize: number;
  breatheDuration: number;
  breatheDelay: number;
  tooltip: string;
}

// ─── shared animation observer (module-level singleton) ──────────────────────

let animObserver: IntersectionObserver | null = null;

function getAnimObserver(): IntersectionObserver | null {
  if (typeof window === "undefined") return null;
  if (!animObserver) {
    animObserver = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          (e.target as HTMLElement).style.animationPlayState = e.isIntersecting
            ? "running"
            : "paused";
        }
      },
      { rootMargin: "120px" },
    );
  }
  return animObserver;
}

// ─── palette ──────────────────────────────────────────────────────────────────

const PALETTE_TEXT = [
  "text-teal-700 dark:text-teal-400",
  "text-amber-700 dark:text-amber-400",
  "text-indigo-600 dark:text-indigo-400",
  "text-rose-600 dark:text-rose-400",
  "text-emerald-700 dark:text-emerald-500",
  "text-violet-600 dark:text-violet-400",
  "text-orange-700 dark:text-orange-400",
  "text-cyan-700 dark:text-cyan-400",
] as const;

const PALETTE_FULL: PaletteEntry[] = [
  { text: PALETTE_TEXT[0], ring: "ring-teal-500/50", dot: "bg-teal-500", activeBg: "bg-teal-50 dark:bg-teal-900/20", accent: "#0d9488" },
  { text: PALETTE_TEXT[1], ring: "ring-amber-500/50", dot: "bg-amber-500", activeBg: "bg-amber-50 dark:bg-amber-900/20", accent: "#d97706" },
  { text: PALETTE_TEXT[2], ring: "ring-indigo-500/50", dot: "bg-indigo-500", activeBg: "bg-indigo-50 dark:bg-indigo-900/20", accent: "#4f46e5" },
  { text: PALETTE_TEXT[3], ring: "ring-rose-500/50", dot: "bg-rose-500", activeBg: "bg-rose-50 dark:bg-rose-900/20", accent: "#e11d48" },
  { text: PALETTE_TEXT[4], ring: "ring-emerald-500/50", dot: "bg-emerald-600", activeBg: "bg-emerald-50 dark:bg-emerald-900/20", accent: "#059669" },
  { text: PALETTE_TEXT[5], ring: "ring-violet-500/50", dot: "bg-violet-500", activeBg: "bg-violet-50 dark:bg-violet-900/20", accent: "#7c3aed" },
  { text: PALETTE_TEXT[6], ring: "ring-orange-500/50", dot: "bg-orange-500", activeBg: "bg-orange-50 dark:bg-orange-900/20", accent: "#ea580c" },
  { text: PALETTE_TEXT[7], ring: "ring-cyan-500/50", dot: "bg-cyan-500", activeBg: "bg-cyan-50 dark:bg-cyan-900/20", accent: "#0891b2" },
];

const GRAY_PALETTE: PaletteEntry = {
  text: "text-slate-500 dark:text-slate-400",
  ring: "ring-slate-400/40",
  dot: "bg-slate-400",
  activeBg: "bg-slate-100 dark:bg-slate-800/40",
  accent: "#94a3b8",
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function calcFontSize(count: number, maxCount: number): number {
  if (maxCount <= 1) return 1.2;
  const ratio = Math.log(count + 1) / Math.log(maxCount + 1);
  return 0.85 + ratio * 1.75;
}

function triggerHaptic(ms = 8) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(ms);
  }
}

// ─── WordItem ─────────────────────────────────────────────────────────────────

const WordItem = memo(function WordItem({
  data,
  onClick,
  localIdx,
  selectedItemId,
}: {
  data: WordDisplayData;
  onClick: (item: ImageryItem, clickX: number) => void;
  localIdx: number;
  selectedItemId: number | null;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback(() => {
    const rect = btnRef.current?.getBoundingClientRect();
    const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    onClick(data.item, cx);
  }, [onClick, data.item]);

  useEffect(() => {
    const el = btnRef.current;
    const obs = getAnimObserver();
    if (!el || !obs) return;
    obs.observe(el);
    return () => obs.unobserve(el);
  }, []);

  const unfurlDelay = `${Math.min(localIdx, 30) * 80}ms`;
  const isSelected = selectedItemId === data.item.id;
  const hasSelection = selectedItemId !== null;

  // Layered glow in the word's own accent color
  const glow = isSelected
    ? `0 0 10px ${data.paletteAccent}cc, 0 0 26px ${data.paletteAccent}66, 0 0 55px ${data.paletteAccent}22`
    : undefined;

  return (
    // ── Outer: controls opacity + scale — NEVER animated (so selection state works) ──
    <div
      className="relative"
      style={{
        opacity: hasSelection ? (isSelected ? 1 : 0.08) : 1,
        transform: isSelected ? "scale(1.1)" : "scale(1)",
        zIndex: isSelected ? 10 : undefined,
        transition: "opacity 0.8s ease, transform 0.8s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      {/* ── Inner: carries the one-shot unfurl animation (separate from selection state) ── */}
      <div
        className="relative group/word leading-none word-unfurl-anim"
        style={{ "--unfurl-delay": unfurlDelay } as React.CSSProperties}
      >
        <button
          ref={btnRef}
          onClick={handleClick}
          className={`font-serif leading-none transition-opacity duration-200 word-breathe-anim ${data.paletteText} ${isSelected ? "opacity-100" : "opacity-70 hover:opacity-100"}`}
          style={
            {
              fontSize: `${data.fontSize}rem`,
              "--word-breathe-duration": `${data.breatheDuration}s`,
              "--word-breathe-delay": `${data.breatheDelay}s`,
              animationPlayState: "paused",
              textShadow: glow,
              transition: "text-shadow 0.4s ease",
            } as React.CSSProperties
          }
        >
          {data.item.name}
        </button>
        {/* CSS-only tooltip — hidden while any word is selected */}
        {!hasSelection && (
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/60 shadow-md whitespace-nowrap opacity-0 group-hover/word:opacity-100 transition-opacity duration-150 z-20"
          >
            <p className="text-xs text-slate-600 dark:text-slate-300 tracking-wide">
              {data.tooltip}
            </p>
            <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-200/80 dark:border-t-slate-700/60" />
          </div>
        )}
      </div>
    </div>
  );
});


// ─── main component ───────────────────────────────────────────────────────────

export default function ImageryClient({ items, categories }: Props) {
  // ── category hierarchy ───────────────────────────────────────────────────
  const catMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const level1Categories = useMemo(
    () =>
      categories
        .filter((c) => c.level === 1)
        .sort((a, b) => a.name.localeCompare(b.name, "zh")),
    [categories],
  );

  const l1ColorIndex = useMemo(() => {
    const m = new Map<number, number>();
    level1Categories.forEach((cat, i) => m.set(cat.id, i % PALETTE_FULL.length));
    return m;
  }, [level1Categories]);

  const itemToL1 = useMemo(() => {
    const m = new Map<number, ImageryCategory | null>();
    for (const item of items) {
      let found: ImageryCategory | null = null;
      for (const catId of item.categoryIds) {
        const l3 = catMap.get(catId);
        if (!l3?.parent_id) continue;
        const l2 = catMap.get(l3.parent_id);
        if (!l2?.parent_id) continue;
        const l1 = catMap.get(l2.parent_id);
        if (l1) { found = l1; break; }
      }
      m.set(item.id, found);
    }
    return m;
  }, [items, catMap]);

  // ── state ────────────────────────────────────────────────────────────────
  const [activeL1Id, setActiveL1Id] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_BATCH);
  const [selectedItem, setSelectedItem] = useState<ImageryItem | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelSide, setPanelSide] = useState<"left" | "right">("right");
  const [songs, setSongs] = useState<SongResult[]>([]);
  const [songsLoading, setSongsLoading] = useState(false);

  const isDesktop = useIsDesktop();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const cloudRef = useRef<HTMLDivElement>(null);
  const visibleCountRef = useRef(INITIAL_BATCH);
  const [mounted, setMounted] = useState(false);

  // Trigger entrance animation after first paint
  useEffect(() => { setMounted(true); }, []);

  // Sync ref with state
  useEffect(() => { visibleCountRef.current = visibleCount; }, [visibleCount]);

  // Track nav height → CSS variable --nav-h for the panel to consume
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const update = () =>
      document.documentElement.style.setProperty(
        "--nav-h",
        `${nav.getBoundingClientRect().height}px`,
      );
    update();
    const ro = new ResizeObserver(update);
    ro.observe(nav);
    return () => ro.disconnect();
  }, []);

  // ── precomputed display data ──────────────────────────────────────────────
  const maxCount = useMemo(
    () => Math.max(...items.map((i) => i.count), 1),
    [items],
  );

  const wordDisplayList = useMemo(() => {
    const list =
      activeL1Id === null
        ? items
        : items.filter((item) => itemToL1.get(item.id)?.id === activeL1Id);
    return [...list]
      .sort((a, b) => b.count - a.count)
      .map((item, idx) => {
        const l1 = itemToL1.get(item.id) ?? null;
        const colorIdx = l1 ? (l1ColorIndex.get(l1.id) ?? 0) : -1;
        const paletteText =
          colorIdx >= 0 ? PALETTE_TEXT[colorIdx] : GRAY_PALETTE.text;
        const paletteAccent =
          colorIdx >= 0 ? PALETTE_FULL[colorIdx].accent : GRAY_PALETTE.accent;
        return {
          item,
          paletteText,
          paletteAccent,
          fontSize: calcFontSize(item.count, maxCount),
          breatheDuration: 3.5 + (idx % 7) * 0.6,
          breatheDelay: (idx % 13) * 0.35,
          tooltip: `${item.name} · ${item.count} 次${l1 ? ` · ${l1.name}` : ""}`,
        };
      });
  }, [items, activeL1Id, itemToL1, l1ColorIndex, maxCount]);

  const visibleWords = useMemo(
    () => wordDisplayList.slice(0, visibleCount),
    [wordDisplayList, visibleCount],
  );

  const hasMore = visibleCount < wordDisplayList.length;

  const marqueeWords = useMemo(
    () => [...items].sort((a, b) => b.count - a.count).slice(0, 30),
    [items],
  );

  // ── selected item helpers ─────────────────────────────────────────────────
  const selectedCategoryPath = useMemo(() => {
    if (!selectedItem) return [];
    const catId = selectedItem.categoryIds[0];
    if (!catId) return [];
    const l3 = catMap.get(catId);
    if (!l3) return [];
    const l2 = l3.parent_id ? catMap.get(l3.parent_id) : null;
    const l1 = l2?.parent_id ? catMap.get(l2.parent_id) : null;
    return [l1?.name, l2?.name, l3.name].filter(Boolean) as string[];
  }, [selectedItem, catMap]);

  const lyricistCounts = useMemo(() => {
    const counts = new Map<string, number>();
    songs.forEach(({ song }) =>
      (song.lyricist ?? []).forEach((l) =>
        counts.set(l, (counts.get(l) ?? 0) + 1),
      ),
    );
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [songs]);

  const selectedPalette = useMemo(() => {
    if (!selectedItem) return GRAY_PALETTE;
    const l1 = itemToL1.get(selectedItem.id);
    const colorIdx = l1 ? (l1ColorIndex.get(l1.id) ?? 0) : -1;
    return colorIdx >= 0 ? PALETTE_FULL[colorIdx] : GRAY_PALETTE;
  }, [selectedItem, itemToL1, l1ColorIndex]);

  // ── effects ──────────────────────────────────────────────────────────────

  // Reset visible count on filter change
  useEffect(() => {
    setVisibleCount(INITIAL_BATCH);
  }, [activeL1Id]);

  // Sentinel observer for lazy loading
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((prev) =>
            Math.min(prev + BATCH_SIZE, wordDisplayList.length),
          );
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [wordDisplayList.length]);

  // Fetch songs
  useEffect(() => {
    if (!selectedItem || !panelOpen) return;
    setSongsLoading(true);
    setSongs([]);
    fetch(`/api/imagery/${selectedItem.id}/songs`)
      .then((r) => r.json())
      .then((d) => setSongs(d.songs ?? []))
      .catch(() => setSongs([]))
      .finally(() => setSongsLoading(false));
  }, [selectedItem, panelOpen]);

  // ── handlers ─────────────────────────────────────────────────────────────
  const handleWordClick = useCallback((item: ImageryItem, clickX: number) => {
    triggerHaptic();
    // Panel opens from the side opposite the clicked word, so it won't cover it
    // Prefer right: only switch to left when word is in the rightmost quarter of the cloud area
    const cloudRect = cloudRef.current?.getBoundingClientRect();
    const cloudRight = cloudRect ? cloudRect.right : window.innerWidth;
    setPanelSide(clickX > cloudRight * 3 / 4 ? "left" : "right");
    setSelectedItem(item);
    setPanelOpen(true);
  }, []);

  const handleClose = useCallback(() => setPanelOpen(false), []);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-200">
      {/* ── nav ── */}
      <nav ref={navRef} className="sticky top-0 z-30 border-b border-slate-100/80 dark:border-slate-800/80 bg-[#FAFAFA]/90 dark:bg-[#0B0F19]/90 backdrop-blur-md px-6 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
        >
          <ArrowLeft size={15} />
          <span className="tracking-wider">返回</span>
        </Link>
        <ThemeToggle />
      </nav>

      {/* ── hero ── */}
      <header className="relative overflow-hidden pt-16 pb-12 px-6 text-center">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none select-none overflow-hidden flex flex-col justify-center gap-5 opacity-[0.045] dark:opacity-[0.055]"
        >
          {(
            [
              { duration: "42s", dir: "imagery-marquee-ltr", size: "text-4xl" },
              { duration: "60s", dir: "imagery-marquee-rtl", size: "text-3xl" },
              { duration: "78s", dir: "imagery-marquee-ltr", size: "text-2xl" },
            ] as const
          ).map(({ duration, dir, size }, ri) => (
            <div
              key={ri}
              className="flex whitespace-nowrap font-serif"
              style={{ animation: `${dir} ${duration} linear infinite` }}
            >
              {[...marqueeWords, ...marqueeWords].map((w, i) => (
                <span key={i} className={`${size} mx-5 text-slate-900 dark:text-white`}>
                  {w.name}
                </span>
              ))}
            </div>
          ))}
        </div>

        <div className="relative z-10">
          <h1
            className="font-serif text-7xl md:text-9xl font-normal text-slate-800 dark:text-slate-100 mb-6 flex justify-center items-center drop-shadow-[0_0_30px_rgba(255,255,255,0.05)]"
          >
            {"意象词云".split("").map((char, i) => (
              <span
                key={i}
                className={`hero-title-char inline-block tracking-[0.3em] pl-[0.3em] ${mounted ? "" : "opacity-0"}`}
                style={{ animationDelay: `${i * 300}ms` }}
              >
                {char}
              </span>
            ))}
          </h1>
          <p
            className={`text-sm text-slate-400 dark:text-slate-500 tracking-[0.25em] pl-[0.25em] mb-3 ${mounted ? "hero-unroll" : "opacity-0"}`}
            style={{ animationDelay: "1600ms" }}
          >
            河图作品中的意象索引
          </p>
          <p
            className={`text-xs text-slate-400 dark:text-slate-600 tracking-wide ${mounted ? "hero-unroll" : "opacity-0"}`}
            style={{ animationDelay: "1900ms" }}
          >
            共收录{" "}
            <span className="text-slate-600 dark:text-slate-400 font-medium tabular-nums">
              {items.length}
            </span>{" "}
            个意象
          </p>
        </div>
      </header>

      {/* ── category filter ── */}
      <div className="sticky top-[49px] z-20 bg-[#FAFAFA]/95 dark:bg-[#0B0F19]/95 backdrop-blur-md border-b border-slate-100/80 dark:border-slate-800/80">
        <div className="max-w-5xl mx-auto px-5 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 py-2.5 w-max">
            <button
              onClick={() => setActiveL1Id(null)}
              className={`px-3.5 py-1.5 text-sm rounded-full transition-all duration-200 tracking-wide ${activeL1Id === null
                  ? "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 font-medium shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                }`}
            >
              全部
            </button>
            {level1Categories.map((cat, i) => {
              const palette = PALETTE_FULL[i % PALETTE_FULL.length];
              const isActive = activeL1Id === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveL1Id(isActive ? null : cat.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 text-sm rounded-full transition-all duration-200 tracking-wide ring-inset ${isActive
                      ? `${palette.text} ${palette.activeBg} font-medium ring-1 ${palette.ring}`
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                    }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${isActive ? palette.dot : "bg-slate-300 dark:bg-slate-600"}`}
                  />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── word cloud ── */}
      <main
        className={`max-w-5xl mx-auto px-8 py-16 min-h-[40vh] ${mounted ? "" : "opacity-0"}`}
        style={mounted ? { animation: "main-fade-in 1s ease-out both", animationDelay: "200ms" } : undefined}
      >
        {wordDisplayList.length === 0 ? (
          <div className="text-center text-slate-400 dark:text-slate-600 text-sm py-24 tracking-[0.3em]">
            暂无数据
          </div>
        ) : (
          <>
            <div ref={cloudRef} key={activeL1Id ?? "all"} className="flex flex-wrap justify-center gap-x-10 gap-y-6">
              {visibleWords.map((data, idx) => {
                const localIdx = idx < INITIAL_BATCH ? idx : (idx - INITIAL_BATCH) % BATCH_SIZE;
                return (
                  <WordItem
                    key={data.item.id}
                    data={data}
                    onClick={handleWordClick}
                    localIdx={localIdx}
                    selectedItemId={panelOpen ? (selectedItem?.id ?? null) : null}
                  />
                );
              })}
            </div>

            {/* Sentinel + progress */}
            <div ref={sentinelRef} className="mt-12 flex justify-center">
              {hasMore ? (
                <p className="text-xs text-slate-300 dark:text-slate-700 tracking-[0.2em] tabular-nums select-none">
                  {visibleCount} / {wordDisplayList.length}
                </p>
              ) : (
                wordDisplayList.length > INITIAL_BATCH && (
                  <p className="text-xs text-slate-300 dark:text-slate-700 tracking-[0.2em] select-none">
                    共 {wordDisplayList.length} 个意象
                  </p>
                )
              )}
            </div>
          </>
        )}
      </main>

      {/* ── legend ── */}
      {level1Categories.length > 0 && (
        <div className="max-w-5xl mx-auto px-8 pb-20">
          <div className="border-t border-slate-100 dark:border-slate-800 pt-8">
            <p className="text-xs text-slate-400 dark:text-slate-600 tracking-[0.25em] mb-4">
              意象分类
            </p>
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              {level1Categories.map((cat, i) => {
                const palette = PALETTE_FULL[i % PALETTE_FULL.length];
                const isOther = activeL1Id !== null && activeL1Id !== cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() =>
                      setActiveL1Id(activeL1Id === cat.id ? null : cat.id)
                    }
                    className={`flex items-center gap-2 text-xs tracking-wide transition-opacity duration-200 ${isOther ? "opacity-25" : "opacity-100"}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${palette.dot}`} />
                    <span className={palette.text}>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Detail panel (desktop slide-in / mobile drawer) ── */}
      <ImageryDetailPanel
        open={panelOpen}
        panelSide={panelSide}
        selectedItem={selectedItem}
        selectedPalette={selectedPalette}
        selectedCategoryPath={selectedCategoryPath}
        songs={songs}
        songsLoading={songsLoading}
        lyricistCounts={lyricistCounts}
        onClose={handleClose}
      />
    </div>
  );
}
