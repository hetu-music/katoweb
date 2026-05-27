"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ListMusic,
  Loader2,
  Music,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { formatPlayerTime, usePlayer } from "@/context/PlayerContext";

export default function GlobalPlayer() {
  const { state, controls } = usePlayer();
  const {
    currentTrack,
    queue,
    currentIndex,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    volume,
    isMuted,
    error,
  } = state;

  const [seekPreview, setSeekPreview] = useState<number | null>(null);
  const displayTime = seekPreview !== null ? seekPreview : currentTime;

  const [showQueue, setShowQueue] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const volumeRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭音量面板
  useEffect(() => {
    if (!showVolume) return;
    const handler = (e: MouseEvent) => {
      if (volumeRef.current && !volumeRef.current.contains(e.target as Node)) {
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

  // 没有曲目时不渲染
  if (!currentTrack) return null;

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < queue.length - 1;

  return (
    <>
      {/* 播放列表面板（从底部弹出） */}
      {showQueue && (
        <div
          className={cn(
            "fixed bottom-[72px] left-0 right-0 z-40",
            "mx-auto max-w-2xl px-4",
          )}
        >
          <div
            className={cn(
              "rounded-2xl overflow-hidden",
              "bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl",
              "border border-slate-200/60 dark:border-slate-700/50",
              "shadow-2xl shadow-slate-300/30 dark:shadow-black/50",
              "animate-in slide-in-from-bottom-4 duration-200",
            )}
          >
            {/* 面板头部 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ListMusic size={15} className="text-blue-500" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  播放列表
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {queue.length} 首
                </span>
              </div>
              <button
                onClick={() => controls.clearQueue()}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-500 transition-colors px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10"
              >
                <Trash2 size={12} />
                清空
              </button>
            </div>

            {/* 曲目列表 */}
            <div className="max-h-64 overflow-y-auto overscroll-contain">
              {queue.map((track, i) => (
                <div
                  key={`${track.songId}-${i}`}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors group",
                    i === currentIndex
                      ? "bg-blue-50 dark:bg-blue-500/10"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                  )}
                  onClick={() => controls.jumpTo(i)}
                >
                  {/* 序号 / 播放指示 */}
                  <div className="w-5 shrink-0 flex items-center justify-center">
                    {i === currentIndex ? (
                      isPlaying ? (
                        <span className="flex gap-0.5 items-end h-3">
                          <span className="w-0.5 bg-blue-500 rounded-full animate-[bounce_0.8s_ease-in-out_infinite]" style={{ height: "60%" }} />
                          <span className="w-0.5 bg-blue-500 rounded-full animate-[bounce_0.8s_ease-in-out_0.2s_infinite]" style={{ height: "100%" }} />
                          <span className="w-0.5 bg-blue-500 rounded-full animate-[bounce_0.8s_ease-in-out_0.4s_infinite]" style={{ height: "40%" }} />
                        </span>
                      ) : (
                        <Music size={12} className="text-blue-500" />
                      )
                    ) : (
                      <span className="text-[11px] text-slate-400 group-hover:hidden">
                        {i + 1}
                      </span>
                    )}
                    {i !== currentIndex && (
                      <Play
                        size={11}
                        className="text-slate-400 hidden group-hover:block fill-current"
                      />
                    )}
                  </div>

                  {/* 曲目信息 */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm truncate",
                        i === currentIndex
                          ? "font-bold text-blue-600 dark:text-blue-400"
                          : "font-medium text-slate-700 dark:text-slate-200",
                      )}
                    >
                      {track.title}
                    </p>
                    {track.artist && (
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {track.artist}
                      </p>
                    )}
                  </div>

                  {/* 删除按钮 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      controls.removeFromQueue(i);
                    }}
                    className="shrink-0 p-1 rounded-md text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 底部播放条 */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl",
          "border-t border-slate-200/60 dark:border-slate-700/50",
          "shadow-[0_-4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.3)]",
        )}
      >
        {/* 进度条（贴顶） */}
        <div className="px-0">
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
              "w-full rounded-none [&_.relative]:rounded-none [&_.relative]:h-1",
              duration === 0 && "opacity-40 pointer-events-none",
            )}
          />
        </div>

        <div className="mx-auto max-w-2xl px-4 h-[60px] flex items-center gap-3">
          {/* 曲目信息 */}
          <div className="flex-1 min-w-0 flex items-center gap-2.5">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              {isLoading ? (
                <Loader2 size={14} className="animate-spin text-blue-500" />
              ) : (
                <Music size={14} className="text-slate-400" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate leading-tight">
                {currentTrack.title}
              </p>
              <div className="flex items-center gap-1.5">
                {currentTrack.artist && (
                  <p className="text-[11px] text-slate-400 truncate">
                    {currentTrack.artist}
                  </p>
                )}
                {error && (
                  <div className="flex items-center gap-1">
                    <AlertCircle size={10} className="text-rose-500 shrink-0" />
                    <p className="text-[10px] text-rose-500 truncate">{error}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 时间 */}
          <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-slate-400 shrink-0">
            <span>{formatPlayerTime(displayTime)}</span>
            <span>/</span>
            <span>{formatPlayerTime(duration)}</span>
          </div>

          {/* 播放控制 */}
          <div className="flex items-center gap-1 shrink-0">
            {/* 上一首 */}
            <button
              onClick={controls.prev}
              disabled={!hasPrev}
              aria-label="上一首"
              className={cn(
                "p-2 rounded-full transition-colors",
                hasPrev
                  ? "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  : "text-slate-300 dark:text-slate-700 cursor-not-allowed",
              )}
            >
              <SkipBack size={16} className="fill-current" />
            </button>

            {/* 播放/暂停 */}
            <button
              onClick={controls.toggle}
              disabled={isLoading}
              aria-label={isPlaying ? "暂停" : "播放"}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
                isLoading
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                  : isPlaying
                    ? "bg-blue-500 text-white shadow-md shadow-blue-500/30 hover:bg-blue-600 active:scale-95"
                    : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md hover:bg-slate-700 dark:hover:bg-slate-100 active:scale-95",
              )}
            >
              {isLoading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : isPlaying ? (
                <Pause size={15} className="fill-current" />
              ) : (
                <Play size={15} className="fill-current translate-x-0.5" />
              )}
            </button>

            {/* 下一首 */}
            <button
              onClick={controls.next}
              disabled={!hasNext}
              aria-label="下一首"
              className={cn(
                "p-2 rounded-full transition-colors",
                hasNext
                  ? "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  : "text-slate-300 dark:text-slate-700 cursor-not-allowed",
              )}
            >
              <SkipForward size={16} className="fill-current" />
            </button>
          </div>

          {/* 音量 */}
          <div className="relative shrink-0" ref={volumeRef}>
            <div
              className={cn(
                "absolute bottom-full right-0 mb-2 px-3 py-2 rounded-xl",
                "bg-white/95 dark:bg-slate-800/95 backdrop-blur-md",
                "border border-slate-200/60 dark:border-slate-700/50",
                "shadow-lg",
                "transition-all duration-200 origin-bottom-right",
                showVolume
                  ? "opacity-100 scale-100 pointer-events-auto"
                  : "opacity-0 scale-90 pointer-events-none",
              )}
            >
              <div className="flex items-center gap-3 w-28">
                {isMuted || volume === 0 ? (
                  <VolumeX size={13} className="text-slate-400 shrink-0" />
                ) : (
                  <Volume2 size={13} className="text-slate-400 shrink-0" />
                )}
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
            <button
              onClick={() => setShowVolume((v) => !v)}
              aria-label={isMuted ? "取消静音" : "音量"}
              className={cn(
                "p-2 rounded-full transition-colors",
                "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
                "hover:bg-slate-100 dark:hover:bg-slate-800",
                showVolume && "bg-slate-100 dark:bg-slate-800",
              )}
            >
              {isMuted || volume === 0 ? (
                <VolumeX size={16} />
              ) : (
                <Volume2 size={16} />
              )}
            </button>
          </div>

          {/* 播放列表按钮 */}
          <button
            onClick={() => setShowQueue((v) => !v)}
            aria-label="播放列表"
            className={cn(
              "p-2 rounded-full transition-colors shrink-0",
              "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
              "hover:bg-slate-100 dark:hover:bg-slate-800",
              showQueue && "bg-slate-100 dark:bg-slate-800 text-blue-500",
            )}
          >
            {showQueue ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>
    </>
  );
}
