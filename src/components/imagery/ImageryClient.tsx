"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, ChevronRight } from "lucide-react";
import ThemeToggle from "@/components/shared/ThemeToggle";
import FloatingActionButtons from "@/components/shared/FloatingActionButtons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import type { ImageryCategory, ImageryItem } from "@/lib/types";
import { cn } from "@/lib/utils";

// ─── Island glow palette (RGB triplets matching palette indices 0–7) ──────────
const ISLAND_GLOW_RGB: (string | null)[] = [
  null,
  "99,102,241",
  "245,158,11",
  "16,185,129",
  "244,63,94",
  "14,165,233",
  "139,92,246",
  "20,184,166",
];

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

/** Deterministic breathing animation timing per word, creating a ripple effect. */
function getBreathTiming(index: number): { duration: number; delay: number } {
  return {
    duration: 3.6 + (index % 7) * 0.38,
    delay: (index * 0.41) % 4.5,
  };
}

// ─── Framer Motion variants ───────────────────────────────────────────────────
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

const staggerContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.01, delayChildren: 0.04 },
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface Props {
  items: ImageryItem[];
  categories: ImageryCategory[];
}

interface IslandData {
  l1: ImageryCategory;
  l1idx: number;
  paletteIdx: number;
  palette: (typeof COLOR_PALETTES)[number];
  glowRgb: string | null;
  clusters: { l2: ImageryCategory; words: ImageryItem[] }[];
  leftover: ImageryItem[];
  totalCount: number;
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

// ─── Archipelago left nav panel (desktop only) ────────────────────────────────
const ArchipelagoNav: React.FC<{
  categories: ImageryCategory[];
  topLevel: ImageryCategory[];
  navCountMap: Map<number, number>;
  totalCount: number;
  lockedCatId: number | null;
  onSpotlightEnter: (id: number) => void;
  onSpotlightLeave: () => void;
  onLockToggle: (id: number) => void;
  onReset: () => void;
}> = ({
  categories,
  topLevel,
  navCountMap,
  totalCount,
  lockedCatId,
  onSpotlightEnter,
  onSpotlightLeave,
  onLockToggle,
  onReset,
}) => {
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set());

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 w-52 z-30 pt-20 hidden lg:flex flex-col border-r border-slate-100/80 dark:border-slate-800/70 bg-[#FAFAFA]/95 dark:bg-[#0B0F19]/95 backdrop-blur-md"
      onMouseLeave={onSpotlightLeave}
    >
      <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-4">
        {/* Reset / "All" row */}
        <motion.button
          type="button"
          whileHover={{ x: 2 }}
          transition={{ duration: 0.12 }}
          onClick={() => {
            onReset();
            onSpotlightLeave();
          }}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-sans transition-colors duration-150 mb-1",
            lockedCatId === null
              ? "bg-slate-900/90 text-white dark:bg-slate-100/90 dark:text-slate-900"
              : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50",
          )}
        >
          <span className="w-2 h-2 rounded-full shrink-0 bg-slate-400 dark:bg-slate-500" />
          <span className="flex-1 text-left">全部意象</span>
          <span className="text-xs tabular-nums opacity-60">{totalCount}</span>
        </motion.button>

        <div className="h-px bg-slate-100 dark:bg-slate-800/60 my-2 mx-1" />

        {topLevel.map((l1, l1idx) => {
          const paletteIdx = (l1idx % (COLOR_PALETTES.length - 1)) + 1;
          const palette = COLOR_PALETTES[paletteIdx];
          const l2s = categories
            .filter((c) => c.parent_id === l1.id)
            .sort((a, b) => a.id - b.id);
          const isExpanded = expanded.has(l1.id);
          const isLocked = lockedCatId === l1.id;
          const count = navCountMap.get(l1.id) ?? 0;

          return (
            <div key={l1.id} className="mb-0.5">
              {/* L1 row */}
              <motion.div
                whileHover={{ x: 2 }}
                transition={{ duration: 0.12 }}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-colors duration-150",
                  isLocked
                    ? cn(palette.pillActive, "border-0 shadow-sm")
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/50",
                )}
                onMouseEnter={() => onSpotlightEnter(l1.id)}
                onClick={() => {
                  onLockToggle(l1.id);
                  if (l2s.length > 0) toggleExpand(l1.id);
                }}
              >
                <span className={cn("w-2 h-2 rounded-full shrink-0", palette.dot)} />
                <span className="flex-1 text-sm font-medium truncate">{l1.name}</span>
                <span className="text-xs tabular-nums opacity-50 mr-0.5">{count}</span>
                {l2s.length > 0 && (
                  <span className="opacity-40 shrink-0">
                    {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                  </span>
                )}
              </motion.div>

              {/* L2 rows */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="pl-5 pt-0.5 pb-1.5 space-y-0.5">
                      {l2s.map((l2) => {
                        const l2Locked = lockedCatId === l2.id;
                        const l2Count = navCountMap.get(l2.id) ?? 0;
                        return (
                          <motion.div
                            key={l2.id}
                            whileHover={{ x: 2 }}
                            transition={{ duration: 0.1 }}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer transition-colors duration-100",
                              l2Locked
                                ? cn(palette.pill, "!border-0")
                                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/40",
                            )}
                            onMouseEnter={() => onSpotlightEnter(l2.id)}
                            onClick={(e) => {
                              e.stopPropagation();
                              onLockToggle(l2.id);
                            }}
                          >
                            <span className="flex-1 text-xs truncate">{l2.name}</span>
                            <span className="text-xs tabular-nums opacity-40">{l2Count}</span>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="shrink-0 px-4 py-3.5 border-t border-slate-100 dark:border-slate-800/60">
        <p className="text-[10px] text-slate-300 dark:text-slate-600 leading-relaxed tracking-wide">
          悬浮高亮 · 点击锁定
        </p>
      </div>
    </aside>
  );
};

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
        {lyricist && lyricist.length > 0 ? `词：${lyricist.join("、")}` : (album ?? "")}
      </p>
    </div>
    <span className="shrink-0 text-xs tabular-nums text-slate-400 dark:text-slate-500">
      ×{occurrenceCount}
    </span>
  </Link>
);

// ─── Island section (one per L1 category) ─────────────────────────────────────
const IslandSection: React.FC<{
  island: IslandData;
  maxCount: number;
  effectiveSpotlight: number | null;
  categoryDescendants: Map<number, Set<number>>;
  selectedItemId: number | null;
  categories: ImageryCategory[];
  onWordClick: (item: ImageryItem) => void;
}> = ({
  island,
  maxCount,
  effectiveSpotlight,
  categoryDescendants,
  selectedItemId,
  categories,
  onWordClick,
}) => {
  const { l1, palette, glowRgb, clusters, leftover } = island;

  // Is at least one word in this island within the current spotlight?
  const anyHighlighted =
    !effectiveSpotlight ||
    [...clusters.flatMap((c) => c.words), ...leftover].some((item) =>
      item.categoryIds.some(
        (cid) => (categoryDescendants.get(effectiveSpotlight) ?? new Set()).has(cid),
      ),
    );

  const renderCluster = (label: string, words: ImageryItem[], keyPrefix: string) => {
    if (words.length === 0) return null;
    return (
      <div key={keyPrefix} className="mb-10 sm:mb-12 last:mb-0">
        <p className="text-[11px] font-sans text-slate-300 dark:text-slate-600 tracking-[0.16em] uppercase mb-4 px-1">
          {label}
        </p>
        <div className="flex flex-wrap gap-y-4 sm:gap-y-5">
          {words.map((item, index) => {
            const visual = getWordVisual(item.count, maxCount);
            const yOffset = getYOffset(index);
            const breath = getBreathTiming(index);
            const isSelected = selectedItemId === item.id;
            const highlighted =
              !effectiveSpotlight ||
              item.categoryIds.some(
                (cid) => (categoryDescendants.get(effectiveSpotlight) ?? new Set()).has(cid),
              );
            const wordPalette = getPaletteForCategory(item.categoryIds[0] ?? null, categories);

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
                <span
                  className={cn(
                    "word-breathe-anim inline-flex",
                    isSelected && "word-breathe-paused",
                  )}
                  style={
                    {
                      "--word-breathe-duration": `${breath.duration}s`,
                      "--word-breathe-delay": `${breath.delay}s`,
                      transition: "opacity 0.38s ease, filter 0.38s ease",
                      opacity: isSelected ? 1 : highlighted ? visual.opacityBase : 0.06,
                      filter: highlighted ? "none" : "blur(1.5px)",
                    } as React.CSSProperties
                  }
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => onWordClick(item)}
                        className={cn(
                          "relative font-serif leading-none select-none cursor-pointer",
                          "px-2 py-1.5 rounded-xl outline-none",
                          "transition-colors duration-200",
                          visual.sizeClass,
                          isSelected ? wordPalette.tagActive : wordPalette.tag,
                        )}
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
        </div>
      </div>
    );
  };

  return (
    <motion.section
      id={`island-${l1.id}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative py-16 sm:py-20"
      style={{
        transition: "opacity 0.4s ease",
        opacity: anyHighlighted ? 1 : 0.4,
      }}
    >
      {/* Per-island radial colour glow */}
      {glowRgb && (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 85% 65% at 50% 42%, rgba(${glowRgb},0.06) 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Large faint watermark character */}
      <div
        aria-hidden
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
      >
        <span
          className="font-bold font-serif leading-none whitespace-nowrap"
          style={{
            fontSize: "clamp(56px, 18vw, 220px)",
            color: glowRgb ? `rgba(${glowRgb},0.05)` : "rgba(150,150,150,0.04)",
            letterSpacing: "-0.05em",
          }}
        >
          {l1.name.slice(0, 2)}
        </span>
      </div>

      {/* Island header */}
      <div className="relative flex items-center gap-3 mb-12 sm:mb-16">
        <span className={cn("w-3 h-3 rounded-full shrink-0", palette.dot)} />
        <h2 className="text-lg sm:text-xl font-semibold font-serif text-slate-700 dark:text-slate-300 tracking-wide">
          {l1.name}
        </h2>
        <span className="text-xs text-slate-300 dark:text-slate-600 tabular-nums font-sans ml-1">
          {island.totalCount} 枚
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-slate-200/70 to-transparent dark:from-slate-700/50" />
      </div>

      {/* Word clusters (stagger on viewport entry) */}
      <TooltipProvider delayDuration={350} skipDelayDuration={150}>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
        >
          {clusters.map(({ l2, words }) => renderCluster(l2.name, words, `l2-${l2.id}`))}
          {leftover.length > 0 && renderCluster("其他", leftover, "leftover")}
        </motion.div>
      </TooltipProvider>
    </motion.section>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const ImageryClient: React.FC<Props> = ({ items, categories }) => {
  /** Transient spotlight (hover) — higher priority than locked */
  const [spotlightCatId, setSpotlightCatId] = useState<number | null>(null);
  /** Persistent spotlight (click-locked) */
  const [lockedCatId, setLockedCatId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<ImageryItem | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const effectiveSpotlight = spotlightCatId ?? lockedCatId;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 200);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const topLevelCategories = useMemo(
    () => categories.filter((c) => !c.parent_id).sort((a, b) => a.id - b.id),
    [categories],
  );

  const categoryDescendants = useMemo(() => {
    const map = new Map<number, Set<number>>();
    for (const cat of categories) {
      const desc = new Set<number>();
      const queue = [cat.id];
      while (queue.length) {
        const id = queue.shift()!;
        desc.add(id);
        categories.filter((c) => c.parent_id === id).forEach((c) => queue.push(c.id));
      }
      map.set(cat.id, desc);
    }
    return map;
  }, [categories]);

  const allSorted = useMemo(() => [...items].sort((a, b) => b.count - a.count), [items]);
  const maxCount = useMemo(() => Math.max(...items.map((i) => i.count), 0), [items]);

  // Ambient marquee: use the long tail (least frequent items)
  const backgroundWords = useMemo(() => allSorted.slice(60), [allSorted]);

  // Build archipelago islands: group all items by L1, then cluster by L2
  const islands = useMemo((): IslandData[] => {
    return topLevelCategories
      .map((l1, l1idx) => {
        const l1Desc = categoryDescendants.get(l1.id) ?? new Set<number>();
        const paletteIdx = (l1idx % (COLOR_PALETTES.length - 1)) + 1;
        const l2s = categories
          .filter((c) => c.parent_id === l1.id)
          .sort((a, b) => a.id - b.id);

        // Words whose primary category traces to this L1
        const l1Items = allSorted.filter((item) => {
          const pid = item.categoryIds[0];
          return pid !== undefined && l1Desc.has(pid);
        });

        // Group by L2 via primary category
        const assignedIds = new Set<number>();
        const clusters = l2s
          .map((l2) => {
            const l2Desc = categoryDescendants.get(l2.id) ?? new Set<number>();
            const words = l1Items.filter((item) => {
              const pid = item.categoryIds[0];
              return pid !== undefined && l2Desc.has(pid);
            });
            words.forEach((w) => assignedIds.add(w.id));
            return { l2, words };
          })
          .filter((c) => c.words.length > 0);

        const leftover = l1Items.filter((item) => !assignedIds.has(item.id));

        return {
          l1,
          l1idx,
          paletteIdx,
          palette: COLOR_PALETTES[paletteIdx],
          glowRgb: ISLAND_GLOW_RGB[paletteIdx],
          clusters,
          leftover,
          totalCount: l1Items.length,
        };
      })
      .filter((island) => island.totalCount > 0);
  }, [topLevelCategories, categories, categoryDescendants, allSorted]);

  // Count map for nav panel (every category → item count)
  const navCountMap = useMemo(() => {
    const map = new Map<number, number>();
    for (const cat of categories) {
      const desc = categoryDescendants.get(cat.id);
      if (!desc) continue;
      map.set(cat.id, items.filter((item) => item.categoryIds.some((cid) => desc.has(cid))).length);
    }
    return map;
  }, [categories, items, categoryDescendants]);

  const handleWordClick = useCallback(
    (item: ImageryItem) => setSelectedItem((prev) => (prev?.id === item.id ? null : item)),
    [],
  );
  const handleSpotlightEnter = useCallback((id: number) => setSpotlightCatId(id), []);
  const handleSpotlightLeave = useCallback(() => setSpotlightCatId(null), []);
  const handleLockToggle = useCallback(
    (id: number) => setLockedCatId((prev) => (prev === id ? null : id)),
    [],
  );
  const handleReset = useCallback(() => setLockedCatId(null), []);

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0F19] transition-colors duration-500">
      <BackgroundMarquee words={backgroundWords} />
      <NavBar />

      {/* ── Left nav panel (desktop) ── */}
      <ArchipelagoNav
        categories={categories}
        topLevel={topLevelCategories}
        navCountMap={navCountMap}
        totalCount={items.length}
        lockedCatId={lockedCatId}
        onSpotlightEnter={handleSpotlightEnter}
        onSpotlightLeave={handleSpotlightLeave}
        onLockToggle={handleLockToggle}
        onReset={handleReset}
      />

      {/* ── Main canvas ── */}
      <main className="relative z-10 lg:ml-52">
        <div className="max-w-5xl mx-auto px-4 md:px-8 pt-28 pb-32">
          {/* Hero */}
          <motion.section
            className="mb-12 mt-6 space-y-3"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-baseline gap-3">
              <h1 className="text-5xl md:text-6xl text-slate-900 dark:text-slate-50 italic font-serif">
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
          </motion.section>

          {/* Mobile spotlight pills (L1 only) */}
          <div className="lg:hidden sticky top-20 z-40 bg-[#FAFAFA]/95 dark:bg-[#0B0F19]/95 backdrop-blur-sm pt-3 pb-2 mb-10 -mx-4 px-4 border-b border-slate-100/80 dark:border-slate-800/80">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <motion.button
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.15 }}
                onClick={handleReset}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm border transition-colors duration-200 whitespace-nowrap shrink-0 font-sans",
                  lockedCatId === null
                    ? COLOR_PALETTES[0].pillActive
                    : COLOR_PALETTES[0].pill,
                )}
              >
                全部
              </motion.button>
              {topLevelCategories.map((cat, idx) => {
                const pal = COLOR_PALETTES[(idx % (COLOR_PALETTES.length - 1)) + 1];
                return (
                  <motion.button
                    type="button"
                    key={cat.id}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => {
                      handleLockToggle(cat.id);
                      document
                        .getElementById(`island-${cat.id}`)
                        ?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm border transition-colors duration-200 whitespace-nowrap shrink-0 font-sans",
                      lockedCatId === cat.id ? pal.pillActive : pal.pill,
                    )}
                  >
                    {cat.name}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Islands */}
          <div className="divide-y divide-slate-100/50 dark:divide-slate-800/40">
            {islands.map((island) => (
              <IslandSection
                key={island.l1.id}
                island={island}
                maxCount={maxCount}
                effectiveSpotlight={effectiveSpotlight}
                categoryDescendants={categoryDescendants}
                selectedItemId={selectedItem?.id ?? null}
                categories={categories}
                onWordClick={handleWordClick}
              />
            ))}
          </div>
        </div>
      </main>

      {/* ── Desktop: floating bottom-centre detail card ── */}
      <AnimatePresence>
        {selectedItem && !isMobile && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ backgroundColor: "rgba(0,0,0,0.06)" }}
              onClick={() => setSelectedItem(null)}
            />
            <motion.div
              key={selectedItem.id}
              className="fixed bottom-10 left-1/2 z-50 w-[460px] max-w-[92vw]"
              style={{ x: "-50%" }}
              initial={{ y: 28, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 16, opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.85 }}
            >
              <div className="rounded-2xl border border-slate-200/70 dark:border-slate-700/50 bg-white/92 dark:bg-slate-900/92 backdrop-blur-2xl shadow-2xl shadow-slate-300/30 dark:shadow-black/50 overflow-hidden">
                <div className="h-[3px] bg-gradient-to-r from-transparent via-slate-300/50 to-transparent dark:via-slate-600/50" />
                <div className="max-h-[58vh] overflow-y-auto no-scrollbar">
                  <DetailPanelInner
                    item={selectedItem}
                    categories={categories}
                    onClose={() => setSelectedItem(null)}
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Mobile: vaul drawer ── */}
      <Drawer
        open={!!selectedItem && isMobile}
        onOpenChange={(open) => {
          if (!open) setSelectedItem(null);
        }}
        onDrag={() => {
          if ("vibrate" in navigator) navigator.vibrate(4);
        }}
      >
        <DrawerContent>
          <div className="overflow-y-auto no-scrollbar pb-10 flex-1">
            {selectedItem && (
              <DetailPanelInner
                item={selectedItem}
                categories={categories}
                onClose={() => setSelectedItem(null)}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>

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
