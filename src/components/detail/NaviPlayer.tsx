"use client";

import React, { useEffect } from "react";
import {
  AlertCircle,
  ListPlus,
  Loader2,
  Music,
  Pause,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPlayerTime, usePlayer } from "@/context/PlayerContext";
import type { PlayerTrack } from "@/context/PlayerContext";

interface NaviPlayerProps {
  /** 本站歌曲 ID */
  songId: number;
  /** 歌曲标题 */
  title: string;
  /** 演唱者 */
  artist?: string | null;
  /** Navidrome 歌曲 ID，为 null 时不可播放 */
  songNavId: string | null;
  className?: string;
}

const NaviPlayer: React.FC<NaviPlayerProps> = ({
  songId,
  title,
  artist,
  songNavId,
  className,
}) => {
  const { state, controls } = usePlayer();
  const { currentTrack, isPlaying, isLoading, currentTime, duration, error } =
    state;

  // 判断当前播放器是否正在播放本曲目
  const isCurrentSong = currentTrack?.songId === songId;
  const isThisPlaying = isCurrentSong && isPlaying;
  const isThisLoading = isCurrentSong && isLoading;

  const track: PlayerTrack | null = songNavId
    ? { songId, title, artist, navId: songNavId }
    : null;

  const handleToggle = () => {
    if (!track) return;
    if (isCurrentSong) {
      controls.toggle();
    } else {
      controls.play(track);
    }
  };

  const handleEnqueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!track) return;
    controls.enqueue(track);
  };

  const displayTime = isCurrentSong ? currentTime : 0;
  const displayDuration = isCurrentSong ? duration : 0;
  const progressPercent =
    displayDuration > 0 ? (displayTime / displayDuration) * 100 : 0;

  const currentError = isCurrentSong ? error : null;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-white/70 dark:bg-slate-900/60",
        "backdrop-blur-xl",
        "border border-white/60 dark:border-slate-700/50",
        "shadow-xl shadow-slate-200/40 dark:shadow-black/40",
        "ring-1 ring-slate-900/5 dark:ring-white/5",
        className,
      )}
    >
      <div className="relative z-10 p-4">
        {/* 主行：图标 + 歌曲信息 + 操作按钮 */}
        <div className="flex items-center gap-3">
          {/* 音乐图标 */}
          <div
            className={cn(
              "shrink-0 w-9 h-9 rounded-xl flex items-center justify-center",
              "bg-slate-100 dark:bg-slate-800",
              isThisPlaying && "bg-blue-50 dark:bg-blue-500/10",
            )}
          >
            {isThisLoading ? (
              <Loader2 size={16} className="animate-spin text-blue-500" />
            ) : (
              <Music
                size={16}
                className={cn(
                  "text-slate-400",
                  isThisPlaying && "text-blue-500",
                )}
              />
            )}
          </div>

          {/* 歌曲信息 */}
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "text-sm font-bold truncate leading-tight",
                isCurrentSong
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-slate-900 dark:text-slate-50",
              )}
            >
              {title}
            </p>
            {artist && (
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {artist}
              </p>
            )}
            {currentError && (
              <div className="flex items-center gap-1 mt-0.5">
                <AlertCircle size={10} className="text-rose-500 shrink-0" />
                <p className="text-[10px] text-rose-500 truncate">
                  {currentError}
                </p>
              </div>
            )}
          </div>

          {/* 加入队列按钮 */}
          {track && !isCurrentSong && (
            <button
              onClick={handleEnqueue}
              aria-label="加入播放列表"
              title="加入播放列表"
              className={cn(
                "shrink-0 p-2 rounded-lg transition-colors",
                "text-slate-400 hover:text-blue-500",
                "hover:bg-blue-50 dark:hover:bg-blue-500/10",
              )}
            >
              <ListPlus size={16} />
            </button>
          )}

          {/* 播放/暂停按钮 */}
          <button
            onClick={handleToggle}
            disabled={isThisLoading || !songNavId}
            aria-label={isThisPlaying ? "暂停" : "播放"}
            className={cn(
              "shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
              "transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
              isThisLoading || !songNavId
                ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                : isThisPlaying
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-600 active:scale-95"
                  : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md hover:bg-slate-700 dark:hover:bg-slate-100 active:scale-95",
            )}
          >
            {isThisLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : isThisPlaying ? (
              <Pause size={16} className="fill-current" />
            ) : (
              <Play size={16} className="fill-current translate-x-0.5" />
            )}
          </button>
        </div>

        {/* 进度条（仅当前播放曲目显示） */}
        {isCurrentSong && (
          <div className="mt-3 space-y-1">
            {/* 简单进度条（不可拖拽，全局播放条才可拖拽） */}
            <div className="h-1 w-full rounded-full bg-slate-200 dark:bg-slate-700/50 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400 dark:text-slate-500 select-none">
              <span>{formatPlayerTime(displayTime)}</span>
              <span>{formatPlayerTime(displayDuration)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NaviPlayer;
