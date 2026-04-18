"use client";

import { useFavorites } from "@/context/FavoritesContext";
import type { Song } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/utils-common";
import { Calendar, Clock, Heart } from "lucide-react";
import type React from "react";
import CoverArt from "./CoverArt";
import MultiTagDisplay from "./MultiTagDisplay";

interface ListRowProps {
  song: Song;
  onClick: () => void;
  style?: React.CSSProperties;
  className?: string;
  isActive?: boolean;
  lyricsSnippet?: string;
}

export default function ListRow({
  song,
  onClick,
  style,
  className,
  isActive,
  lyricsSnippet,
}: ListRowProps) {
  const { isFavorite, toggleFavorite, isLoggedIn } = useFavorites();
  const active = isFavorite(song.id);

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative z-20 flex cursor-pointer items-center gap-6 rounded-xl p-4 transition-colors hover:z-30",
        isActive
          ? "bg-slate-100 dark:bg-slate-800/50"
          : "hover:bg-slate-100 dark:hover:bg-slate-800/50",
        className,
      )}
      style={style}
    >
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded shadow-sm">
        <CoverArt song={song} isActive={isActive} />
      </div>

      <div className="grow min-w-0 flex flex-col justify-center">
        <h2
          className={cn(
            "truncate text-lg text-slate-900 transition-colors dark:text-slate-100",
            isActive
              ? "text-blue-600 dark:text-blue-400"
              : "group-hover:text-blue-600 dark:group-hover:text-blue-400",
          )}
        >
          {song.title}
        </h2>
        <p className="truncate text-sm font-light text-slate-500 dark:text-slate-400">
          {song.lyricist?.join(" ") || "-"}{" "}
          <span className="mx-1 opacity-50">/</span>{" "}
          {song.composer?.join(" ") || "-"}
        </p>
        {lyricsSnippet && (
          <div className="mt-1 border-l-2 border-slate-200 pl-2 dark:border-slate-700">
            <p className="truncate text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
              {lyricsSnippet}
            </p>
          </div>
        )}
      </div>

      <div className="hidden shrink-0 items-center gap-8 text-sm text-slate-500 dark:text-slate-400 md:flex">
        {isLoggedIn && (
          <div className="flex w-8 items-center justify-center">
            <button
              onClick={(event) => {
                event.stopPropagation();
                toggleFavorite(song.id);
              }}
              aria-label={active ? "取消收藏" : "收藏"}
              title={active ? "取消收藏" : "收藏"}
              className={cn(
                "rounded-lg p-2 transition-all duration-200",
                active
                  ? "text-rose-500"
                  : "text-slate-400 opacity-100 hover:text-rose-400 dark:text-slate-500 lg:opacity-0 lg:group-hover:opacity-100",
              )}
            >
              <Heart size={16} className={active ? "fill-current" : ""} />
            </button>
          </div>
        )}
        <MultiTagDisplay tags={song.type} type="type" />
        <MultiTagDisplay tags={song.genre} type="genre" />
        <div className="flex w-16 items-center gap-2 font-mono text-xs opacity-70">
          <Calendar size={14} />
          {song.year || "-"}
        </div>
        <div className="flex w-16 items-center gap-2 font-mono text-xs opacity-70">
          <Clock size={14} />
          {formatTime(song.length)}
        </div>
      </div>

      {isLoggedIn && (
        <div className="ml-2 flex shrink-0 items-center md:hidden">
          <button
            onClick={(event) => {
              event.stopPropagation();
              toggleFavorite(song.id);
            }}
            aria-label={active ? "取消收藏" : "收藏"}
            title={active ? "取消收藏" : "收藏"}
            className={cn(
              "rounded-lg p-2 transition-all duration-200",
              active
                ? "text-rose-500"
                : "text-slate-400 opacity-100 hover:text-rose-400 dark:text-slate-500 lg:opacity-0 lg:group-hover:opacity-100",
            )}
          >
            <Heart size={16} className={active ? "fill-current" : ""} />
          </button>
        </div>
      )}
    </div>
  );
}
