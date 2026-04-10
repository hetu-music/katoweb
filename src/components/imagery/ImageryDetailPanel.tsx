"use client";

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import type { ImageryItem, SongRef } from "@/lib/types";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

// ─── shared types ─────────────────────────────────────────────────────────────

export interface PaletteEntry {
  text: string;
  ring: string;
  dot: string;
  activeBg: string;
  accent: string;
}

export interface SongResult {
  song: SongRef;
  categoryId: number;
  occurrenceCount: number;
}

export interface DetailPanelProps {
  open: boolean;
  panelSide?: "left" | "right";
  selectedItem: ImageryItem | null;
  selectedPalette: PaletteEntry;
  selectedCategoryPath: string[];
  songs: SongResult[];
  songsLoading: boolean;
  lyricistCounts: [string, number][];
  onClose: () => void;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function SectionLabel({ label, accent }: { label: string; accent: string }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
      <span
        className="text-[10px] tracking-[0.3em] pl-[0.3em] font-medium shrink-0"
        style={{ color: accent }}
      >
        {label}
      </span>
      <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
    </div>
  );
}

// ─── Panel body ───────────────────────────────────────────────────────────────

const PanelBody = memo(function PanelBody({
  songs,
  songsLoading,
  lyricistCounts,
  selectedPalette,
  activeLyricist,
  onLyricistClick,
  onLinkClick,
  isDesktop,
}: {
  songs: SongResult[];
  songsLoading: boolean;
  lyricistCounts: [string, number][];
  selectedPalette: PaletteEntry;
  activeLyricist: string | null;
  onLyricistClick: (name: string) => void;
  onLinkClick: () => void;
  isDesktop: boolean;
}) {
  const filtered = useMemo(
    () =>
      activeLyricist
        ? songs.filter(({ song }) =>
          activeLyricist === "未知"
            ? !song.lyricist || song.lyricist.length === 0
            : song.lyricist?.includes(activeLyricist),
        )
        : songs,
    [songs, activeLyricist],
  );

  if (songsLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div
          className="inline-block h-5 w-5 animate-spin rounded-full border-[1.5px] border-solid border-r-transparent"
          style={{ borderColor: `${selectedPalette.accent} transparent` }}
        />
      </div>
    );
  }

  if (songs.length === 0) {
    return (
      <p
        className={`text-center text-sm tracking-[0.25em] pl-[0.25em] py-16 ${isDesktop
            ? "text-slate-300 dark:text-slate-700"
            : "text-slate-400 dark:text-slate-600"
          }`}
      >
        暂无相关词作
      </p>
    );
  }

  return (
    <>
      {/* Lyricist filter badges */}
      {lyricistCounts.length > 0 && (
        <>
          <SectionLabel label="词作" accent={selectedPalette.accent} />
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-2">
            <button
              onClick={() => onLyricistClick("")}
              className={`group relative text-[13px] transition-all duration-500 font-serif tracking-widest whitespace-nowrap py-1 ${
                !activeLyricist
                  ? "text-slate-900 dark:text-white"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <span
                className={`inline-block transition-all duration-500 font-system ${
                  !activeLyricist ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
                } mr-1`}
                style={{ color: selectedPalette.accent }}
              >
                「
              </span>
              全部
              <span
                className={`inline-block transition-all duration-500 font-system ${
                  !activeLyricist ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
                } ml-1`}
                style={{ color: selectedPalette.accent }}
              >
                」
              </span>
            </button>

            {lyricistCounts.map(([name, count]) => {
              const isActive = activeLyricist === name;
              return (
                <button
                  key={name}
                  onClick={() => onLyricistClick(name)}
                  className={`group relative text-[13px] transition-all duration-500 font-serif tracking-widest whitespace-nowrap py-1 ${isActive
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                >
                  <span
                    className={`inline-block transition-all duration-500 font-system ${isActive ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
                      } mr-1`}
                    style={{ color: selectedPalette.accent }}
                  >
                    「
                  </span>
                  {name}
                  <span
                    className={`inline-block transition-all duration-500 font-system ${isActive ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
                      } ml-1`}
                    style={{ color: selectedPalette.accent }}
                  >
                    」
                  </span>
                  <span className="ml-1 text-[10px] tabular-nums opacity-40 font-sans tracking-normal group-hover:opacity-60 transition-opacity">
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Songs */}
      <SectionLabel
        label={
          activeLyricist
            ? `${activeLyricist}的曲目 ${filtered.length}`
            : `相关曲目 ${songs.length}`
        }
        accent={selectedPalette.accent}
      />
      <div className="flex flex-col -mx-6">
        {filtered.map(({ song }) => (
          <Link
            key={song.id}
            href={`/song/${song.id}`}
            onClick={onLinkClick}
            className="flex items-center justify-between py-4 px-6 border-b border-slate-100/80 dark:border-slate-800/50 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group"
          >
            <div className="min-w-0 pr-4">
              <div className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors truncate tracking-wide">
                {song.title}
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 truncate tracking-wide">
                {song.lyricist?.length ? song.lyricist.join("  ·  ") : "未知"}
              </div>
            </div>
            <ChevronRight
              size={14}
              className="text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-400 transition-all duration-300 transform group-hover:translate-x-0.5"
            />
          </Link>
        ))}
      </div>
    </>
  );
});

// ─── Panel header ──────────────────────────────────────────────────────────────

function PanelHeader({
  selectedItem,
  selectedPalette,
  selectedCategoryPath,
  isDesktop,
}: {
  selectedItem: ImageryItem | null;
  selectedPalette: PaletteEntry;
  selectedCategoryPath: string[];
  isDesktop: boolean;
}) {
  if (!selectedItem) return null;

  if (isDesktop) {
    return (
      <div className="relative shrink-0 px-12 pt-10 pb-7 overflow-hidden border-b border-slate-100/40 dark:border-slate-800/40">
        {/* Decorative background character */}
        <span
          aria-hidden
          className="pointer-events-none select-none absolute -bottom-6 -right-3 font-serif leading-none"
          style={{
            fontSize: "11rem",
            opacity: 0.035,
            color: selectedPalette.accent,
            letterSpacing: "-0.05em",
          }}
        >
          {selectedItem.name[0]}
        </span>

        <h2
          className={`font-serif text-[3.2rem] leading-none font-normal tracking-[0.2em] mb-4 ${selectedPalette.text}`}
        >
          {selectedItem.name}
        </h2>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-xs text-slate-500 dark:text-slate-400 tracking-widest">
            出现{" "}
            <span className="text-slate-700 dark:text-slate-200 font-semibold tabular-nums">
              {selectedItem.count}
            </span>{" "}
            次
          </span>
          {selectedCategoryPath.length > 0 && (
            <>
              <span className="text-slate-200 dark:text-slate-700">·</span>
              <span className="text-xs text-slate-400 dark:text-slate-500 tracking-wide">
                {selectedCategoryPath.join(" › ")}
              </span>
            </>
          )}
        </div>
        <div
          className="mt-5 h-[1.5px] w-12 rounded-full"
          style={{ backgroundColor: selectedPalette.accent, opacity: 0.6 }}
        />
      </div>
    );
  }

  // Mobile header (inside the sheet, below the drag handle)
  return (
    <div className="flex items-start justify-between px-8 pt-3 pb-4 border-b border-slate-100/40 dark:border-slate-800/40 shrink-0">
      <div className="min-w-0">
        <h2
          className={`font-serif text-3xl font-normal tracking-[0.2em] mb-1 ${selectedPalette.text}`}
        >
          {selectedItem.name}
        </h2>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400 dark:text-slate-500 tracking-wide">
          <span>
            出现{" "}
            <span className="font-semibold text-slate-600 dark:text-slate-300 tabular-nums">
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
      </div>
    </div>
  );
}

// ─── unified detail panel ─────────────────────────────────────────────────────

export default function ImageryDetailPanel(props: DetailPanelProps) {
  const {
    open,
    panelSide = "right",
    selectedItem,
    selectedPalette,
    selectedCategoryPath,
    songs,
    songsLoading,
    lyricistCounts,
    onClose,
  } = props;

  const isDesktop = useIsDesktop();
  const [activeLyricist, setActiveLyricist] = useState<string | null>(null);

  // Clear lyricist filter when selection changes
  useEffect(() => {
    requestAnimationFrame(() => {
      setActiveLyricist(null);
    });
  }, [selectedItem]);

  const handleLyricistClick = useCallback((name: string) => {
    setActiveLyricist((prev) => (name === "" || prev === name ? null : name));
  }, []);

  const sharedBodyProps = {
    songs,
    songsLoading,
    lyricistCounts,
    selectedPalette,
    activeLyricist,
    onLyricistClick: handleLyricistClick,
    onLinkClick: onClose,
    isDesktop,
  };

  if (!isDesktop) {
    return (
      <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
        <DrawerContent className="h-[50dvh]">
          {/* Accessible title/description (visually hidden) */}
          <DrawerTitle className="sr-only">
            {selectedItem?.name ?? "意象详情"}
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            {selectedItem
              ? `${selectedItem.name}在河图作品中出现${selectedItem.count}次`
              : "意象详情面板"}
          </DrawerDescription>

          <PanelHeader
            selectedItem={selectedItem}
            selectedPalette={selectedPalette}
            selectedCategoryPath={selectedCategoryPath}
            isDesktop={isDesktop}
          />

          <div className="flex-1 overflow-y-auto no-scrollbar px-8 py-4 pb-[env(safe-area-inset-bottom,1rem)]">
            <PanelBody {...sharedBodyProps} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()} modal={false}>
      <SheetContent
        side={panelSide}
        className={[
          "top-(--nav-h,48px) h-[calc(100vh-var(--nav-h,48px))] w-[min(440px,42vw)] p-0 border-none shadow-2xl transition-all duration-500",
          panelSide === "right"
            ? "border-l border-slate-200/50 dark:border-white/5"
            : "border-r border-slate-200/50 dark:border-white/5",
        ].join(" ")}
      >
        {/* Accessible title/description (visually hidden) */}
        <SheetTitle className="sr-only">
          {selectedItem?.name ?? "意象详情"}
        </SheetTitle>
        <SheetDescription className="sr-only">
          {selectedItem
            ? `${selectedItem.name}在河图作品中出现${selectedItem.count}次`
            : "意象详情面板"}
        </SheetDescription>

        <PanelHeader
          selectedItem={selectedItem}
          selectedPalette={selectedPalette}
          selectedCategoryPath={selectedCategoryPath}
          isDesktop={isDesktop}
        />

        <div
          className="flex-1 overflow-y-auto no-scrollbar px-12 pb-10"
        >
          <PanelBody {...sharedBodyProps} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
