"use client";

import About from "@/components/library/About";
import ThemeToggle from "@/components/shared/ThemeToggle";
import { useUserContext } from "@/context/UserContext";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import type { ImageryCategory, ImageryItem } from "@/lib/types";
import { Info, User } from "lucide-react";
import { useRouter } from "next/navigation";
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

const INITIAL_BATCH = 200;
const BATCH_SIZE = 150;

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
  {
    text: PALETTE_TEXT[0],
    ring: "ring-teal-500/50",
    dot: "bg-teal-500",
    activeBg: "bg-teal-50 dark:bg-teal-900/20",
    accent: "#0d9488",
  },
  {
    text: PALETTE_TEXT[1],
    ring: "ring-amber-500/50",
    dot: "bg-amber-500",
    activeBg: "bg-amber-50 dark:bg-amber-900/20",
    accent: "#d97706",
  },
  {
    text: PALETTE_TEXT[2],
    ring: "ring-indigo-500/50",
    dot: "bg-indigo-500",
    activeBg: "bg-indigo-50 dark:bg-indigo-900/20",
    accent: "#4f46e5",
  },
  {
    text: PALETTE_TEXT[3],
    ring: "ring-rose-500/50",
    dot: "bg-rose-500",
    activeBg: "bg-rose-50 dark:bg-rose-900/20",
    accent: "#e11d48",
  },
  {
    text: PALETTE_TEXT[4],
    ring: "ring-emerald-500/50",
    dot: "bg-emerald-600",
    activeBg: "bg-emerald-50 dark:bg-emerald-900/20",
    accent: "#059669",
  },
  {
    text: PALETTE_TEXT[5],
    ring: "ring-violet-500/50",
    dot: "bg-violet-500",
    activeBg: "bg-violet-50 dark:bg-violet-900/20",
    accent: "#7c3aed",
  },
  {
    text: PALETTE_TEXT[6],
    ring: "ring-orange-500/50",
    dot: "bg-orange-500",
    activeBg: "bg-orange-50 dark:bg-orange-900/20",
    accent: "#ea580c",
  },
  {
    text: PALETTE_TEXT[7],
    ring: "ring-cyan-500/50",
    dot: "bg-cyan-500",
    activeBg: "bg-cyan-50 dark:bg-cyan-900/20",
    accent: "#0891b2",
  },
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
  if (maxCount <= 1) return 1.0;
  const ratio = Math.log(count + 1) / Math.log(maxCount + 1);
  return 0.75 + ratio * 1.5;
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
  onHover,
}: {
  data: WordDisplayData;
  onClick: (item: ImageryItem, clickX: number) => void;
  localIdx: number;
  selectedItemId: number | null;
  onHover: (data: WordDisplayData | null, rect?: DOMRect) => void;
}) {
  const [hasEntered, setHasEntered] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback(() => {
    const rect = btnRef.current?.getBoundingClientRect();
    const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    onClick(data.item, cx);
  }, [onClick, data.item]);

  useEffect(() => {
    const el = btnRef.current;
    if (!el || typeof window === "undefined") return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasEntered(true);
          el.style.animationPlayState = "running";
        } else {
          el.style.animationPlayState = "paused";
        }
      },
      { rootMargin: "400px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const unfurlDelay = `${Math.min(localIdx, 100) * 40}ms`;
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
        zIndex: isSelected ? 30 : undefined, // 提高层级
        transition:
          "opacity 0.8s ease, transform 0.8s cubic-bezier(0.16,1,0.3,1)",
        // 选中时彻底取消可能导致切边的限制
        overflow: isSelected ? "visible" : undefined,
      }}
    >
      {/* ── Inner: carries the one-shot unfurl animation triggered on screen entry ── */}
      <div
        className={`relative group/word leading-none ${hasEntered ? "word-unfurl-anim" : "opacity-0"}`}
        style={
          {
            "--unfurl-delay": unfurlDelay,
            // 当被选中时，完全解除性能加速相关的限制，防止合成层切边
            contentVisibility: isSelected ? "visible" : undefined,
            contain: isSelected ? "none" : undefined,
            willChange: isSelected ? "auto" : "transform, opacity",
            overflow: isSelected ? "visible" : undefined,
          } as React.CSSProperties
        }
      >
        <button
          ref={btnRef}
          onClick={handleClick}
          onMouseEnter={() =>
            !hasSelection &&
            onHover(data, btnRef.current?.getBoundingClientRect())
          }
          onMouseLeave={() => onHover(null)}
          className={`font-serif leading-none transition-opacity duration-200 word-breathe-anim ${data.paletteText} ${isSelected ? "opacity-100" : "opacity-70 hover:opacity-100"}`}
          style={
            {
              fontSize: `${data.fontSize}rem`,
              "--word-breathe-duration": `${data.breatheDuration}s`,
              "--word-breathe-delay": `${data.breatheDelay}s`,
              animationPlayState: isSelected ? "running" : undefined, // 选中时强制运行
              willChange: isSelected ? "auto" : "transform",
              textShadow: glow,
              transition: "text-shadow 0.4s ease, opacity 0.4s ease",
              overflow: isSelected ? "visible" : undefined,
            } as React.CSSProperties
          }
        >
          {data.item.name}
        </button>
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
    level1Categories.forEach((cat, i) =>
      m.set(cat.id, i % PALETTE_FULL.length),
    );
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
        if (l1) {
          found = l1;
          break;
        }
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
  const [hoveredData, setHoveredData] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);
  const [showAbout, setShowAbout] = useState(false);

  const router = useRouter();
  const { user } = useUserContext();
  const isDesktop = useIsDesktop();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const cloudRef = useRef<HTMLDivElement>(null);
  const visibleCountRef = useRef(INITIAL_BATCH);
  const [mounted, setMounted] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);

  // Trigger entrance animation after first paint
  useEffect(() => {
    requestAnimationFrame(() => {
      setMounted(true);
    });
  }, []);

  // Track header visibility to pause infinite marquee animations
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        setHeaderVisible(entry.isIntersecting);
      },
      { threshold: 0.05 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Sync ref with state
  useEffect(() => {
    visibleCountRef.current = visibleCount;
  }, [visibleCount]);

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

  const marqueeRows = useMemo(() => {
    const sorted = [...items].sort((a, b) => b.count - a.count);
    return [sorted.slice(0, 30), sorted.slice(30, 60), sorted.slice(60, 90)];
  }, [items]);

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
    requestAnimationFrame(() => {
      setVisibleCount(INITIAL_BATCH);
    });
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
      { rootMargin: "1000px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [wordDisplayList.length]);

  // Fetch songs
  useEffect(() => {
    if (!selectedItem || !panelOpen) return;
    requestAnimationFrame(() => {
      setSongsLoading(true);
      setSongs([]);
    });

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
    setPanelSide(clickX > (cloudRight * 3) / 4 ? "left" : "right");
    setSelectedItem(item);
    setPanelOpen(true);
  }, []);

  const handleClose = useCallback(() => setPanelOpen(false), []);

  const handleWordHover = useCallback(
    (data: WordDisplayData | null, rect?: DOMRect) => {
      if (!data || !rect) {
        setHoveredData(null);
        return;
      }
      setHoveredData({
        text: data.tooltip,
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
    },
    [],
  );

  const handleTitleReset = useCallback(() => {
    window.location.href = "/";
  }, []);

  const openUserPanel = (tab: "account" | "favorites" = "favorites") => {
    if (!user) {
      const next = encodeURIComponent(
        window.location.pathname + window.location.search,
      );
      router.push(`/login?next=${next}`);
      return;
    }
    router.push(`/profile?tab=${tab}`);
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0F19] text-slate-800 dark:text-slate-200">
      {/* ── nav ── */}
      <nav
        ref={navRef}
        className="fixed top-0 left-0 right-0 z-50 bg-[#FAFAFA]/80 dark:bg-[#0B0F19]/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 transition-colors duration-500"
      >
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <button
            onClick={handleTitleReset}
            className="text-2xl font-bold tracking-tight flex items-center gap-1 cursor-pointer transition-colors font-serif text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
            title="返回首页"
          >
            河图
            <span className="w-[2px] h-5 bg-blue-600 mx-2 rounded-full translate-y-[1.5px]" />
            作品勘鉴
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAbout(true)}
              className="p-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
              title="关于"
            >
              <Info size={20} />
            </button>
            <button
              onClick={() => openUserPanel("favorites")}
              className="relative p-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
              title={user ? user.name : "登录"}
            >
              <User
                size={20}
                className={user ? "text-blue-500 dark:text-blue-400" : ""}
              />
            </button>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* ── hero ── */}
      <header
        ref={headerRef}
        className="relative overflow-hidden pt-32 pb-12 px-6 text-center"
      >
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none select-none overflow-hidden flex flex-col justify-center gap-5 opacity-[0.045] dark:opacity-[0.055]"
        >
          {(
            [
              {
                d: "42s",
                m: "10s",
                dir: "imagery-marquee-ltr",
                size: "text-2xl md:text-4xl",
              },
              {
                d: "60s",
                m: "15s",
                dir: "imagery-marquee-rtl",
                size: "text-xl md:text-3xl",
              },
              {
                d: "78s",
                m: "20s",
                dir: "imagery-marquee-ltr",
                size: "text-lg md:text-2xl",
              },
            ] as const
          ).map(({ d, m, dir, size }, ri) => {
            const rowWords = marqueeRows[ri % marqueeRows.length] || [];
            const duration = isDesktop ? d : m;
            return (
              <div
                key={ri}
                className="flex whitespace-nowrap font-serif will-change-transform"
                style={{
                  animation: `${dir} ${duration} linear infinite`,
                  animationPlayState: headerVisible ? "running" : "paused",
                }}
              >
                {[...rowWords, ...rowWords].map((w, i) => (
                  <span
                    key={i}
                    className={`${size} mx-5 text-slate-900 dark:text-white`}
                  >
                    {w.name}
                  </span>
                ))}
              </div>
            );
          })}
        </div>

        <div className="relative z-10">
          <h1 className="font-serif text-5xl sm:text-7xl md:text-9xl font-normal text-slate-800 dark:text-slate-100 mb-6 flex justify-center items-center gap-4 sm:gap-10 drop-shadow-[0_0_30px_rgba(255,255,255,0.05)]">
            {"意象词云".split("").map((char, i) => (
              <span
                key={i}
                className={`hero-title-char inline-block ${mounted ? "" : "opacity-0"}`}
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
      <div className="sticky top-(--nav-h,48px) z-20 bg-[#FAFAFA]/80 dark:bg-[#0B0F19]/80 backdrop-blur-md border-b border-slate-100/80 dark:border-slate-800/80 transition-all duration-300">
        <div className="max-w-5xl mx-auto px-5 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 py-4 w-max">
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
      <main
        className={`max-w-5xl mx-auto px-8 py-16 min-h-[40vh] ${mounted ? "" : "opacity-0"}`}
        style={
          mounted
            ? {
                animation: "main-fade-in 1s ease-out both",
                animationDelay: "200ms",
              }
            : undefined
        }
      >
        {wordDisplayList.length === 0 ? (
          <div className="text-center text-slate-400 dark:text-slate-600 text-sm py-24 tracking-[0.3em]">
            暂无数据
          </div>
        ) : (
          <>
            <div
              ref={cloudRef}
              key={activeL1Id ?? "all"}
              className="flex flex-wrap justify-center gap-x-10 gap-y-6"
            >
              {visibleWords.map((data, idx) => {
                return (
                  <WordItem
                    key={data.item.id}
                    data={data}
                    onClick={handleWordClick}
                    localIdx={idx}
                    selectedItemId={
                      panelOpen ? (selectedItem?.id ?? null) : null
                    }
                    onHover={handleWordHover}
                  />
                );
              })}
            </div>

            {/* Singleton Tooltip */}
            {hoveredData && (
              <div
                className="fixed z-100 pointer-events-none px-2.5 py-1.5 rounded-lg bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-700/60 shadow-lg whitespace-nowrap transition-opacity duration-150"
                style={{
                  left: hoveredData.x,
                  top: hoveredData.y - 10,
                  transform: "translate(-50%, -100%)",
                }}
              >
                <p className="text-xs text-slate-600 dark:text-slate-300 tracking-wide">
                  {hoveredData.text}
                </p>
                <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-200/80 dark:border-t-slate-700/60" />
              </div>
            )}

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

      {/* ── footer ── */}
      <footer className="max-w-5xl mx-auto px-8 pb-12">
        <div className="border-t border-slate-100 dark:border-slate-800 pt-8 text-center">
          <p className="text-xs text-slate-400 dark:text-slate-600 font-mono">
            &copy; {new Date().getFullYear()} 河图作品勘鉴
          </p>
        </div>
      </footer>

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

      {showAbout && <About onClose={() => setShowAbout(false)} />}
    </div>
  );
}
