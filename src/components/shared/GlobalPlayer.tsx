"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
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
import {
  formatPlayerTime,
  getCurrentLrcIndex,
  parseLrc,
  usePlayer,
} from "@/context/PlayerContext";

export default function GlobalPlayer() {
  const { state, controls, playerVisible, setPlayerVisible } = usePlayer();
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

  // ── 进度条：直接操作 DOM，绕开 React re-render ────────────────────────────
  const progressBarRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const [seekPreview, setSeekPreview] = useState<number | null>(null);
  const displayTime = seekPreview !== null ? seekPreview : currentTime;

  useEffect(() => {
    if (isDraggingRef.current) return;
    const bar = progressBarRef.current;
    if (!bar) return;
    bar.style.width = duration > 0 ? `${(currentTime / duration) * 100}%` : "0%";
  }, [currentTime, duration]);

  // ── 音量面板 ──────────────────────────────────────────────────────────────
  const [showVolume, setShowVolume] = useState(false);
  const volumeRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showVolume) return;
    const handler = (e: MouseEvent) => {
      if (volumeRef.current && !volumeRef.current.contains(e.target as Node))
        setShowVolume(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showVolume]);

  // ── 播放列表面板 ──────────────────────────────────────────────────────────
  const [showQueue, setShowQueue] = useState(false);

  // ── LRC 歌词 ──────────────────────────────────────────────────────────────
  const lrcLines = useMemo(() => {
    const lrc = currentTrack?.lrcLyrics;
    return lrc ? parseLrc(lrc) : [];
  }, [currentTrack?.lrcLyrics]);

  const currentLrcIndex = useMemo(
    () => getCurrentLrcIndex(lrcLines, currentTime),
    [lrcLines, currentTime],
  );
  const currentLrcText =
    currentLrcIndex >= 0 ? lrcLines[currentLrcIndex]?.text : null;

  // ── 进度条拖拽 ────────────────────────────────────────────────────────────
  const trackRef = useRef<HTMLDivElement>(null);
  const getTimeFromPointer = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el || !duration) return null;
      const rect = el.getBoundingClientRect();
      return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * duration;
    },
    [duration],
  );
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!duration) return;
      isDraggingRef.current = true;
      const t = getTimeFromPointer(e.clientX);
      if (t !== null) {
        setSeekPreview(t);
        const bar = progressBarRef.current;
        if (bar) bar.style.width = `${(t / duration) * 100}%`;
      }
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [duration, getTimeFromPointer],
  );
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current || !duration) return;
      const t = getTimeFromPointer(e.clientX);
      if (t !== null) {
        setSeekPreview(t);
        const bar = progressBarRef.current;
        if (bar) bar.style.width = `${(t / duration) * 100}%`;
      }
    },
    [duration, getTimeFromPointer],
  );
  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      const t = getTimeFromPointer(e.clientX);
      if (t !== null) controls.seek(t);
      setSeekPreview(null);
    },
    [controls, getTimeFromPointer],
  );

  // 没有曲目时不渲染任何东西
  if (!currentTrack) return null;

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < queue.length - 1;

  return (
    <>
      {/* 播放列表面板 */}
      {showQueue && (
        <div
          className={cn(
            "fixed z-[55] bottom-[72px] left-1/2 -translate-x-1/2 w-full max-w-lg px-4",
            "animate-in slide-in-from-bottom-4 fade-in duration-200",
          )}
        >
          <div className="rounded-2xl overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/50 shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                播放列表
                <span className="ml-2 text-xs font-normal text-slate-400">
                  {queue.length} 首
                </span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => controls.clearQueue()}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-500 transition-colors px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10"
                >
                  <Trash2 size={12} />
                  清空
                </button>
                <button
                  onClick={() => setShowQueue(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto overscroll-contain">
              {queue.map((track, i) => (
                <div
                  key={`${track.songId}-${i}`}
                  onClick={() => controls.jumpTo(i)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors group",
                    i === currentIndex
                      ? "bg-blue-50 dark:bg-blue-500/10"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                  )}
                >
                  {/* 序号 / 播放指示 */}
                  <div className="w-5 shrink-0 flex items-center justify-center">
                    {i === currentIndex ? (
                      isPlaying ? (
                        <span className="flex gap-0.5 items-end h-3">
                          {[60, 100, 40].map((h, j) => (
                            <span
                              key={j}
                              className="w-0.5 bg-blue-500 rounded-full"
                              style={{
                                height: `${h}%`,
                                animation: `gpBounce 0.8s ease-in-out ${j * 0.2}s infinite`,
                              }}
                            />
                          ))}
                        </span>
                      ) : (
                        <Music size={12} className="text-blue-500" />
                      )
                    ) : (
                      <>
                        <span className="text-[11px] text-slate-400 group-hover:hidden">{i + 1}</span>
                        <Play size={11} className="text-slate-400 hidden group-hover:block fill-current" />
                      </>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm truncate",
                      i === currentIndex
                        ? "font-bold text-blue-600 dark:text-blue-400"
                        : "font-medium text-slate-700 dark:text-slate-200",
                    )}>
                      {track.title}
                    </p>
                    {track.artist && (
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{track.artist}</p>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); controls.removeFromQueue(i); }}
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

      {/* 底部播放条：用 translate 做滑入滑出，始终在 DOM 里 */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl",
          "border-t border-slate-200/60 dark:border-slate-700/50",
          "shadow-[0_-4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.3)]",
          "transition-transform duration-300 ease-in-out",
          playerVisible ? "translate-y-0" : "translate-y-full",
        )}
      >
        {/* 进度条 */}
        <div
          ref={trackRef}
          className={cn(
            "relative h-1 w-full cursor-pointer bg-slate-200 dark:bg-slate-700/50",
            !duration && "pointer-events-none opacity-40",
          )}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div
            ref={progressBarRef}
            className="absolute left-0 top-0 h-full bg-blue-500 rounded-r-full"
            style={{
              width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%",
              transition: isDraggingRef.current ? "none" : "width 0.25s linear",
            }}
          />
        </div>

        <div className="mx-auto max-w-3xl px-4 h-[60px] flex items-center gap-3">
          {/* 曲目信息 + 歌词 */}
          <div className="flex-1 min-w-0 flex items-center gap-2.5">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              {isLoading
                ? <Loader2 size={14} className="animate-spin text-blue-500" />
                : <Music size={14} className="text-slate-400" />
              }
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate leading-tight">
                {currentTrack.title}
              </p>
              <div className="h-4 overflow-hidden">
                {error ? (
                  <div className="flex items-center gap-1">
                    <AlertCircle size={10} className="text-rose-500 shrink-0" />
                    <p className="text-[10px] text-rose-500 truncate">{error}</p>
                  </div>
                ) : currentLrcText ? (
                  <p
                    key={currentLrcIndex}
                    className="text-[11px] text-blue-500 dark:text-blue-400 truncate animate-in fade-in slide-in-from-bottom-1 duration-300"
                  >
                    {currentLrcText}
                  </p>
                ) : currentTrack.artist ? (
                  <p className="text-[11px] text-slate-400 truncate">{currentTrack.artist}</p>
                ) : null}
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
              {isLoading
                ? <Loader2 size={15} className="animate-spin" />
                : isPlaying
                  ? <Pause size={15} className="fill-current" />
                  : <Play size={15} className="fill-current translate-x-0.5" />
              }
            </button>
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

          {/* 播放列表 */}
          <button
            onClick={() => setShowQueue((v) => !v)}
            aria-label="播放列表"
            className={cn(
              "p-2 rounded-full transition-colors shrink-0",
              "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
              "hover:bg-slate-100 dark:hover:bg-slate-800",
              showQueue && "bg-blue-50 dark:bg-blue-500/10 text-blue-500",
            )}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>

          {/* 音量 */}
          <div className="relative shrink-0" ref={volumeRef}>
            <div className={cn(
              "absolute bottom-full right-0 mb-2 px-3 py-2 rounded-xl",
              "bg-white/95 dark:bg-slate-800/95 backdrop-blur-md",
              "border border-slate-200/60 dark:border-slate-700/50 shadow-lg",
              "transition-all duration-200 origin-bottom-right",
              showVolume ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-90 pointer-events-none",
            )}>
              <div className="flex items-center gap-3 w-28">
                {isMuted || volume === 0
                  ? <VolumeX size={13} className="text-slate-400 shrink-0" />
                  : <Volume2 size={13} className="text-slate-400 shrink-0" />
                }
                <Slider
                  min={0} max={1} step={0.01}
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
              {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>

          {/* 收起按钮 */}
          <button
            onClick={() => setPlayerVisible(false)}
            aria-label="收起播放条"
            className="p-2 rounded-full transition-colors shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes gpBounce {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
      `}</style>
    </>
  );
}
