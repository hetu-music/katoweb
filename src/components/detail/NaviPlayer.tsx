"use client";

import React from "react";
import {
  AlertCircle,
  ListPlus,
  Loader2,
  Music,
  Pause,
  Play,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlayer } from "@/context/PlayerContext";
import type { PlayerTrack } from "@/context/PlayerContext";

interface NaviPlayerProps {
  songId: number;
  title: string;
  artist?: string | null;
  coverUrl?: string | null;
  hasAudio?: boolean;
  className?: string;
}

const NaviPlayer: React.FC<NaviPlayerProps> = ({
  songId,
  title,
  artist,
  coverUrl,
  hasAudio = true,
  className,
}) => {
  const { state, controls } = usePlayer();
  const { currentTrack, isPlaying, isLoading, queue, error } = state;

  if (!hasAudio) return null;

  const isCurrentSong = currentTrack?.songId === songId;
  const isThisPlaying = isCurrentSong && isPlaying;
  const isThisLoading = isCurrentSong && isLoading;
  const isInQueue = queue.some((track) => track.songId === songId);

  const track: PlayerTrack = { songId, title, artist, coverUrl };

  const handleToggle = () => {
    if (isCurrentSong) {
      controls.toggle();
    } else {
      controls.play(track);
    }
  };

  const handleEnqueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    controls.enqueue(track);
  };

  const currentError = isCurrentSong ? error : null;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl transition-all duration-300",
        "bg-white/40 dark:bg-slate-900/30 backdrop-blur-md",
        "border border-slate-200/40 dark:border-slate-800/40",
        "shadow-xs select-none",
        className,
      )}
    >
      <div className="flex items-center justify-between p-3 gap-4">
        {/* 左侧：动态状态展示区 */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {currentError ? (
            <div className="flex items-center gap-2 text-rose-500 min-w-0">
              <AlertCircle size={14} className="shrink-0" />
              <p className="text-[11px] font-semibold truncate leading-none">
                {currentError}
              </p>
            </div>
          ) : isThisLoading ? (
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 min-w-0">
              <Loader2 size={14} className="animate-spin shrink-0 text-blue-500" />
              <p className="text-[11px] font-semibold tracking-wider truncate leading-none uppercase">
                正在加载...
              </p>
            </div>
          ) : isThisPlaying ? (
            <div className="flex items-center gap-2.5 text-blue-500 dark:text-blue-400 min-w-0">
              {/* 声波跳动微动效 */}
              <span className="flex gap-0.5 items-end h-3 shrink-0">
                {[60, 100, 40].map((h, j) => (
                  <span
                    key={j}
                    className="w-0.5 bg-blue-500 dark:bg-blue-400 rounded-full"
                    style={{
                      height: `${h}%`,
                      animation: `gpBounce 0.8s ease-in-out ${j * 0.2}s infinite`,
                    }}
                  />
                ))}
              </span>
              <p className="text-[11px] font-bold tracking-wider truncate leading-none uppercase">
                正在试听本首
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 min-w-0">
              <Music size={13} className="shrink-0 opacity-70" />
              <p className="text-[11px] font-bold tracking-wider truncate leading-none uppercase">
                试听本首曲目
              </p>
            </div>
          )}
        </div>

        {/* 右侧：紧凑控制区 */}
        <div className="flex items-center gap-2 shrink-0">
          {/* 队列添加/已添加图标 */}
          {isInQueue ? (
            <div
              title="已在播放队列"
              className="flex items-center justify-center p-2 rounded-xl text-emerald-500 dark:text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 scale-95"
            >
              <Check size={14} strokeWidth={2.5} />
            </div>
          ) : (
            <button
              onClick={handleEnqueue}
              aria-label="加入播放队列"
              title="加入播放队列"
              className={cn(
                "p-2 rounded-xl transition-all active:scale-90 border",
                "text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400",
                "bg-slate-50/50 dark:bg-slate-950/20 border-slate-200/50 dark:border-slate-800/40 hover:border-blue-500/20 dark:hover:border-blue-400/20",
              )}
            >
              <ListPlus size={14} />
            </button>
          )}

          {/* 核心播放/暂停控制按钮 */}
          <button
            onClick={handleToggle}
            disabled={isThisLoading}
            aria-label={isThisPlaying ? "暂停" : "播放"}
            className={cn(
              "w-8.5 h-8.5 rounded-full flex items-center justify-center transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
              isThisLoading
                ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                : isThisPlaying
                  ? "bg-blue-500 text-white shadow-md shadow-blue-500/25 hover:bg-blue-600 active:scale-95"
                  : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm hover:opacity-90 active:scale-95",
            )}
          >
            {isThisLoading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : isThisPlaying ? (
              <Pause size={13} className="fill-current" />
            ) : (
              <Play size={13} className="fill-current translate-x-0.5" />
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes gpBounce {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
};

export default NaviPlayer;
