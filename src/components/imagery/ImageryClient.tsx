"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Home, X } from "lucide-react";
import ThemeToggle from "@/components/shared/ThemeToggle";
import FloatingActionButtons from "@/components/shared/FloatingActionButtons";
import type { ImageryCategory, ImageryItem } from "@/lib/types";

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

// ─── Category color palette ──────────────────────────────────────────────────
// Assign a stable color index to each top-level category by its id modulo slots
const COLOR_PALETTES = [
  // slate (default / unset)
  {
    pill: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700",
    pillActive:
      "bg-slate-800 text-white border-slate-800 dark:bg-slate-200 dark:text-slate-900 dark:border-slate-200",
    tag: "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100",
    tagActive:
      "text-slate-900 dark:text-white ring-1 ring-slate-400 dark:ring-slate-500",
    dot: "bg-slate-400 dark:bg-slate-500",
  },
  // indigo
  {
    pill: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/30",
    pillActive:
      "bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-400 dark:text-indigo-950 dark:border-indigo-400",
    tag: "text-indigo-500/70 dark:text-indigo-400/70 hover:text-indigo-700 dark:hover:text-indigo-200",
    tagActive:
      "text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-400 dark:ring-indigo-500",
    dot: "bg-indigo-400 dark:bg-indigo-500",
  },
  // amber
  {
    pill: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30",
    pillActive:
      "bg-amber-500 text-white border-amber-500 dark:bg-amber-400 dark:text-amber-950 dark:border-amber-400",
    tag: "text-amber-500/70 dark:text-amber-400/70 hover:text-amber-700 dark:hover:text-amber-200",
    tagActive:
      "text-amber-700 dark:text-amber-300 ring-1 ring-amber-400 dark:ring-amber-500",
    dot: "bg-amber-400 dark:bg-amber-500",
  },
  // emerald
  {
    pill: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30",
    pillActive:
      "bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-400 dark:text-emerald-950 dark:border-emerald-400",
    tag: "text-emerald-500/70 dark:text-emerald-400/70 hover:text-emerald-700 dark:hover:text-emerald-200",
    tagActive:
      "text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-400 dark:ring-emerald-500",
    dot: "bg-emerald-400 dark:bg-emerald-500",
  },
  // rose
  {
    pill: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/30",
    pillActive:
      "bg-rose-600 text-white border-rose-600 dark:bg-rose-400 dark:text-rose-950 dark:border-rose-400",
    tag: "text-rose-500/70 dark:text-rose-400/70 hover:text-rose-700 dark:hover:text-rose-200",
    tagActive:
      "text-rose-700 dark:text-rose-300 ring-1 ring-rose-400 dark:ring-rose-500",
    dot: "bg-rose-400 dark:bg-rose-500",
  },
  // sky
  {
    pill: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/30",
    pillActive:
      "bg-sky-600 text-white border-sky-600 dark:bg-sky-400 dark:text-sky-950 dark:border-sky-400",
    tag: "text-sky-500/70 dark:text-sky-400/70 hover:text-sky-700 dark:hover:text-sky-200",
    tagActive:
      "text-sky-700 dark:text-sky-300 ring-1 ring-sky-400 dark:ring-sky-500",
    dot: "bg-sky-400 dark:bg-sky-500",
  },
  // violet
  {
    pill: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/30",
    pillActive:
      "bg-violet-600 text-white border-violet-600 dark:bg-violet-400 dark:text-violet-950 dark:border-violet-400",
    tag: "text-violet-500/70 dark:text-violet-400/70 hover:text-violet-700 dark:hover:text-violet-200",
    tagActive:
      "text-violet-700 dark:text-violet-300 ring-1 ring-violet-400 dark:ring-violet-500",
    dot: "bg-violet-400 dark:bg-violet-500",
  },
  // teal
  {
    pill: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/30",
    pillActive:
      "bg-teal-600 text-white border-teal-600 dark:bg-teal-400 dark:text-teal-950 dark:border-teal-400",
    tag: "text-teal-500/70 dark:text-teal-400/70 hover:text-teal-700 dark:hover:text-teal-200",
    tagActive:
      "text-teal-700 dark:text-teal-300 ring-1 ring-teal-400 dark:ring-teal-500",
    dot: "bg-teal-400 dark:bg-teal-500",
  },
];

function getPaletteForCategory(
  categoryId: number | null,
  categories: ImageryCategory[],
): (typeof COLOR_PALETTES)[number] {
  if (!categoryId) return COLOR_PALETTES[0];
  // Walk up to top-level parent
  let current: ImageryCategory | undefined = categories.find((c) => c.id === categoryId);
  while (current?.parent_id) {
    const parentId = current.parent_id;
    current = categories.find((c) => c.id === parentId);
  }
  if (!current) return COLOR_PALETTES[0];
  // Stable index: use sorted top-level category index
  const topLevel = categories
    .filter((c) => !c.parent_id)
    .sort((a, b) => a.id - b.id);
  const resolvedCurrent = current;
  const idx = topLevel.findIndex((c) => c.id === resolvedCurrent.id);
  return COLOR_PALETTES[(idx % (COLOR_PALETTES.length - 1)) + 1];
}

// Build ancestor path for any category id: returns { l1, l2, l3 }
// Assumes level-3 IDs are passed (the ones stored on imagery_occurrences)
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


function getTagSizeClass(count: number, max: number): string {
  if (max === 0) return "text-sm";
  const ratio = count / max;
  if (ratio >= 0.7) return "text-2xl font-semibold tracking-tight";
  if (ratio >= 0.45) return "text-xl font-medium";
  if (ratio >= 0.25) return "text-lg";
  if (ratio >= 0.1) return "text-base";
  return "text-sm font-light";
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface Props {
  items: ImageryItem[];
  categories: ImageryCategory[];
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const NavBar: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const router = useRouter();
  const [isBackActive, setIsBackActive] = useState(false);
  const handleBack = () => {
    setIsBackActive(true);
    onBack();
  };
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FAFAFA]/80 dark:bg-[#0B0F19]/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 -ml-2">
            <button
              onClick={handleBack}
              className={cn(
                "p-2 rounded-full transition-colors text-slate-600 dark:text-slate-400 group",
                isBackActive
                  ? "bg-slate-200/50 dark:bg-slate-800"
                  : "hover:bg-slate-200/50 dark:hover:bg-slate-800",
              )}
              title="返回"
            >
              <ArrowLeft
                size={20}
                className={cn(
                  "transition-transform",
                  isBackActive
                    ? "-translate-x-0.5"
                    : "group-hover:-translate-x-0.5",
                )}
              />
            </button>
            <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-0.5" />
            <button
              onClick={() => router.push("/")}
              className="p-2 rounded-full transition-colors text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800 group"
              title="回到主页"
            >
              <Home
                size={20}
                className="transition-transform group-hover:scale-105 group-active:scale-95"
              />
            </button>
          </div>
          <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight hidden sm:block font-serif">
            意象
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
};

// A single imagery tag in the cloud
const ImageryTag: React.FC<{
  item: ImageryItem;
  isSelected: boolean;
  sizeClass: string;
  palette: (typeof COLOR_PALETTES)[number];
  onClick: () => void;
}> = ({ item, isSelected, sizeClass, palette, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "relative px-3 py-1.5 rounded-lg transition-all duration-200 font-serif leading-tight select-none",
      sizeClass,
      isSelected ? palette.tagActive : palette.tag,
      "hover:scale-105 active:scale-95",
    )}
    title={`${item.name}（${item.count} 处）`}
  >
    {item.name}
    {isSelected && (
      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-current opacity-60" />
    )}
  </button>
);

// Category filter pill
const CategoryPill: React.FC<{
  label: string;
  active: boolean;
  count?: number;
  palette: (typeof COLOR_PALETTES)[number];
  onClick: () => void;
}> = ({ label, active, count, palette, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm border transition-all duration-200 whitespace-nowrap shrink-0 font-sans",
      active ? palette.pillActive : palette.pill,
    )}
  >
    <span>{label}</span>
    {count !== undefined && (
      <span
        className={cn(
          "text-xs tabular-nums",
          active ? "opacity-80" : "opacity-60",
        )}
      >
        {count}
      </span>
    )}
  </button>
);

// Song chip inside the detail panel
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
  const router = useRouter();
  const [activeL1Id, setActiveL1Id] = useState<number | null>(null);
  const [activeL2Id, setActiveL2Id] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<ImageryItem | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 200);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleBack = useCallback(() => {
    const navDepthStr = sessionStorage.getItem("__katoweb_nav_depth");
    const navDepth = navDepthStr ? parseInt(navDepthStr, 10) : 0;
    if (navDepth > 0) {
      sessionStorage.setItem("__katoweb_nav_depth", String(navDepth - 1));
      router.back();
    } else {
      router.push("/");
    }
  }, [router]);

  // Level-1 categories (no parent)
  const topLevelCategories = useMemo(
    () => categories.filter((c) => !c.parent_id).sort((a, b) => a.id - b.id),
    [categories],
  );

  // Level-2 categories under the selected L1
  const l2Categories = useMemo(
    () =>
      activeL1Id
        ? categories
            .filter((c) => c.parent_id === activeL1Id)
            .sort((a, b) => a.id - b.id)
        : [],
    [categories, activeL1Id],
  );

  // Build a map: categoryId → all descendant categoryIds (including self)
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

  // Filter items: L2 wins over L1 if set
  const filteredItems = useMemo(() => {
    const activeId = activeL2Id ?? activeL1Id;
    if (!activeId) return items;
    const descendants = categoryDescendants.get(activeId);
    if (!descendants) return items;
    return items.filter((item) =>
      item.categoryIds.some((cid) => descendants.has(cid)),
    );
  }, [items, activeL1Id, activeL2Id, categoryDescendants]);

  // Sort: by count descending, then alphabetically
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

  const handleTagClick = useCallback(
    (item: ImageryItem) => {
      setSelectedItem((prev) => (prev?.id === item.id ? null : item));
    },
    [],
  );

  // Item counts per L1 and L2 category
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

  // Palette for active L1 (used to tint L2 pills consistently)
  const activeL1Palette = useMemo(() => {
    if (!activeL1Id) return COLOR_PALETTES[0];
    const idx = topLevelCategories.findIndex((c) => c.id === activeL1Id);
    return COLOR_PALETTES[(idx % (COLOR_PALETTES.length - 1)) + 1];
  }, [activeL1Id, topLevelCategories]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0F19] transition-colors duration-500">
      <NavBar onBack={handleBack} />

      <main className="pt-28 pb-24 max-w-7xl mx-auto px-6">
        {/* ── Hero ── */}
        <section className="mb-14 mt-6 space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-5xl md:text-6xl text-slate-900 dark:text-slate-50 italic">
            意象{" "}
            <span className="text-[0.6em] not-italic font-light text-slate-400 dark:text-slate-500 tabular-nums">
              {items.length}
            </span>
          </h1>
          <p className="text-slate-400 dark:text-slate-500 font-light max-w-md text-sm leading-relaxed">
            山川日月，草木时令——词语在这里化为星点，各自成诗。
          </p>
        </section>

        {/* ── Category filter bar ── */}
        <section className="sticky top-20 z-40 bg-[#FAFAFA]/95 dark:bg-[#0B0F19]/95 backdrop-blur-sm pt-3 pb-2 mb-10 -mx-6 px-6 border-b border-slate-100/80 dark:border-slate-800/80">
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
              const palette =
                COLOR_PALETTES[(idx % (COLOR_PALETTES.length - 1)) + 1];
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

          {/* L2 drill-down row — slides in when an L1 is active */}
          {activeL1Id && l2Categories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
              {l2Categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveL2Id(activeL2Id === cat.id ? null : cat.id);
                    setSelectedItem(null);
                  }}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1 rounded-full text-xs border transition-all duration-200 whitespace-nowrap shrink-0 font-sans",
                    activeL2Id === cat.id
                      ? activeL1Palette.pillActive
                      : activeL1Palette.pill,
                    "opacity-90",
                  )}
                >
                  {cat.name}
                  <span className="tabular-nums opacity-60">
                    {categoryCountMap.get(cat.id)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── Main layout: cloud + detail ── */}
        <div className="flex flex-col lg:flex-row gap-10 lg:items-start">
          {/* ── Tag cloud ── */}
          <section className="flex-1 animate-in fade-in duration-500">
            {sortedItems.length === 0 ? (
              <p className="text-slate-400 dark:text-slate-500 text-sm py-12 text-center">
                暂无数据
              </p>
            ) : (
              <div className="flex flex-wrap gap-x-3 gap-y-4 items-baseline">
                {sortedItems.map((item) => {
                  const primaryCatId = item.categoryIds[0] ?? null;
                  const palette = getPaletteForCategory(primaryCatId, categories);
                  const sizeClass = getTagSizeClass(item.count, maxCount);
                  return (
                    <ImageryTag
                      key={item.id}
                      item={item}
                      isSelected={selectedItem?.id === item.id}
                      sizeClass={sizeClass}
                      palette={palette}
                      onClick={() => handleTagClick(item)}
                    />
                  );
                })}
              </div>
            )}
          </section>

          {/* ── Detail panel — desktop only (sticky sidebar) ── */}
          <aside
            className={cn(
              "hidden lg:block lg:w-72 xl:w-80 shrink-0",
              "lg:sticky lg:top-32",
              "lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto no-scrollbar",
              "transition-all duration-300",
              selectedItem
                ? "opacity-100"
                : "opacity-0 pointer-events-none",
            )}
          >
            {selectedItem && (
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/30 backdrop-blur-sm overflow-hidden shadow-sm">
                <DetailPanelInner
                  item={selectedItem}
                  categories={categories}
                  onClose={() => setSelectedItem(null)}
                />
              </div>
            )}
            {!selectedItem && (
              <div className="flex flex-col items-center justify-center text-center py-16 px-6 text-slate-300 dark:text-slate-600">
                <div className="text-4xl mb-3 opacity-40 font-serif">詞</div>
                <p className="text-sm font-light">点击意象查看详情</p>
              </div>
            )}
          </aside>
        </div>
      </main>

      {/* ── Mobile bottom sheet ── */}
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 lg:hidden transition-opacity duration-300",
          selectedItem
            ? "opacity-100 pointer-events-auto bg-black/30 backdrop-blur-[2px]"
            : "opacity-0 pointer-events-none",
        )}
        onClick={() => setSelectedItem(null)}
      />
      {/* Sheet */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 lg:hidden",
          "rounded-t-2xl bg-[#FAFAFA] dark:bg-[#0B0F19]",
          "border-t border-slate-200/80 dark:border-slate-700/60",
          "shadow-2xl transition-transform duration-300 ease-out",
          selectedItem ? "translate-y-0" : "translate-y-full",
        )}
      >
        {/* Drag handle — tap to close */}
        <button
          className="flex w-full justify-center pt-3 pb-2"
          onClick={() => setSelectedItem(null)}
          aria-label="关闭"
        >
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
        </button>
        {/* Scrollable content */}
        <div className="max-h-[72vh] overflow-y-auto pb-8">
          {selectedItem && (
            <DetailPanelInner
              item={selectedItem}
              categories={categories}
              onClose={() => setSelectedItem(null)}
            />
          )}
        </div>
      </div>

      <FloatingActionButtons
        showScrollTop={showScrollTop}
        onScrollToTop={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      />
    </div>
  );
};

// ─── Shared detail panel content ─────────────────────────────────────────────
// Used by both the desktop sticky sidebar and the mobile bottom sheet
const DetailPanelInner: React.FC<{
  item: ImageryItem;
  categories: ImageryCategory[];
  onClose: () => void;
}> = ({ item, categories, onClose }) => (
  <>
    {/* Header */}
    <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
      <div className="space-y-1 min-w-0">
        <h2 className="text-2xl font-bold font-serif text-slate-900 dark:text-white">
          {item.name}
        </h2>
        {/* Full category paths: L1 › L2 › L3 */}
        <div className="flex flex-col gap-1 pt-0.5">
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
          <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums mt-0.5">
            出现 {item.count} 处
          </span>
        </div>
      </div>
      <button
        onClick={onClose}
        className="mt-0.5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
      >
        <X size={16} />
      </button>
    </div>

    <div className="h-px bg-slate-100 dark:bg-slate-700/60 mx-5" />

    {/* Songs with lyricist filter */}
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
      <div className="space-y-2 pt-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-12 rounded-xl bg-slate-100 dark:bg-slate-700/40 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!songs || songs.length === 0) {
    return (
      <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
        暂无关联作品
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Lyricist chips — only show when multiple lyricists exist */}
      {allLyricists.length > 1 && (
        <div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-2 font-sans">
            词人
          </p>
          <div className="flex flex-wrap gap-1.5">
            {allLyricists.map((l) => (
              <button
                key={l}
                onClick={() =>
                  setActiveLyricist(activeLyricist === l ? null : l)
                }
                className={cn(
                  "text-xs px-2.5 py-1 rounded-full border transition-all duration-150 font-sans",
                  activeLyricist === l
                    ? "bg-slate-800 text-white border-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100"
                    : "bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500",
                )}
              >
                {l}
              </button>
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

      <div className="h-px bg-slate-100 dark:bg-slate-700/60" />

      <p className="text-xs text-slate-400 dark:text-slate-500 font-sans">
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
