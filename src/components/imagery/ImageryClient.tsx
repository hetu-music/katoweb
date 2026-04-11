"use client";

import About from "@/components/library/About";
import ThemeToggle from "@/components/shared/ThemeToggle";
import { useUserContext } from "@/context/UserContext";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import type { ImageryCategory, ImageryItem } from "@/lib/types";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { Info, User } from "lucide-react";
import { useRouter } from "next/navigation";
import React, {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { PaletteEntry, SongResult } from "./ImageryDetailPanel";
import ImageryDetailPanel from "./ImageryDetailPanel";

// ─── constants ────────────────────────────────────────────────────────────────

const GAP_X_PX = 40; // gap-x-10 = 2.5rem = 40px
const GAP_Y_PX = 24; // gap-y-6 = 1.5rem = 24px
const MARQUEE_SAMPLE_SIZE = 90;

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
}

// ─── row-grouping helpers ─────────────────────────────────────────────────────

function estimateWordWidthPx(data: WordDisplayData): number {
  // Chinese chars are approximately 1em wide in serif fonts
  return Math.ceil(data.item.name.length * data.fontSize * 16);
}

function groupIntoRows(
  words: WordDisplayData[],
  containerWidth: number,
): WordDisplayData[][] {
  if (containerWidth <= 0 || words.length === 0) return [words];
  const rows: WordDisplayData[][] = [];
  let row: WordDisplayData[] = [];
  let rowW = 0;
  for (const word of words) {
    const w = estimateWordWidthPx(word);
    const needed = row.length === 0 ? w : w + GAP_X_PX;
    if (row.length > 0 && rowW + needed > containerWidth) {
      rows.push(row);
      row = [word];
      rowW = w;
    } else {
      row.push(word);
      rowW += needed;
    }
  }
  if (row.length > 0) rows.push(row);
  return rows;
}

function estimateRowHeightPx(row: WordDisplayData[]): number {
  if (!row?.length) return 80;
  const maxFontSize = Math.max(...row.map((w) => w.fontSize));
  return Math.ceil(maxFontSize * 16) + GAP_Y_PX;
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

function seededShuffle<T>(list: T[], seed: number): T[] {
  const result = [...list];
  let currentSeed = seed || 1;

  for (let i = result.length - 1; i > 0; i -= 1) {
    currentSeed = (currentSeed * 1664525 + 1013904223) % 4294967296;
    const nextIndex = currentSeed % (i + 1);
    [result[i], result[nextIndex]] = [result[nextIndex], result[i]];
  }

  return result;
}

// ─── WordItem ─────────────────────────────────────────────────────────────────

const WordItem = memo(function WordItem({
  data,
  rowWordIdx,
  selectedItemId,
}: {
  data: WordDisplayData;
  rowWordIdx: number;
  selectedItemId: number | null;
}) {
  // Stagger words within the same row for a cascade effect on each new batch
  const unfurlDelay = `${rowWordIdx * 80}ms`;
  const isSelected = selectedItemId === data.item.id;
  const hasSelection = selectedItemId !== null;

  const glow = isSelected
    ? `0 0 10px ${data.paletteAccent}cc, 0 0 26px ${data.paletteAccent}66, 0 0 55px ${data.paletteAccent}22`
    : undefined;

  return (
    <div
      className="relative"
      style={{
        opacity: hasSelection ? (isSelected ? 1 : 0.08) : 1,
        transform: isSelected ? "scale(1.1)" : "scale(1)",
        zIndex: isSelected ? 30 : undefined,
        transition:
          "opacity 0.8s ease, transform 0.8s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      <div
        className="relative group/word leading-none word-unfurl-anim"
        style={{ "--unfurl-delay": unfurlDelay } as React.CSSProperties}
      >
        <button
          data-item-id={data.item.id}
          className={`font-serif leading-none transition-opacity duration-200 word-breathe-anim ${isSelected ? "word-breathe-force-run" : ""} ${data.paletteText} ${isSelected ? "opacity-100" : "opacity-70 hover:opacity-100"}`}
          style={
            {
              fontSize: `${data.fontSize}rem`,
              "--word-breathe-duration": `${data.breatheDuration}s`,
              "--word-breathe-delay": `${data.breatheDelay}s`,
              textShadow: glow,
              transition: "text-shadow 0.4s ease, opacity 0.4s ease",
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

  const level1Categories = useMemo(() => {
    const customOrder = [
      "自然事物",
      "人文社会",
      "身体人物",
      "文学艺术",
      "抽象概念",
    ];
    return categories
      .filter((c) => c.level === 1)
      .sort((a, b) => {
        const idxA = customOrder.indexOf(a.name);
        const idxB = customOrder.indexOf(b.name);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.name.localeCompare(b.name, "zh");
      });
  }, [categories]);

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

  const itemToL2 = useMemo(() => {
    const m = new Map<number, ImageryCategory | null>();
    for (const item of items) {
      let found: ImageryCategory | null = null;
      for (const catId of item.categoryIds) {
        const l3 = catMap.get(catId);
        if (!l3?.parent_id) continue;
        const l2 = catMap.get(l3.parent_id);
        if (l2) {
          found = l2;
          break;
        }
      }
      m.set(item.id, found);
    }
    return m;
  }, [items, catMap]);

  // ── state ────────────────────────────────────────────────────────────────
  const [activeL1Id, setActiveL1Id] = useState<number | null>(null);
  // Deferred: filter button highlights immediately; cloud re-renders in background
  const deferredActiveL1Id = useDeferredValue(activeL1Id);
  const [activeL2Id, setActiveL2Id] = useState<number | null>(null);
  const deferredActiveL2Id = useDeferredValue(activeL2Id);

  // L2 sub-categories visible when a L1 is selected
  const level2Categories = useMemo(
    () =>
      activeL1Id === null
        ? []
        : categories
          .filter((c) => c.level === 2 && c.parent_id === activeL1Id)
          .sort((a, b) => a.name.localeCompare(b.name, "zh")),
    [categories, activeL1Id],
  );
  const [selectedItem, setSelectedItem] = useState<ImageryItem | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelSide, setPanelSide] = useState<"left" | "right">("right");
  const [songs, setSongs] = useState<SongResult[]>([]);
  const [songsLoading, setSongsLoading] = useState(false);
  const [hoveredData, setHoveredData] = useState<{
    itemId: number;
    count: number;
    accent: string;
    x: number;
    y: number;
  } | null>(null);
  const [showAbout, setShowAbout] = useState(false);

  const router = useRouter();
  const { user } = useUserContext();
  const isDesktop = useIsDesktop();
  const navRef = useRef<HTMLElement>(null);
  const cloudRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(960);
  const [scrollMargin, setScrollMargin] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [marqueeSeed, setMarqueeSeed] = useState(0);
  const songsCacheRef = useRef(new Map<number, SongResult[]>());
  const songsRequestCacheRef = useRef(new Map<number, Promise<SongResult[]>>());

  // Trigger entrance animation after first paint
  useEffect(() => {
    requestAnimationFrame(() => {
      setMounted(true);
      setMarqueeSeed(Math.floor(Math.random() * 2147483647));
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
    let list: ImageryItem[];
    if (deferredActiveL2Id !== null) {
      list = items.filter(
        (item) => itemToL2.get(item.id)?.id === deferredActiveL2Id,
      );
    } else if (deferredActiveL1Id !== null) {
      list = items.filter(
        (item) => itemToL1.get(item.id)?.id === deferredActiveL1Id,
      );
    } else {
      list = items;
    }
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
        };
      });
  }, [
    items,
    deferredActiveL1Id,
    deferredActiveL2Id,
    itemToL1,
    itemToL2,
    l1ColorIndex,
    maxCount,
  ]);

  const marqueeRows = useMemo(() => {
    const sampled = seededShuffle(items, marqueeSeed).slice(0, MARQUEE_SAMPLE_SIZE);
    return [sampled.slice(0, 30), sampled.slice(30, 60), sampled.slice(60, 90)];
  }, [items, marqueeSeed]);

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
    songs.forEach(({ song }) => {
      const lyricists = song.lyricist ?? [];
      if (lyricists.length === 0) {
        counts.set("未知", (counts.get("未知") ?? 0) + 1);
      } else {
        lyricists.forEach((l) => counts.set(l, (counts.get(l) ?? 0) + 1));
      }
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [songs]);

  const selectedPalette = useMemo(() => {
    if (!selectedItem) return GRAY_PALETTE;
    const l1 = itemToL1.get(selectedItem.id);
    const colorIdx = l1 ? (l1ColorIndex.get(l1.id) ?? 0) : -1;
    return colorIdx >= 0 ? PALETTE_FULL[colorIdx] : GRAY_PALETTE;
  }, [selectedItem, itemToL1, l1ColorIndex]);

  // ── effects ──────────────────────────────────────────────────────────────

  // Measure cloud container width for row grouping
  useEffect(() => {
    const el = cloudRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    setContainerWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  // Measure scroll margin (distance from doc top to cloud container top)
  useLayoutEffect(() => {
    const update = () => {
      if (cloudRef.current) {
        setScrollMargin(
          cloudRef.current.getBoundingClientRect().top + window.scrollY,
        );
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [wordDisplayList.length]);

  // Reset L2 when L1 changes
  useEffect(() => {
    setActiveL2Id(null);
  }, [activeL1Id]);

  // Fetch songs
  useEffect(() => {
    if (!selectedItem || !panelOpen) return;
    let active = true;
    const cachedSongs = songsCacheRef.current.get(selectedItem.id);
    if (cachedSongs) {
      if (active) {
        setSongs(cachedSongs);
        setSongsLoading(false);
      }
      return () => {
        active = false;
      };
    }

    setSongs([]);
    setSongsLoading(true);

    let request = songsRequestCacheRef.current.get(selectedItem.id);
    if (!request) {
      request = fetch(`/api/imagery/${selectedItem.id}/songs`)
        .then((response) => response.json())
        .then((data) => (data.songs ?? []) as SongResult[])
        .catch(() => [] as SongResult[])
        .then((result) => {
          songsCacheRef.current.set(selectedItem.id, result);
          songsRequestCacheRef.current.delete(selectedItem.id);
          return result;
        });
      songsRequestCacheRef.current.set(selectedItem.id, request);
    }

    void request
      .then((result) => {
        if (active) {
          setSongs(result);
        }
      })
      .finally(() => {
        if (active) {
          setSongsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedItem, panelOpen]);

  // ── virtualizer ──────────────────────────────────────────────────────────

  const wordRows = useMemo(
    () => groupIntoRows(wordDisplayList, containerWidth),
    [wordDisplayList, containerWidth],
  );

  const rowVirtualizer = useWindowVirtualizer({
    count: wordRows.length,
    estimateSize: useCallback(
      (i: number) => estimateRowHeightPx(wordRows[i] ?? []),
      [wordRows],
    ),
    overscan: 8,
    scrollMargin,
  });

  // ── handlers ─────────────────────────────────────────────────────────────

  // O(1) lookup: item id → WordDisplayData, rebuilt when filtered list changes
  const itemLookup = useMemo(() => {
    const map = new Map<number, WordDisplayData>();
    wordDisplayList.forEach((d) => map.set(d.item.id, d));
    return map;
  }, [wordDisplayList]);

  const handleCloudClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>(
        "button[data-item-id]",
      );
      if (!btn) return;
      const itemId = Number(btn.dataset.itemId);
      const d = itemLookup.get(itemId);
      if (!d) return;
      triggerHaptic();
      const rect = btn.getBoundingClientRect();
      const clickX = rect.left + rect.width / 2;
      const cloudRect = cloudRef.current?.getBoundingClientRect();
      const cloudRight = cloudRect ? cloudRect.right : window.innerWidth;
      setPanelSide(clickX > (cloudRight * 3) / 4 ? "left" : "right");
      setSelectedItem(d.item);
      setPanelOpen(true);
      // Dismiss tooltip immediately when panel opens
      hoveredBtnRef.current = null;
      setHoveredData(null);
    },
    [itemLookup],
  );

  // Keep a ref in sync with panelOpen so mouse handlers avoid stale closures
  const panelOpenRef = useRef(panelOpen);
  useEffect(() => {
    panelOpenRef.current = panelOpen;
  }, [panelOpen]);

  const hoveredBtnRef = useRef<number | null>(null);

  const handleCloudMouseOver = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (panelOpenRef.current) return;
      const btn = (e.target as HTMLElement).closest<HTMLElement>(
        "button[data-item-id]",
      );
      if (!btn) return;
      const itemId = Number(btn.dataset.itemId);
      if (hoveredBtnRef.current === itemId) return;
      // eslint-disable-next-line react-hooks/immutability
      hoveredBtnRef.current = itemId;
      const d = itemLookup.get(itemId);
      if (!d) return;
      const rect = btn.getBoundingClientRect();
      setHoveredData({
        itemId,
        count: d.item.count,
        accent: d.paletteAccent,
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
    },
    [itemLookup],
  );

  const handleCloudMouseLeave = useCallback(() => {
    // eslint-disable-next-line react-hooks/immutability
    hoveredBtnRef.current = null;
    setHoveredData(null);
  }, []);

  const handleClose = useCallback(() => setPanelOpen(false), []);

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
        <div className="relative z-10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-1/2 z-0 flex -translate-y-1/2 select-none flex-col justify-center gap-5 overflow-hidden opacity-[0.045] dark:opacity-[0.055]"
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
                    animationName: dir,
                    animationDuration: duration,
                    animationTimingFunction: "linear",
                    animationIterationCount: "infinite",
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

          <h1 className="font-serif text-5xl md:text-7xl font-normal text-slate-800 dark:text-slate-100 mb-4 flex justify-center items-center gap-4 sm:gap-10 drop-shadow-[0_0_30px_rgba(255,255,255,0.05)]">
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
            className={`font-serif text-base md:text-xl text-slate-500 dark:text-slate-400 tracking-[0.4em] pl-[0.4em] mb-3 ${mounted ? "hero-unroll" : "opacity-0"}`}
            style={{ animationDelay: "1600ms" }}
          >
            行过 {wordDisplayList.length} ，长歌踏雪去何方
          </p>
        </div>
      </header>

      {/* ── category filter ── */}
      <div className="sticky top-(--nav-h,48px) z-20 bg-[#FAFAFA]/40 dark:bg-[#0B0F19]/40 backdrop-blur-2xl border-b border-slate-200/10 dark:border-slate-800/20 transition-all duration-1000">
        <div className="max-w-5xl mx-auto px-6 py-2.5">
          {/* L1 filter row */}
          <div className="flex items-center gap-8 overflow-x-auto no-scrollbar py-1 mask-linear-fade-edges">
            {/* Start spacer for mask */}
            <div className="min-w-[8px]" />

            <button
              onClick={() => setActiveL1Id(null)}
              className={`group relative py-1.5 text-[14px] transition-all duration-700 font-serif tracking-[0.2em] whitespace-nowrap ${activeL1Id === null
                ? "text-slate-900 dark:text-white"
                : "text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:tracking-[0.25em]"
                }`}
            >
              全部
              <span
                className={`absolute bottom-0 left-0 h-px bg-slate-400/60 transition-all duration-1000 ease-out origin-left ${activeL1Id === null
                  ? "w-full scale-x-100 opacity-100"
                  : "w-full scale-x-0 opacity-0"
                  }`}
              />
            </button>

            {level1Categories.map((cat, i) => {
              const palette = PALETTE_FULL[i % PALETTE_FULL.length];
              const isActive = activeL1Id === cat.id;
              return (
                <div key={cat.id} className="flex items-center gap-8">
                  <div className="w-[0.5px] h-3 bg-slate-200/50 dark:bg-slate-800/30 rotate-12" />
                  <button
                    onClick={() => setActiveL1Id(isActive ? null : cat.id)}
                    className={`group relative py-1.5 text-[14px] transition-all duration-700 font-serif tracking-[0.2em] whitespace-nowrap ${isActive
                      ? "text-slate-900 dark:text-white"
                      : "text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:tracking-[0.25em]"
                      }`}
                  >
                    {cat.name}
                    <span
                      className="absolute bottom-0 left-0 h-[1.5px] transition-all duration-1000 ease-[cubic-bezier(0.19,1,0.22,1)] origin-left"
                      style={{
                        width: "100%",
                        transform: isActive ? "scale-x-100" : "scale-x-0",
                        opacity: isActive ? 0.8 : 0,
                        backgroundColor: palette.accent,
                        boxShadow: isActive
                          ? `0 1px 10px ${palette.accent}22`
                          : "none",
                      }}
                    />
                  </button>
                </div>
              );
            })}

            {/* End spacer for mask */}
            <div className="min-w-[8px]" />
          </div>

          {/* L2 sub-filter row — calligraphic list */}
          <div
            className={`grid transition-[grid-template-rows,opacity,margin] duration-1000 ease-[cubic-bezier(0.19,1,0.22,1)] ${level2Categories.length > 0 ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0 mt-0"}`}
          >
            <div className="overflow-hidden">
              <div className="grid grid-cols-3 sm:flex sm:items-center gap-y-4 gap-x-6 sm:gap-6 sm:flex-wrap pt-3 border-t border-slate-200/20 dark:border-slate-800/10">
                {/* On desktop, we keep the spacer; on mobile grid, we skip it or use it as a grid item if needed.
                    Actually, let's keep it and adjust the grid flow. */}
                <div className="hidden sm:block min-w-[8px]" />

                {level2Categories.map((cat) => {
                  const isActive = activeL2Id === cat.id;
                  const l1Idx =
                    activeL1Id !== null
                      ? (l1ColorIndex.get(activeL1Id) ?? 0)
                      : 0;
                  const palette = PALETTE_FULL[l1Idx % PALETTE_FULL.length];

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveL2Id(isActive ? null : cat.id)}
                      className={`group relative text-[12px] transition-all duration-700 font-serif tracking-widest whitespace-nowrap py-1 ${isActive
                        ? "text-slate-700 dark:text-slate-300"
                        : "text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 hover:tracking-[0.15em]"
                        }`}
                    >
                      <span
                        className={`inline-block transition-all duration-700 font-system ${isActive ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"} mr-1.5`}
                        style={{ color: palette.accent }}
                      >
                        「
                      </span>
                      {cat.name}
                      <span
                        className={`inline-block transition-all duration-700 font-system ${isActive ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"} ml-1.5`}
                        style={{ color: palette.accent }}
                      >
                        」
                      </span>
                      {/* Subtle hover indicator for L2 */}
                      <span
                        className={`absolute -bottom-1 left-0 w-full h-[0.5px] bg-slate-300 dark:bg-slate-700 scale-x-0 transition-transform duration-500 group-hover:scale-x-100`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
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
            {/* Virtual word cloud: position:relative container whose height equals all rows */}
            <div
              ref={cloudRef}
              onClick={handleCloudClick}
              onMouseOver={handleCloudMouseOver}
              onMouseLeave={handleCloudMouseLeave}
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                position: "relative",
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = wordRows[virtualRow.index];
                if (!row) return null;
                return (
                  <div
                    key={virtualRow.key}
                    data-index={virtualRow.index}
                    ref={rowVirtualizer.measureElement}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      transform: `translateY(${virtualRow.start - rowVirtualizer.options.scrollMargin}px)`,
                    }}
                    className="flex justify-center items-center gap-x-10 pb-6"
                  >
                    {row.map((data, wordIdx) => (
                      <WordItem
                        key={data.item.id}
                        data={data}
                        rowWordIdx={wordIdx}
                        selectedItemId={
                          panelOpen ? (selectedItem?.id ?? null) : null
                        }
                      />
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Tooltip — count only, desktop only, tinted with the word's accent color */}
            {hoveredData && isDesktop && (
              <div
                key={hoveredData.itemId}
                className="fixed z-50 pointer-events-none"
                style={{
                  left: hoveredData.x,
                  top: hoveredData.y - 8,
                  transform: "translate(-50%, -100%)",
                }}
              >
                <div
                  className="px-2.5 py-1 rounded-full text-xs tracking-wider font-serif font-light whitespace-nowrap shadow-sm backdrop-blur-sm tooltip-appear"
                  style={{
                    backgroundColor: `${hoveredData.accent}22`,
                    color: hoveredData.accent,
                    border: `1px solid ${hoveredData.accent}44`,
                  }}
                >
                  {hoveredData.count} 次
                </div>
              </div>
            )}

            {/* Total count */}
            <div className="mt-12 flex justify-center">
              <p className="text-xs text-slate-300 dark:text-slate-700 tracking-[0.2em] select-none font-serif">
                共 {wordDisplayList.length} 个意象
              </p>
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
