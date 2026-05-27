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
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  formatPlayerTime,
  getCurrentLrcIndex,
  parseLrc,
  usePlayer,
  usePlayerTime,
} from "@/context/PlayerContext";

export default function GlobalPlayer() {
  const { state, controls, playerVisible, lyricsMap, audioRef } = usePlayer();
  const {
    currentTrack,
    queue,
    currentIndex,
    isPlaying,
    isLoading,
    volume,
    isMuted,
    error,
  } = state;

  // ── 进度时间：通过 rAF 直读 audio 元素，不经过全局 state ─────────────────
  const { currentTime, duration } = usePlayerTime();

  // ── 进度条拖拽预览 ────────────────────────────────────────────────────────
  const isDraggingRef = useRef(false);
  const [seekPreview, setSeekPreview] = useState<number | null>(null);
  // isSeeking：seek 已发出但 seeked 事件还未回来，期间继续用 preview 值防止闪回
  const isSeekingRef = useRef(false);
  const displayTime = seekPreview !== null ? seekPreview : currentTime;
  // 进度条宽度直接由 JSX style 驱动（usePlayerTime rAF 触发重渲染），无需额外 effect

  // ── 播放列表面板 ──────────────────────────────────────────────────────────
  const [showQueue, setShowQueue] = useState(false);

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

  // ── LRC 歌词 ──────────────────────────────────────────────────────────────
  const lrcLines = useMemo(() => {
    if (!currentTrack) return [];
    const lrc = lyricsMap.get(currentTrack.songId);
    return lrc ? parseLrc(lrc) : [];
  }, [currentTrack, lyricsMap]);

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
      return (
        Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) * duration
      );
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
      }
    },
    [duration, getTimeFromPointer],
  );
  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      const t = getTimeFromPointer(e.clientX);
      if (t !== null) {
        // 先标记 seeking，等 seeked 事件触发后再清除 preview，防止闪回
        isSeekingRef.current = true;
        setSeekPreview(t);
        controls.seek(t);
      } else {
        setSeekPreview(null);
      }
    },
    [controls, getTimeFromPointer],
  );

  // seeked 事件触发后清除 preview（防止 seek 完成前进度条闪回旧位置）
  useEffect(() => {
    const audio = audioRef.current;
    const onSeeked = () => {
      if (isSeekingRef.current) {
        isSeekingRef.current = false;
        setSeekPreview(null);
      }
    };
    const bind = () => {
      const a = audioRef.current;
      if (!a) { setTimeout(bind, 100); return; }
      a.addEventListener("seeked", onSeeked);
    };
    bind();
    return () => { audio?.removeEventListener("seeked", onSeeked); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 音量拖拽 ──────────────────────────────────────────────────────────────
  const volTrackRef = useRef<HTMLDivElement>(null);
  const isVolDraggingRef = useRef(false);

  const getVolFromPointer = useCallback((clientX: number) => {
    const el = volTrackRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }, []);

  const handleVolPointerDown = useCallback(
    (e: React.PointerEvent) => {
      isVolDraggingRef.current = true;
      const v = getVolFromPointer(e.clientX);
      if (v !== null) controls.setVolume(v);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [controls, getVolFromPointer],
  );
  const handleVolPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isVolDraggingRef.current) return;
      const v = getVolFromPointer(e.clientX);
      if (v !== null) controls.setVolume(v);
    },
    [controls, getVolFromPointer],
  );
  const handleVolPointerUp = useCallback(
    (e: React.PointerEvent) => {
      isVolDraggingRef.current = false;
      const v = getVolFromPointer(e.clientX);
      if (v !== null) controls.setVolume(v);
    },
    [controls, getVolFromPointer],
  );

  if (!currentTrack) return null;

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < queue.length - 1;
  const effectiveVolume = isMuted ? 0 : volume;

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
                  <div className="shrink-0 w-8 h-8 rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                    {track.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music size={12} className="text-slate-400" />
                      </div>
                    )}
                    {i === currentIndex && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        {isPlaying ? (
                          <span className="flex gap-0.5 items-end h-3">
                            {[60, 100, 40].map((h, j) => (
                              <span
                                key={j}
                                className="w-0.5 bg-white rounded-full"
                                style={{
                                  height: `${h}%`,
                                  animation: `gpBounce 0.8s ease-in-out ${j * 0.2}s infinite`,
                                }}
                              />
                            ))}
                          </span>
                        ) : (
                          <Music size={10} className="text-white" />
                        )}
                      </div>
                    )}
                  </div>
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
          "transition-transform duration-300 ease-in-out",
          playerVisible ? "translate-y-0" : "translate-y-full",
        )}
      >
        {/* 进度条 */}
        <div
          ref={trackRef}
          className={cn(
            "relative h-1 w-full cursor-pointer bg-slate-200 dark:bg-slate-700/50",
            "group/prog hover:h-1.5 transition-all duration-150",
            !duration && "pointer-events-none opacity-40",
          )}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div
            className="absolute left-0 top-0 h-full bg-blue-500 rounded-r-full"
            style={{
              width: duration > 0 ? `${(displayTime / duration) * 100}%` : "0%",
            }}
          />
        </div>

        <div className="mx-auto max-w-3xl px-3 h-[60px] flex items-center gap-2">
          {/* 曲目信息 */}
          <div className="flex-1 min-w-0 flex items-center gap-2">
            {/* 封面 */}
            <div className="shrink-0 w-9 h-9 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-900/5 dark:ring-white/10">
              {currentTrack.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentTrack.coverUrl}
                  alt={currentTrack.title}
                  className={cn(
                    "w-full h-full object-cover transition-transform duration-700",
                    isPlaying && "scale-110",
                  )}
                />
              ) : isLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 size={14} className="animate-spin text-blue-500" />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music size={14} className="text-slate-400" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/song/${currentTrack.songId}`}
                className="block text-sm font-bold text-slate-800 dark:text-slate-100 truncate leading-tight hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {currentTrack.title}
              </Link>
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
                  <p className="text-[11px] text-slate-400 truncate">
                    {currentTrack.artist}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {/* 时间 */}
          <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-slate-400 shrink-0">
            <span>{formatPlayerTime(displayTime)}</span>
            <span className="opacity-50">/</span>
            <span>{formatPlayerTime(duration)}</span>
          </div>

          {/* 播放控制 */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={controls.prev}
              disabled={!hasPrev}
              aria-label="上一首"
              className={cn(
                "hidden sm:flex p-2 rounded-full transition-colors",
                hasPrev
                  ? "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  : "text-slate-300 dark:text-slate-700 cursor-not-allowed",
              )}
            >
              <SkipBack size={15} className="fill-current" />
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
              {isLoading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : isPlaying ? (
                <Pause size={15} className="fill-current" />
              ) : (
                <Play size={15} className="fill-current translate-x-0.5" />
              )}
            </button>
            <button
              onClick={controls.next}
              disabled={!hasNext}
              aria-label="下一首"
              className={cn(
                "hidden sm:flex p-2 rounded-full transition-colors",
                hasNext
                  ? "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  : "text-slate-300 dark:text-slate-700 cursor-not-allowed",
              )}
            >
              <SkipForward size={15} className="fill-current" />
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
              showQueue && "bg-blue-50 dark:bg-blue-500/10 text-blue-500",
            )}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>

          {/* 音量面板 */}
          <div className="relative shrink-0" ref={volumeRef}>
            <div className={cn(
              "absolute bottom-full right-0 mb-2 p-3 rounded-2xl w-36",
              "bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl",
              "border border-slate-200/60 dark:border-slate-700/50",
              "shadow-xl shadow-slate-200/40 dark:shadow-black/40",
              "transition-all duration-200 origin-bottom-right",
              showVolume ? "opacity-100 scale-100 pointer-events-auto translate-y-0" : "opacity-0 scale-90 pointer-events-none translate-y-1",
            )}>
              <div className="flex items-center gap-2">
                <button
                  onClick={controls.toggleMute}
                  aria-label={isMuted ? "取消静音" : "静音"}
                  className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {effectiveVolume === 0 ? <VolumeX size={13} /> : <Volume2 size={13} />}
                </button>
                <div
                  ref={volTrackRef}
                  className="relative flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700/50 cursor-pointer group/vol"
                  onPointerDown={handleVolPointerDown}
                  onPointerMove={handleVolPointerMove}
                  onPointerUp={handleVolPointerUp}
                  onPointerCancel={handleVolPointerUp}
                >
                  <div
                    className="absolute left-0 top-0 h-full bg-blue-500 rounded-full"
                    style={{ width: `${effectiveVolume * 100}%` }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border border-slate-200 shadow-sm -translate-x-1/2 pointer-events-none"
                    style={{ left: `${effectiveVolume * 100}%` }}
                  />
                </div>
                <span className="shrink-0 text-[10px] font-mono text-slate-400 w-5 text-right">
                  {Math.round(effectiveVolume * 100)}
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
                showVolume && "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
              )}
            >
              {effectiveVolume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
          </div>
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
