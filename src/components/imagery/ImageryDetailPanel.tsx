"use client";

import React, { memo, useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Drawer, DrawerClose, DrawerContent } from "@/components/ui/drawer";
import type { ImageryItem, SongRef } from "@/lib/types";

// ─── shared types (re-exported for ImageryClient) ─────────────────────────────

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
  selectedItem: ImageryItem | null;
  selectedPalette: PaletteEntry;
  selectedCategoryPath: string[];
  songs: SongResult[];
  songsLoading: boolean;
  lyricistCounts: [string, number][];
  onClose: () => void;
}

// ─── section divider ──────────────────────────────────────────────────────────

function SectionLabel({ label, accent }: { label: string; accent: string }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
      <span
        className="text-[10px] tracking-[0.3em] font-medium shrink-0"
        style={{ color: accent }}
      >
        {label}
      </span>
      <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
    </div>
  );
}

// ─── shared body content ──────────────────────────────────────────────────────

function PanelBody({
  songs,
  songsLoading,
  lyricistCounts,
  selectedPalette,
  onLinkClick,
}: {
  songs: SongResult[];
  songsLoading: boolean;
  lyricistCounts: [string, number][];
  selectedPalette: PaletteEntry;
  onLinkClick: () => void;
}) {
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
      <p className="text-center text-sm text-slate-300 dark:text-slate-700 tracking-[0.25em] py-16">
        暂无相关词作
      </p>
    );
  }

  return (
    <>
      {lyricistCounts.length > 0 && (
        <>
          <SectionLabel label="词作者" accent={selectedPalette.accent} />
          <div className="flex flex-wrap gap-2 mb-1">
            {lyricistCounts.map(([name, count]) => (
              <span
                key={name}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/50"
              >
                {name}
                <span className="tabular-nums text-slate-400 dark:text-slate-500">
                  {count}
                </span>
              </span>
            ))}
          </div>
        </>
      )}

      <SectionLabel
        label={`相关词作 ${songs.length}`}
        accent={selectedPalette.accent}
      />
      <div className="space-y-0">
        {songs.map(({ song, occurrenceCount }) => (
          <Link
            key={song.id}
            href={`/song/${song.id}`}
            onClick={onLinkClick}
            className="flex items-center justify-between py-3.5 px-3 -mx-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors truncate tracking-wide">
                {song.title}
              </p>
              {(song.album || song.lyricist?.length) && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate tracking-wide">
                  {[song.album, song.lyricist?.join("、")]
                    .filter(Boolean)
                    .join("  ·  ")}
                </p>
              )}
            </div>
            {occurrenceCount > 1 && (
              <span className="ml-3 shrink-0 text-xs text-slate-300 dark:text-slate-700 tabular-nums">
                ×{occurrenceCount}
              </span>
            )}
          </Link>
        ))}
      </div>
    </>
  );
}

// ─── desktop panel ────────────────────────────────────────────────────────────

const DesktopPanel = memo(function DesktopPanel(props: DetailPanelProps) {
  const {
    open,
    selectedItem,
    selectedPalette,
    selectedCategoryPath,
    songs,
    songsLoading,
    lyricistCounts,
    onClose,
  } = props;

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30" onClick={onClose} />
      )}
      <aside
        className={`
          fixed right-0 top-[49px] z-40
          w-[min(440px,42vw)] h-[calc(100vh-49px)]
          flex flex-col
          bg-white dark:bg-[#0c0f1a]
          border-l border-slate-200/50 dark:border-slate-700/25
          shadow-[-32px_0_80px_rgba(0,0,0,0.06)] dark:shadow-[-32px_0_80px_rgba(0,0,0,0.45)]
          transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="relative shrink-0 px-9 pt-10 pb-7 overflow-hidden">
          {selectedItem && (
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
          )}

          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={16} />
          </button>

          {selectedItem && (
            <>
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
            </>
          )}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-9 pb-10">
          <PanelBody
            songs={songs}
            songsLoading={songsLoading}
            lyricistCounts={lyricistCounts}
            selectedPalette={selectedPalette}
            onLinkClick={onClose}
          />
        </div>
      </aside>
    </>
  );
});

// ─── mobile drawer ────────────────────────────────────────────────────────────

const MobileDrawer = memo(function MobileDrawer(props: DetailPanelProps) {
  const {
    open,
    selectedItem,
    selectedPalette,
    selectedCategoryPath,
    songs,
    songsLoading,
    lyricistCounts,
    onClose,
  } = props;

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        {selectedItem && (
          <span
            aria-hidden
            className="pointer-events-none select-none absolute bottom-0 right-2 font-serif leading-none"
            style={{
              fontSize: "9rem",
              opacity: 0.03,
              color: selectedPalette.accent,
            }}
          >
            {selectedItem.name[0]}
          </span>
        )}

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-3 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="min-w-0">
            {selectedItem && (
              <>
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
              </>
            )}
          </div>
          <DrawerClose asChild>
            <button className="p-2 ml-3 shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              <X size={18} />
            </button>
          </DrawerClose>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <PanelBody
            songs={songs}
            songsLoading={songsLoading}
            lyricistCounts={lyricistCounts}
            selectedPalette={selectedPalette}
            onLinkClick={onClose}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
});

// ─── unified export ───────────────────────────────────────────────────────────

export default function ImageryDetailPanel(props: DetailPanelProps) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (isDesktop) return <DesktopPanel {...props} />;
  return <MobileDrawer {...props} />;
}
