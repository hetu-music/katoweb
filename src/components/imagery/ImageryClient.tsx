"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import ThemeToggle from "@/components/shared/ThemeToggle";
import FloatingActionButtons from "@/components/shared/FloatingActionButtons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ImageryCategory, ImageryItem } from "@/lib/types";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────
const FOREGROUND_COUNT = 65;

// ─── Category color palette ───────────────────────────────────────────────────
const COLOR_PALETTES = [
  // 0: slate (default / unset)
  {
    pill: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700",
    pillActive:
      "bg-slate-800 text-white border-slate-800 dark:bg-slate-200 dark:text-slate-900 dark:border-slate-200",
    tag: "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100",
    tagActive:
      "text-slate-900 dark:text-white ring-1 ring-slate-400/50 dark:ring-slate-500/50 bg-slate-50/70 dark:bg-slate-800/50",
    dot: "bg-slate-400 dark:bg-slate-500",
  },
  // 1: indigo
  {
    pill: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/30",
    pillActive:
      "bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-400 dark:text-indigo-950 dark:border-indigo-400",
    tag: "text-indigo-500/75 dark:text-indigo-400/75 hover:text-indigo-700 dark:hover:text-indigo-200",
    tagActive:
      "text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-400/50 dark:ring-indigo-500/50 bg-indigo-50/70 dark:bg-indigo-900/30",
    dot: "bg-indigo-400 dark:bg-indigo-500",
  },
  // 2: amber
  {
    pill: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30",
    pillActive:
      "bg-amber-500 text-white border-amber-500 dark:bg-amber-400 dark:text-amber-950 dark:border-amber-400",
    tag: "text-amber-600/75 dark:text-amber-400/75 hover:text-amber-700 dark:hover:text-amber-200",
    tagActive:
      "text-amber-700 dark:text-amber-300 ring-1 ring-amber-400/50 dark:ring-amber-500/50 bg-amber-50/70 dark:bg-amber-900/30",
    dot: "bg-amber-400 dark:bg-amber-500",
  },
  // 3: emerald
  {
    pill: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30",
    pillActive:
      "bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-400 dark:text-emerald-950 dark:border-emerald-400",
    tag: "text-emerald-600/75 dark:text-emerald-400/75 hover:text-emerald-700 dark:hover:text-emerald-200",
    tagActive:
      "text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-400/50 dark:ring-emerald-500/50 bg-emerald-50/70 dark:bg-emerald-900/30",
    dot: "bg-emerald-400 dark:bg-emerald-500",
  },
  // 4: rose
  {
    pill: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30",
    pillActive:
      "bg-rose-600 text-white border-rose-600 dark:bg-rose-400 dark:text-rose-950 dark:border-rose-400",
    tag: "text-rose-500/75 dark:text-rose-400/75 hover:text-rose-700 dark:hover:text-rose-200",
    tagActive:
      "text-rose-700 dark:text-rose-300 ring-1 ring-rose-400/50 dark:ring-rose-500/50 bg-rose-50/70 dark:bg-rose-900/30",
    dot: "bg-rose-400 dark:bg-rose-500",
  },
  // 5: sky
  {
    pill: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/30",
    pillActive:
      "bg-sky-600 text-white border-sky-600 dark:bg-sky-400 dark:text-sky-950 dark:border-sky-400",
    tag: "text-sky-500/75 dark:text-sky-400/75 hover:text-sky-700 dark:hover:text-sky-200",
    tagActive:
      "text-sky-700 dark:text-sky-300 ring-1 ring-sky-400/50 dark:ring-sky-500/50 bg-sky-50/70 dark:bg-sky-900/30",
    dot: "bg-sky-400 dark:bg-sky-500",
  },
  // 6: violet
  {
    pill: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/30",
    pillActive:
      "bg-violet-600 text-white border-violet-600 dark:bg-violet-400 dark:text-violet-950 dark:border-violet-400",
    tag: "text-violet-500/75 dark:text-violet-400/75 hover:text-violet-700 dark:hover:text-violet-200",
    tagActive:
      "text-violet-700 dark:text-violet-300 ring-1 ring-violet-400/50 dark:ring-violet-500/50 bg-violet-50/70 dark:bg-violet-900/30",
    dot: "bg-violet-400 dark:bg-violet-500",
  },
  // 7: teal
  {
    pill: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/30",
    pillActive:
      "bg-teal-600 text-white border-teal-600 dark:bg-teal-400 dark:text-teal-950 dark:border-teal-400",
    tag: "text-teal-500/75 dark:text-teal-400/75 hover:text-teal-700 dark:hover:text-teal-200",
    tagActive:
      "text-teal-700 dark:text-teal-300 ring-1 ring-teal-400/50 dark:ring-teal-500/50 bg-teal-50/70 dark:bg-teal-900/30",
    dot: "bg-teal-400 dark:bg-teal-500",
  },
];

function getPaletteForCategory(
  categoryId: number | null,
  categories: ImageryCategory[],
): (typeof COLOR_PALETTES)[number] {
  if (!categoryId) return COLOR_PALETTES[0];
  let current: ImageryCategory | undefined = categories.find((c) => c.id === categoryId);
  while (current?.parent_id) {
    const parentId = current.parent_id;
    current = categories.find((c) => c.id === parentId);
  }
  if (!current) return COLOR_PALETTES[0];
  const topLevel = categories
    .filter((c) => !c.parent_id)
    .sort((a, b) => a.id - b.id);
  const resolvedCurrent = current;
  const idx = topLevel.findIndex((c) => c.id === resolvedCurrent.id);
  return COLOR_PALETTES[(idx % (COLOR_PALETTES.length - 1)) + 1];
}

function buildCategoryPath(
  categoryId: number,
  categories: ImageryCategory[],
): {
  l1: ImageryCategory | null;
  l2: ImageryCategory | null;
  l3: ImageryCategory | null;
} {
  const l3 = categories.find((c) => c.id === categoryId) ?? null;
  const l2 = l3?.parent_id
    ? (categories.find((c) => c.id === l3.parent_id) ?? null)
    : null;
  const l1 = l2?.parent_id
    ? (categories.find((c) => c.id === l2.parent_id) ?? null)
    : null;
  return { l1, l2, l3 };
}

// ─── Word visual system ───────────────────────────────────────────────────────
interface WordVisual {
  sizeClass: string;
  tier: number;
  opacityBase: number;
  /** Extra horizontal margin (px) to create breathing room proportional to size */
  mx: number;
}

function getWordVisual(count: number, max: number): WordVisual {
  if (max === 0) return { sizeClass: "text-xs font-light tracking-widest", tier: 7, opacityBase: 0.35, mx: 2 };
  const r = count / max;
  if (r >= 0.65) return { sizeClass: "text-5xl sm:text-6xl font-bold tracking-tighter", tier: 1, opacityBase: 1.0, mx: 18 };
  if (r >= 0.40) return { sizeClass: "text-3xl sm:text-4xl font-semibold tracking-tight", tier: 2, opacityBase: 0.95, mx: 14 };
  if (r >= 0.22) return { sizeClass: "text-2xl sm:text-3xl font-medium", tier: 3, opacityBase: 0.86, mx: 10 };
  if (r >= 0.12) return { sizeClass: "text-xl sm:text-2xl font-normal tracking-wide", tier: 4, opacityBase: 0.75, mx: 7 };
  if (r >= 0.05) return { sizeClass: "text-base sm:text-lg font-light tracking-wide", tier: 5, opacityBase: 0.62, mx: 5 };
  if (r >= 0.02) return { sizeClass: "text-sm font-light tracking-wider", tier: 6, opacityBase: 0.47, mx: 3 };
  return { sizeClass: "text-xs font-light tracking-widest", tier: 7, opacityBase: 0.34, mx: 2 };
}

/** Deterministic vertical offset (px) for organic wave-like layout rhythm. */
function getYOffset(index: number): number {
  return Math.sin(index * 1.618 + index * 0.31) * 12;
}

/** Deterministic subtle rotation for organic feel. */
function getRotation(index: number): number {
  return Math.sin(index * 2.39 + 1.5) * 1.6;
}

/** Deterministic breathing animation timing per word, creating a ripple effect. */
function getBreathTiming(index: number): { duration: number; delay: number } {
  return {
    duration: 3.6 + (index % 7) * 0.38,
    delay: (index * 0.41) % 4.5,
  };
}

// ─── Framer Motion variants ───────────────────────────────────────────────────
const cloudContainerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.014,
      delayChildren: 0.06,
    },
  },
};

const cloudWordVariants = {
  hidden: {
    opacity: 0,
    y: 16,
    scale: 0.86,
    filter: "blur(4px)",
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface Props {
  items: ImageryItem[];
  categories: ImageryCategory[];
}

// ─── Background Marquee ───────────────────────────────────────────────────────
/**
 * Renders ambient background words as slowly-scrolling marquee bands.
 * Pure CSS animation — no JS overhead after mount.
 */
const BackgroundMarquee: React.FC<{ words: ImageryItem[] }> = ({ words }) => {
  if (words.length === 0) return null;

  const band1 = words.filter((_, i) => i % 3 === 0);
  const band2 = words.filter((_, i) => i % 3 === 1);
  const band3 = words.filter((_, i) => i % 3 === 2);

  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none"
      aria-hidden="true"
    >
      {/* Radial vignette — keeps center clear for the foreground cloud */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 45%, transparent 30%, var(--background) 100%)",
          opacity: 0.85,
        }}
      />

      {/* Band 1 — slow, left, 18% down */}
      {band1.length > 0 && (
        <div className="absolute w-full" style={{ top: "18%", opacity: 0.042 }}>
          <div
            className="inline-flex items-center gap-16 whitespace-nowrap"
            style={{
              animationName: "imagery-marquee-ltr",
              animationDuration: "105s",
              animationTimingFunction: "linear",
              animationIterationCount: "infinite",
            }}
          >
            {[...band1, ...band1].map((item, i) => (
              <span
                key={`b1-${item.id}-${i}`}
                className="font-serif text-2xl text-slate-900 dark:text-slate-100"
              >
                {item.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Band 2 — medium speed, right, 50%, larger text */}
      {band2.length > 0 && (
        <div className="absolute w-full" style={{ top: "50%", opacity: 0.030 }}>
          <div
            className="inline-flex items-center gap-20 whitespace-nowrap"
            style={{
              animationName: "imagery-marquee-rtl",
              animationDuration: "82s",
              animationTimingFunction: "linear",
              animationIterationCount: "infinite",
            }}
          >
            {[...band2, ...band2].map((item, i) => (
              <span
                key={`b2-${item.id}-${i}`}
                className="font-serif text-4xl text-slate-900 dark:text-slate-100"
              >
                {item.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Band 3 — slowest, left, 78% down */}
      {band3.length > 0 && (
        <div className="absolute w-full" style={{ top: "78%", opacity: 0.036 }}>
          <div
            className="inline-flex items-center gap-10 whitespace-nowrap"
            style={{
              animationName: "imagery-marquee-ltr",
              animationDuration: "138s",
              animationTimingFunction: "linear",
              animationIterationCount: "infinite",
            }}
          >
            {[...band3, ...band3].map((item, i) => (
              <span
                key={`b3-${item.id}-${i}`}
                className="font-serif text-xl text-slate-900 dark:text-slate-100"
              >
                {item.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── NavBar ───────────────────────────────────────────────────────────────────
const NavBar: React.FC = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FAFAFA]/80 dark:bg-[#0B0F19]/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50">
    <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
      <Link
        href="/"
        className="text-2xl font-bold tracking-tight flex items-center gap-1 transition-colors font-serif text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
      >
        河图
        <span className="w-[2px] h-5 bg-blue-600 mx-2 rounded-full translate-y-[1.5px]" />
        作品勘鉴
      </Link>
      <div className="flex items-center gap-2">
        <ThemeToggle />
      </div>
    </div>
  </nav>
);

// ─── Category filter pill ─────────────────────────────────────────────────────
const CategoryPill: React.FC<{
  label: string;
  active: boolean;
  count?: number;
  palette: (typeof COLOR_PALETTES)[number];
  onClick: () => void;
}> = ({ label, active, count, palette, onClick }) => (
  <motion.button
    type="button"
    onClick={onClick}
    whileHover={{ scale: 1.04 }}
    whileTap={{ scale: 0.95 }}
    transition={{ duration: 0.15, ease: "easeOut" }}
    className={cn(
      "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm border transition-colors duration-200 whitespace-nowrap shrink-0 font-sans",
      active ? palette.pillActive : palette.pill,
    )}
  >
    <span>{label}</span>
    {count !== undefined && (
      <span className={cn("text-xs tabular-nums", active ? "opacity-75" : "opacity-50")}>
        {count}
      </span>
    )}
  </motion.button>
);

// ─── Song chip inside the detail panel ───────────────────────────────────────
const SongChip: React.FC<{
  songId: number;
  title: string;
  album: string | null;
  lyricist: string[] | null;
  occurrenceCount: number;
}> = ({ songId, title, album, lyricist, occurrenceCount }) => (
  <Link
    href={`/song/${songId}`}
    className="group flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition-all duration-200"
  >
    <div className="min-w-0">
      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {title}
      </p>
      <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
        {lyricist && lyricist.length > 0
          ? `词：${lyricist.join("、")}`
          : (album ?? "")}
      </p>
    </div>
    <span className="shrink-0 text-xs tabular-nums text-slate-400 dark:text-slate-500">
      ×{occurrenceCount}
    </span>
  </Link>
);

// ─── Main component ───────────────────────────────────────────────────────────
const ImageryClient: React.FC<Props> = ({ items, categories }) => {
  const [activeL1Id, setActiveL1Id] = useState<number | null>(null);
  const [activeL2Id, setActiveL2Id] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<ImageryItem | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 200);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const topLevelCategories = useMemo(
    () => categories.filter((c) => !c.parent_id).sort((a, b) => a.id - b.id),
    [categories],
  );

  const l2Categories = useMemo(
    () =>
      activeL1Id
        ? categories
            .filter((c) => c.parent_id === activeL1Id)
            .sort((a, b) => a.id - b.id)
        : [],
    [categories, activeL1Id],
  );

  const categoryDescendants = useMemo(() => {
    const map = new Map<number, Set<number>>();
    for (const cat of categories) {
      const descendants = new Set<number>();
      const queue = [cat.id];
      while (queue.length) {
        const id = queue.shift();
        if (id === undefined) break;
        descendants.add(id);
        categories
          .filter((c) => c.parent_id === id)
          .forEach((c) => queue.push(c.id));
      }
      map.set(cat.id, descendants);
    }
    return map;
  }, [categories]);

  const filteredItems = useMemo(() => {
    const activeId = activeL2Id ?? activeL1Id;
    if (!activeId) return items;
    const descendants = categoryDescendants.get(activeId);
    if (!descendants) return items;
    return items.filter((item) =>
      item.categoryIds.some((cid) => descendants.has(cid)),
    );
  }, [items, activeL1Id, activeL2Id, categoryDescendants]);

  const sortedItems = useMemo(
    () =>
      [...filteredItems].sort(
        (a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh"),
      ),
    [filteredItems],
  );

  const maxCount = useMemo(
    () => Math.max(...items.map((i) => i.count), 0),
    [items],
  );

  const handleTagClick = useCallback((item: ImageryItem) => {
    setSelectedItem((prev) => (prev?.id === item.id ? null : item));
  }, []);

  const categoryCountMap = useMemo(() => {
    const map = new Map<number, number>();
    for (const cat of [...topLevelCategories, ...l2Categories]) {
      const descendants = categoryDescendants.get(cat.id);
      if (!descendants) continue;
      map.set(
        cat.id,
        items.filter((item) =>
          item.categoryIds.some((cid) => descendants.has(cid)),
        ).length,
      );
    }
    return map;
  }, [topLevelCategories, l2Categories, items, categoryDescendants]);

  const activeL1Palette = useMemo(() => {
    if (!activeL1Id) return COLOR_PALETTES[0];
    const idx = topLevelCategories.findIndex((c) => c.id === activeL1Id);
    return COLOR_PALETTES[(idx % (COLOR_PALETTES.length - 1)) + 1];
  }, [activeL1Id, topLevelCategories]);

  // Globally sorted by frequency descending
  const allSorted = useMemo(
    () => [...items].sort((a, b) => b.count - a.count),
    [items],
  );

  // Ambient background: the long tail beyond the foreground cap (static pool)
  const backgroundWords = useMemo(
    () => allSorted.slice(FOREGROUND_COUNT),
    [allSorted],
  );

  // Foreground: show all when a filter is active; top N otherwise
  const foregroundWords = useMemo(() => {
    if (activeL1Id !== null || activeL2Id !== null) return sortedItems;
    return sortedItems.slice(0, FOREGROUND_COUNT);
  }, [sortedItems, activeL1Id, activeL2Id]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0F19] transition-colors duration-500">
      {/* ── Ambient background layer (fixed, z-0) ── */}
      <BackgroundMarquee words={backgroundWords} />

      <NavBar />

      <main className="relative z-10 pt-28 pb-24 max-w-7xl mx-auto px-4 md:px-6">
        {/* ── Hero ── */}
        <motion.section
          className="mb-14 mt-6 space-y-3"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-baseline gap-3">
            <h1 className="text-5xl md:text-6xl text-slate-900 dark:text-slate-50 italic">
              意象
            </h1>
            <motion.span
              className="text-sm text-slate-400 dark:text-slate-500 tabular-nums font-sans font-light"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              共 {items.length} 枚
            </motion.span>
          </div>
          <p className="text-slate-400 dark:text-slate-500 font-light max-w-md text-sm leading-relaxed">
            山川日月，草木时令——词语在这里化为星点，各自成诗。
          </p>
          {backgroundWords.length > 0 && (
            <p className="text-xs text-slate-300 dark:text-slate-600 font-sans">
              另有 {backgroundWords.length} 个意象在背景中流动
            </p>
          )}
        </motion.section>

        {/* ── Category filter bar ── */}
        <section className="sticky top-20 z-40 bg-[#FAFAFA]/95 dark:bg-[#0B0F19]/95 backdrop-blur-sm pt-3 pb-2 mb-12 -mx-4 md:-mx-6 px-4 md:px-6 border-b border-slate-100/80 dark:border-slate-800/80">
          {/* L1 row */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
            <CategoryPill
              label="全部"
              active={activeL1Id === null}
              count={items.length}
              palette={COLOR_PALETTES[0]}
              onClick={() => {
                setActiveL1Id(null);
                setActiveL2Id(null);
                setSelectedItem(null);
              }}
            />
            {topLevelCategories.map((cat, idx) => {
              const palette = COLOR_PALETTES[(idx % (COLOR_PALETTES.length - 1)) + 1];
              return (
                <CategoryPill
                  key={cat.id}
                  label={cat.name}
                  active={activeL1Id === cat.id}
                  count={categoryCountMap.get(cat.id)}
                  palette={palette}
                  onClick={() => {
                    const next = activeL1Id === cat.id ? null : cat.id;
                    setActiveL1Id(next);
                    setActiveL2Id(null);
                    setSelectedItem(null);
                  }}
                />
              );
            })}
          </div>

          {/* L2 drill-down row — animates in/out */}
          <AnimatePresence>
            {activeL1Id && l2Categories.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 pt-1">
                  {l2Categories.map((cat) => (
                    <motion.button
                      type="button"
                      key={cat.id}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => {
                        setActiveL2Id(activeL2Id === cat.id ? null : cat.id);
                        setSelectedItem(null);
                      }}
                      className={cn(
                        "flex items-center gap-1 px-3 py-1 rounded-full text-xs border transition-colors duration-200 whitespace-nowrap shrink-0 font-sans",
                        activeL2Id === cat.id
                          ? activeL1Palette.pillActive
                          : activeL1Palette.pill,
                      )}
                    >
                      {cat.name}
                      <span className="tabular-nums opacity-55">
                        {categoryCountMap.get(cat.id)}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ── Main layout: cloud + detail ── */}
        <div className="flex flex-col lg:flex-row gap-12 lg:items-start">
          {/* ── Word cloud ── */}
          <section className="flex-1 min-w-0">
            {foregroundWords.length === 0 ? (
              <p className="text-slate-400 dark:text-slate-500 text-sm py-16 text-center">
                暂无数据
              </p>
            ) : (
              <TooltipProvider delayDuration={350} skipDelayDuration={150}>
                <motion.div
                  key={`cloud-${activeL1Id ?? "all"}-${activeL2Id ?? "all"}`}
                  variants={cloudContainerVariants}
                  initial="hidden"
                  animate="show"
                  className="flex flex-wrap justify-center gap-y-5 sm:gap-y-7 py-6"
                >
                  {foregroundWords.map((item, index) => {
                    const primaryCatId = item.categoryIds[0] ?? null;
                    const palette = getPaletteForCategory(primaryCatId, categories);
                    const visual = getWordVisual(item.count, maxCount);
                    const yOffset = getYOffset(index);
                    const rotation = getRotation(index);
                    const breath = getBreathTiming(index);
                    const isSelected = selectedItem?.id === item.id;

                    return (
                      <motion.div
                        key={item.id}
                        variants={cloudWordVariants}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.93 }}
                        style={{
                          marginTop: yOffset,
                          marginLeft: visual.mx,
                          marginRight: visual.mx,
                        }}
                      >
                        {/* Breathing wrapper — separate element so CSS transform doesn't fight framer-motion */}
                        <span
                          className={cn(
                            "word-breathe-anim inline-flex",
                            isSelected && "word-breathe-paused",
                          )}
                          style={
                            {
                              "--word-breathe-duration": `${breath.duration}s`,
                              "--word-breathe-delay": `${breath.delay}s`,
                              "--word-rotation": `${rotation}deg`,
                            } as React.CSSProperties
                          }
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => handleTagClick(item)}
                                className={cn(
                                  "relative font-serif leading-none select-none cursor-pointer",
                                  "px-2 py-1.5 rounded-xl outline-none",
                                  "transition-colors duration-200",
                                  visual.sizeClass,
                                  isSelected ? palette.tagActive : palette.tag,
                                )}
                                style={{ opacity: isSelected ? 1 : visual.opacityBase }}
                              >
                                {item.name}
                                {isSelected && (
                                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                                )}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <div className="flex items-center gap-1.5">
                                <span className="font-serif text-sm text-slate-800 dark:text-slate-200">
                                  {item.name}
                                </span>
                                <span className="text-slate-400 dark:text-slate-500 tabular-nums text-xs">
                                  · {item.count} 处
                                </span>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </span>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </TooltipProvider>
            )}
          </section>

          {/* ── Detail panel — desktop sticky sidebar ── */}
          <aside
            className={cn(
              "hidden lg:block lg:w-72 xl:w-80 shrink-0",
              "lg:sticky lg:top-32",
              "lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto no-scrollbar",
            )}
          >
            <AnimatePresence mode="wait">
              {selectedItem ? (
                <motion.div
                  key={selectedItem.id}
                  initial={{ opacity: 0, x: 14, scale: 0.97 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 14, scale: 0.97 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-2xl border border-slate-200/80 dark:border-slate-700/50 bg-white/75 dark:bg-slate-800/40 backdrop-blur-md overflow-hidden shadow-lg shadow-slate-200/40 dark:shadow-black/30"
                >
                  <DetailPanelInner
                    item={selectedItem}
                    categories={categories}
                    onClose={() => setSelectedItem(null)}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="panel-empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="flex flex-col items-center justify-center text-center py-20 px-6"
                >
                  <div className="w-16 h-16 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 flex items-center justify-center mb-4">
                    <span className="text-3xl font-serif text-slate-300 dark:text-slate-600">
                      詞
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 dark:text-slate-600 font-light tracking-wide">
                    点击意象，探索关联
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </aside>
        </div>
      </main>

      {/* ── Mobile bottom sheet backdrop ── */}
      <motion.div
        className={cn(
          "fixed inset-0 z-40 lg:hidden",
          selectedItem ? "pointer-events-auto" : "pointer-events-none",
        )}
        animate={{ opacity: selectedItem ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        style={{ backgroundColor: "rgba(0,0,0,0.28)", backdropFilter: "blur(2px)" }}
        onClick={() => setSelectedItem(null)}
      />

      {/* ── Mobile bottom sheet ── */}
      <motion.div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 lg:hidden",
          "rounded-t-2xl",
          "bg-[#FAFAFA]/95 dark:bg-[#111827]/95 backdrop-blur-xl",
          "border-t border-slate-200/70 dark:border-slate-700/50",
          "shadow-2xl shadow-black/20",
        )}
        initial={false}
        animate={{ y: selectedItem ? 0 : "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32, mass: 0.9 }}
      >
        {/* Drag handle */}
        <div className="flex w-full justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-full bg-slate-300/70 dark:bg-slate-600/70" />
        </div>
        <button
          type="button"
          className="sr-only"
          onClick={() => setSelectedItem(null)}
          aria-label="关闭"
        />
        <div className="max-h-[72vh] overflow-y-auto pb-10">
          {selectedItem && (
            <DetailPanelInner
              item={selectedItem}
              categories={categories}
              onClose={() => setSelectedItem(null)}
            />
          )}
        </div>
      </motion.div>

      <FloatingActionButtons
        showScrollTop={showScrollTop}
        onScrollToTop={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      />
    </div>
  );
};

// ─── Shared detail panel content ─────────────────────────────────────────────
const DetailPanelInner: React.FC<{
  item: ImageryItem;
  categories: ImageryCategory[];
  onClose: () => void;
}> = ({ item, categories, onClose }) => (
  <>
    {/* Header */}
    <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
      <div className="space-y-2 min-w-0">
        <h2 className="text-2xl font-bold font-serif text-slate-900 dark:text-white leading-tight">
          {item.name}
        </h2>
        <div className="flex flex-col gap-1.5 pt-0.5">
          {item.categoryIds.map((cid) => {
            const { l1, l2, l3 } = buildCategoryPath(cid, categories);
            if (!l3) return null;
            const pal = getPaletteForCategory(cid, categories);
            return (
              <div key={cid} className="flex items-center gap-1 flex-wrap">
                {l1 && (
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {l1.name}
                  </span>
                )}
                {l2 && (
                  <>
                    <span className="text-xs text-slate-300 dark:text-slate-600">›</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {l2.name}
                    </span>
                  </>
                )}
                <span className="text-xs text-slate-300 dark:text-slate-600">›</span>
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full border font-sans",
                    pal.pill,
                  )}
                >
                  {l3.name}
                </span>
              </div>
            );
          })}
          <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 tabular-nums mt-0.5">
            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 inline-block" />
            出现 {item.count} 处
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="mt-0.5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors shrink-0"
      >
        <X size={15} />
      </button>
    </div>

    <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-700/60 mx-5" />

    <div className="px-5 py-4">
      <ImageryDetailSongs key={item.id} imageryId={item.id} />
    </div>
  </>
);

// ─── Detail songs: client-side fetch ─────────────────────────────────────────
const ImageryDetailSongs: React.FC<{ imageryId: number }> = ({ imageryId }) => {
  const [songs, setSongs] = React.useState<
    Array<{
      song: { id: number; title: string; album: string | null; lyricist: string[] | null };
      occurrenceCount: number;
    }> | null
  >(null);
  const [loading, setLoading] = React.useState(true);
  const [activeLyricist, setActiveLyricist] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLoading(true);
    setActiveLyricist(null);
    fetch(`/api/imagery/${imageryId}/songs`)
      .then((r) => r.json())
      .then((data) => {
        setSongs(data.songs ?? []);
        setLoading(false);
      })
      .catch(() => {
        setSongs([]);
        setLoading(false);
      });
  }, [imageryId]);

  const allLyricists = React.useMemo(() => {
    if (!songs) return [];
    const seen = new Set<string>();
    for (const { song } of songs) {
      for (const l of song.lyricist ?? []) seen.add(l);
    }
    return [...seen].sort((a, b) => a.localeCompare(b, "zh"));
  }, [songs]);

  const displayedSongs = React.useMemo(() => {
    if (!activeLyricist || !songs) return songs;
    return songs.filter((s) => s.song.lyricist?.includes(activeLyricist));
  }, [songs, activeLyricist]);

  if (loading) {
    return (
      <div className="space-y-2.5 pt-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-12 rounded-xl bg-slate-100/80 dark:bg-slate-700/30 animate-pulse"
            style={{ animationDelay: `${i * 0.08}s` }}
          />
        ))}
      </div>
    );
  }

  if (!songs || songs.length === 0) {
    return (
      <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-6 font-light">
        暂无关联作品
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Lyricist chips — only show when multiple lyricists exist */}
      {allLyricists.length > 1 && (
        <div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-2 font-sans tracking-wide">
            词人
          </p>
          <div className="flex flex-wrap gap-1.5">
            {allLyricists.map((l) => (
              <motion.button
                type="button"
                key={l}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.12 }}
                onClick={() => setActiveLyricist(activeLyricist === l ? null : l)}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-full border transition-colors duration-150 font-sans",
                  activeLyricist === l
                    ? "bg-slate-800 text-white border-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100"
                    : "bg-white/60 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500",
                )}
              >
                {l}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* When only one lyricist, show them as a small label */}
      {allLyricists.length === 1 && (
        <p className="text-xs text-slate-400 dark:text-slate-500 font-sans">
          词：{allLyricists[0]}
        </p>
      )}

      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-700/60" />

      <p className="text-xs text-slate-400 dark:text-slate-500 font-sans tracking-wide">
        出现于以下作品
        {activeLyricist && (
          <span className="ml-1 text-slate-500 dark:text-slate-400">
            · {activeLyricist}
          </span>
        )}
      </p>

      <div className="space-y-2">
        {displayedSongs?.map(({ song, occurrenceCount }) => (
          <SongChip
            key={song.id}
            songId={song.id}
            title={song.title}
            album={song.album}
            lyricist={song.lyricist}
            occurrenceCount={occurrenceCount}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageryClient;
