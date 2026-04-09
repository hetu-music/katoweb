"use client";

import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  memo,
} from "react";
import Link from "next/link";
import { ArrowLeft, X } from "lucide-react";
import type { ImageryItem, ImageryCategory, SongRef } from "@/lib/types";
import { Drawer, DrawerClose, DrawerContent } from "@/components/ui/drawer";
import ThemeToggle from "@/components/shared/ThemeToggle";

// ─── types ────────────────────────────────────────────────────────────────────

interface Props {
  items: ImageryItem[];
  categories: ImageryCategory[];
}

interface SongResult {
  song: SongRef;
  categoryId: number;
  occurrenceCount: number;
}

interface WordDisplayData {
  item: ImageryItem;
  paletteText: string;
  fontSize: number;
  breatheDuration: number;
  breatheDelay: number;
  tooltip: string;
}

// ─── constants ────────────────────────────────────────────────────────────────

const INITIAL_BATCH = 150;
const BATCH_SIZE = 100;

// ─── shared animation IntersectionObserver ───────────────────────────────────
// One observer for all word buttons; pauses animation when off-screen.
// Lives outside React to avoid re-creation on render.

let animObserver: IntersectionObserver | null = null;

function getAnimObserver(): IntersectionObserver | null {
  if (typeof window === "undefined") return null;
  if (!animObserver) {
    animObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          (entry.target as HTMLElement).style.animationPlayState =
            entry.isIntersecting ? "running" : "paused";
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

const PALETTE_FULL = [
  { text: PALETTE_TEXT[0], ring: "ring-teal-500/50",    dot: "bg-teal-500",    activeBg: "bg-teal-50 dark:bg-teal-900/20"      },
  { text: PALETTE_TEXT[1], ring: "ring-amber-500/50",   dot: "bg-amber-500",   activeBg: "bg-amber-50 dark:bg-amber-900/20"    },
  { text: PALETTE_TEXT[2], ring: "ring-indigo-500/50",  dot: "bg-indigo-500",  activeBg: "bg-indigo-50 dark:bg-indigo-900/20"  },
  { text: PALETTE_TEXT[3], ring: "ring-rose-500/50",    dot: "bg-rose-500",    activeBg: "bg-rose-50 dark:bg-rose-900/20"      },
  { text: PALETTE_TEXT[4], ring: "ring-emerald-500/50", dot: "bg-emerald-600", activeBg: "bg-emerald-50 dark:bg-emerald-900/20"},
  { text: PALETTE_TEXT[5], ring: "ring-violet-500/50",  dot: "bg-violet-500",  activeBg: "bg-violet-50 dark:bg-violet-900/20"  },
  { text: PALETTE_TEXT[6], ring: "ring-orange-500/50",  dot: "bg-orange-500",  activeBg: "bg-orange-50 dark:bg-orange-900/20"  },
  { text: PALETTE_TEXT[7], ring: "ring-cyan-500/50",    dot: "bg-cyan-500",    activeBg: "bg-cyan-50 dark:bg-cyan-900/20"      },
] as const;

const GRAY_PALETTE = {
  text: "text-slate-500 dark:text-slate-400",
  ring: "ring-slate-400/40",
  dot: "bg-slate-400",
  activeBg: "bg-slate-100 dark:bg-slate-800/40",
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function calcFontSize(count: number, maxCount: number): number {
  if (maxCount <= 1) return 1.2;
  const ratio = Math.log(count + 1) / Math.log(maxCount + 1);
  return 0.85 + ratio * 1.75;
}

// ─── WordItem ─────────────────────────────────────────────────────────────────

const WordItem = memo(function WordItem({
  data,
  onClick,
}: {
  data: WordDisplayData;
  onClick: (item: ImageryItem) => void;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const handleClick = useCallback(() => onClick(data.item), [onClick, data.item]);

  // Register with shared observer; imperatively toggle animationPlayState
  useEffect(() => {
    const el = btnRef.current;
    const obs = getAnimObserver();
    if (!el || !obs) return;
    obs.observe(el);
    return () => obs.unobserve(el);
  }, []);

  return (
    <div className="relative group/word leading-none">
      <button
        ref={btnRef}
        onClick={handleClick}
        className={`font-serif leading-none opacity-70 hover:opacity-100 transition-opacity duration-200 word-breathe-anim ${data.paletteText}`}
        style={
          {
            fontSize: `${data.fontSize}rem`,
            "--word-breathe-duration": `${data.breatheDuration}s`,
            "--word-breathe-delay": `${data.breatheDelay}s`,
            // Start paused; observer will resume when in view
            animationPlayState: "paused",
          } as React.CSSProperties
        }
      >
        {data.item.name}
      </button>
      {/* CSS-only tooltip – zero JS overhead */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/60 shadow-md whitespace-nowrap opacity-0 group-hover/word:opacity-100 transition-opacity duration-150 z-20"
      >
        <p className="text-xs text-slate-600 dark:text-slate-300 tracking-wide">
          {data.tooltip}
        </p>
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-200/80 dark:border-t-slate-700/60" />
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

  // Precompute imagery id → level-1 category once
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [songs, setSongs] = useState<SongResult[]>([]);
  const [songsLoading, setSongsLoading] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);

  // ── precomputed display data ──────────────────────────────────────────────
  const maxCount = useMemo(
    () => Math.max(...items.map((i) => i.count), 1),
    [items],
  );

  // Full sorted+filtered list (not sliced)
  const wordDisplayList = useMemo((): WordDisplayData[] => {
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
        return {
          item,
          paletteText,
          fontSize: calcFontSize(item.count, maxCount),
          breatheDuration: 3.5 + (idx % 7) * 0.6,
          breatheDelay: (idx % 13) * 0.35,
          tooltip: `${item.name} · ${item.count} 次${l1 ? ` · ${l1.name}` : ""}`,
        };
      });
  }, [items, activeL1Id, itemToL1, l1ColorIndex, maxCount]);

  // Slice to currently visible batch
  const visibleWords = useMemo(
    () => wordDisplayList.slice(0, visibleCount),
    [wordDisplayList, visibleCount],
  );

  const hasMore = visibleCount < wordDisplayList.length;

  // Marquee words
  const marqueeWords = useMemo(
    () => [...items].sort((a, b) => b.count - a.count).slice(0, 30),
    [items],
  );

  // ── selected item derived data ────────────────────────────────────────────
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

  // Reset batch when filter changes
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

  // Fetch songs for selected item
  useEffect(() => {
    if (!selectedItem || !drawerOpen) return;
    setSongsLoading(true);
    setSongs([]);
    fetch(`/api/imagery/${selectedItem.id}/songs`)
      .then((r) => r.json())
      .then((d) => setSongs(d.songs ?? []))
      .catch(() => setSongs([]))
      .finally(() => setSongsLoading(false));
  }, [selectedItem, drawerOpen]);

  // ── handlers ─────────────────────────────────────────────────────────────
  const handleWordClick = useCallback((item: ImageryItem) => {
    setSelectedItem(item);
    setDrawerOpen(true);
  }, []);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-200">
      {/* ── nav ── */}
      <nav className="sticky top-0 z-30 border-b border-slate-100/80 dark:border-slate-800/80 bg-[#FAFAFA]/90 dark:bg-[#0B0F19]/90 backdrop-blur-md px-6 py-3 flex items-center justify-between">
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
        {/* Decorative marquees */}
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

        {/* Title */}
        <div className="relative z-10">
          <h1 className="font-serif text-7xl md:text-9xl font-normal tracking-[0.35em] text-slate-800 dark:text-slate-100 mb-5">
            意象
          </h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 tracking-[0.25em] mb-3">
            河图作品中的意象索引
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-600 tracking-wide">
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
              className={`px-3.5 py-1.5 text-sm rounded-full transition-all duration-200 tracking-wide ${
                activeL1Id === null
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
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 text-sm rounded-full transition-all duration-200 tracking-wide ring-inset ${
                    isActive
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
      <main className="max-w-5xl mx-auto px-8 py-16 min-h-[40vh]">
        {wordDisplayList.length === 0 ? (
          <div className="text-center text-slate-400 dark:text-slate-600 text-sm py-24 tracking-[0.3em]">
            暂无数据
          </div>
        ) : (
          <>
            <div className="flex flex-wrap justify-center gap-x-10 gap-y-6">
              {visibleWords.map((data) => (
                <WordItem key={data.item.id} data={data} onClick={handleWordClick} />
              ))}
            </div>

            {/* Sentinel + status */}
            <div ref={sentinelRef} className="mt-12 flex flex-col items-center gap-3">
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

      {/* ── detail drawer ── */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          {/* Drawer header */}
          <div className="flex items-start justify-between px-6 pt-3 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="min-w-0">
              {selectedItem && (
                <>
                  <h2
                    className={`font-serif text-3xl font-normal tracking-[0.25em] ${selectedPalette.text} mb-1`}
                  >
                    {selectedItem.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400 dark:text-slate-500 tracking-wide">
                    <span>
                      出现{" "}
                      <span className="font-medium text-slate-600 dark:text-slate-300 tabular-nums">
                        {selectedItem.count}
                      </span>{" "}
                      次
                    </span>
                    {selectedCategoryPath.length > 0 && (
                      <>
                        <span className="text-slate-200 dark:text-slate-700">·</span>
                        <span>{selectedCategoryPath.join(" › ")}</span>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
            <DrawerClose asChild>
              <button className="p-2 ml-3 shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={18} />
              </button>
            </DrawerClose>
          </div>

          {/* Drawer body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {songsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-slate-400 border-r-transparent" />
              </div>
            ) : songs.length === 0 ? (
              <p className="text-center text-sm text-slate-400 dark:text-slate-600 tracking-[0.2em] py-12">
                暂无相关词作
              </p>
            ) : (
              <>
                {/* Lyricist badges */}
                {lyricistCounts.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs text-slate-400 dark:text-slate-500 tracking-[0.2em] mb-3">
                      词作者
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {lyricistCounts.map(([name, count]) => (
                        <span
                          key={name}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          {name}
                          <span className="text-slate-400 dark:text-slate-500 tabular-nums">
                            {count}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Song list */}
                <p className="text-xs text-slate-400 dark:text-slate-500 tracking-[0.2em] mb-3">
                  相关词作{" "}
                  <span className="text-slate-600 dark:text-slate-300 tabular-nums">
                    {songs.length}
                  </span>{" "}
                  首
                </p>
                <div className="space-y-0.5">
                  {songs.map(({ song, occurrenceCount }) => (
                    <Link
                      key={song.id}
                      href={`/song/${song.id}`}
                      onClick={() => setDrawerOpen(false)}
                      className="flex items-center justify-between py-3 px-3 -mx-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors truncate tracking-wide">
                          {song.title}
                        </p>
                        {(song.album || song.lyricist?.length) && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                            {[song.album, song.lyricist?.join("、")]
                              .filter(Boolean)
                              .join("  ·  ")}
                          </p>
                        )}
                      </div>
                      {occurrenceCount > 1 && (
                        <span className="ml-3 shrink-0 text-xs text-slate-400 dark:text-slate-600 tabular-nums">
                          ×{occurrenceCount}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
