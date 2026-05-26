"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Loader2,
  Pause,
  Play,
  Volume2,
  VolumeX,
  AlertCircle,
  Music,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  useNaviPlayer,
  formatPlayerTime,
} from "@/hooks/useNaviPlayer";

interface NaviPlayerProps {
  /** 歌曲标题，用于显示 */
  title: string;
  /** 演唱者，用于显示 */
  artist?: string | null;
  /** 封面图 URL */
  coverUrl?: string;
  /** Navidrome 歌曲 ID，为 null 时不加载音频 */
  songNavId: string | null;
  className?: string;
}

const NaviPlayer: React.FC<NaviPlayerProps> = ({
  title,
  artist,
  coverUrl,
  songNavId,
  className,
}) => {
  const [playerState, controls] = useNaviPlayer(songNavId);
  const {
    isPlaying,
    isLoading,
    currentTime,
    duration,
    volume,
    isMuted,
    error,
  } = playerState;

  // 进度条拖拽中间状态：拖拽时显示预览值，松手后才 seek
  const [seekPreview, setSeekPreview] = useState<number | null>(null);
  const displayTime = seekPreview !== null ? seekPreview : currentTime;

  // 音量面板展开状态
  const [showVolume, setShowVolume] = useState(false);
  const volumePanelRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭音量面板
  useEffect(() => {
    if (!showVolume) return;
    const handler = (e: MouseEvent) => {
      if (
        volumePanelRef.current &&
        !volumePanelRef.current.contains(e.target as Node)
      ) {
        setShowVolume(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showVolume]);

  const handleSeekCommit = useCallback(
    (value: number[]) => {
      controls.seek(value[0]);
      setSeekPreview(null);
    },
    [controls],
  );

  const handleSeekPreview = useCallback((value: number[]) => {
    setSeekPreview(value[0]);
  }, []);

  const progressPercent = duration > 0 ? (displayTime / duration) * 100 : 0;

  return (
    <div
      className={cn(
        // 毛玻璃拟态容器
        "relative overflow-hidden rounded-2xl",
        "bg-white/70 dark:bg-slate-900/60",
        "backdrop-blur-xl",
        "border border-white/60 dark:border-slate-700/50",
        "shadow-xl shadow-slate-200/40 dark:shadow-black/40",
        "ring-1 ring-slate-900/5 dark:ring-white/5",
        className,
      )}
    >
      {/* 背景装饰：封面模糊渐变 */}
      {coverUrl && (
        <div
          className="absolute inset-0 opacity-10 dark:opacity-[0.07] bg-cover bg-center scale-110 blur-2xl pointer-events-none"
          style={{ backgroundImage: `url(${coverUrl})` }}
          aria-hidden="true"
        />
      )}

      <div className="relative z-10 p-5 space-y-4">
        {/* 顶部：封面 + 歌曲信息 + 播放按钮 */}
        <div className="flex items-center gap-4">
          {/* 封面缩略图 */}
          <div className="relative shrink-0 w-14 h-14 rounded-xl overflow-hidden shadow-md ring-1 ring-slate-900/10 dark:ring-white/10">
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverUrl}
                alt={title}
                className={cn(
                  "w-full h-full object-cover transition-all duration-700",
                  isPlaying && "scale-110",
                )}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                <Music size={20} className="text-slate-400" />
              </div>
            )}
            {/* 播放中旋转光晕 */}
            {isPlaying && (
              <div className="absolute inset-0 rounded-xl ring-2 ring-blue-400/40 animate-pulse pointer-events-none" />
            )}
          </div>

          {/* 歌曲信息 */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-50 truncate leading-tight">
              {title}
            </p>
            {artist && (
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {artist}
              </p>
            )}
            {/* 错误提示 */}
            {error && (
              <div className="flex items-center gap-1.5 mt-1">
                <AlertCircle size={11} className="text-rose-500 shrink-0" />
                <p className="text-[11px] text-rose-500 truncate">{error}</p>
              </div>
            )}
          </div>

          {/* 播放/暂停按钮 */}
          <button
            onClick={controls.toggle}
            disabled={isLoading || !songNavId}
            aria-label={isPlaying ? "暂停" : "播放"}
            className={cn(
              "shrink-0 w-11 h-11 rounded-full flex items-center justify-center",
              "transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
              isLoading || !songNavId
                ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                : isPlaying
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-600 active:scale-95"
                  : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md hover:bg-slate-700 dark:hover:bg-slate-100 active:scale-95",
            )}
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : isPlaying ? (
              <Pause size={18} className="fill-current" />
            ) : (
              <Play size={18} className="fill-current translate-x-0.5" />
            )}
          </button>
        </div>

        {/* 进度条区域 */}
        <div className="space-y-1.5">
          <Slider
            min={0}
            max={duration || 100}
            step={0.5}
            value={[displayTime]}
            onValueChange={handleSeekPreview}
            onValueCommit={handleSeekCommit}
            disabled={duration === 0}
            aria-label="播放进度"
            className={cn(
              "w-full",
              duration === 0 && "opacity-40 pointer-events-none",
            )}
          />
          {/* 时间标注 */}
          <div className="flex justify-between text-[10px] font-mono text-slate-400 dark:text-slate-500 select-none px-0.5">
            <span>{formatPlayerTime(displayTime)}</span>
            <span>{formatPlayerTime(duration)}</span>
          </div>
        </div>

        {/* 底部：音量控制 */}
        <div className="flex items-center justify-end">
          <div className="relative" ref={volumePanelRef}>
            {/* 音量展开面板 */}
            <div
              className={cn(
                "absolute bottom-full right-0 mb-2 px-3 py-2 rounded-xl",
                "bg-white/90 dark:bg-slate-800/90 backdrop-blur-md",
                "border border-slate-200/60 dark:border-slate-700/50",
                "shadow-lg shadow-slate-200/30 dark:shadow-black/30",
                "transition-all duration-200 origin-bottom-right",
                showVolume
                  ? "opacity-100 scale-100 pointer-events-auto"
                  : "opacity-0 scale-90 pointer-events-none",
              )}
            >
              <div className="flex items-center gap-3 w-32">
                <VolumeIcon muted={isMuted} volume={volume} size={13} />
                <Slider
                  min={0}
                  max={1}
                  step={0.01}
                  value={[isMuted ? 0 : volume]}
                  onValueChange={(v) => controls.setVolume(v[0])}
                  aria-label="音量"
                  className="flex-1"
                />
                <span className="text-[10px] font-mono text-slate-400 w-6 text-right shrink-0">
                  {Math.round((isMuted ? 0 : volume) * 100)}
                </span>
              </div>
            </div>

            {/* 音量按钮 */}
            <button
              onClick={() => setShowVolume((v) => !v)}
              aria-label={isMuted ? "取消静音" : "音量"}
              className={cn(
                "p-2 rounded-lg transition-colors",
                "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300",
                "hover:bg-slate-100/80 dark:hover:bg-slate-800/80",
                showVolume &&
                  "bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300",
              )}
            >
              <VolumeIcon muted={isMuted} volume={volume} size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/** 根据静音状态和音量值渲染对应图标 */
function VolumeIcon({
  muted,
  volume,
  size,
}: {
  muted: boolean;
  volume: number;
  size: number;
}) {
  if (muted || volume === 0) return <VolumeX size={size} />;
  return <Volume2 size={size} />;
}

export default NaviPlayer;
