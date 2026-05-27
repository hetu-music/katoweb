"use client";

import {
  formatPlayerTime,
  getCurrentLrcIndex,
  parseLrc,
  usePlayer,
  usePlayerTime,
} from "@/context/PlayerContext";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  Loader2,
  Music,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Trash2,
  Volume,
  Volume1,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import Link from "next/link";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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
  const volumeRefMobile = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showVolume) return;
    const handler = (e: MouseEvent) => {
      const isClickInsideDesktop = volumeRef.current?.contains(e.target as Node);
      const isClickInsideMobile = volumeRefMobile.current?.contains(e.target as Node);
      if (!isClickInsideDesktop && !isClickInsideMobile) {
        setShowVolume(false);
      }
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
  // 【修复】加入 50ms 的延迟：seeked 触发时 audio.currentTime 就已终止位置，
  // 但 rAF 循环可能还有一帧慨湐读取的时间尚未刷新。
  // 延迟后再释放 preview 可以确保 slider 源滑透明、不闪烁。
  useEffect(() => {
    const onSeeked = () => {
      if (isSeekingRef.current) {
        // RAF 周期约 16ms，50ms 足够确保至少两帧已用新时间渲染
        setTimeout(() => {
          isSeekingRef.current = false;
          setSeekPreview(null);
        }, 50);
      }
    };
    const bind = () => {
      const a = audioRef.current;
      if (!a) { setTimeout(bind, 100); return; }
      a.addEventListener("seeked", onSeeked);
    };
    bind();
    return () => {
      const a = audioRef.current;
      a?.removeEventListener("seeked", onSeeked);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 音量拖拽 ──────────────────────────────────────────────────────────────
  const volTrackRef = useRef<HTMLDivElement>(null);
  const volTrackRefMobile = useRef<HTMLDivElement>(null);
  const isVolDraggingRef = useRef(false);
  const activeVolTrackRef = useRef<HTMLDivElement | null>(null);

  const getVolFromPointer = useCallback((clientY: number, trackEl: HTMLDivElement | null) => {
    if (!trackEl) return null;
    const rect = trackEl.getBoundingClientRect();
    return Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
  }, []);

  const handleVolPointerDown = useCallback(
    (e: React.PointerEvent, trackRef: React.RefObject<HTMLDivElement | null>) => {
      isVolDraggingRef.current = true;
      activeVolTrackRef.current = trackRef.current;
      const v = getVolFromPointer(e.clientY, trackRef.current);
      if (v !== null) controls.setVolume(v);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [controls, getVolFromPointer],
  );
  const handleVolPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isVolDraggingRef.current) return;
      const v = getVolFromPointer(e.clientY, activeVolTrackRef.current);
      if (v !== null) controls.setVolume(v);
    },
    [controls, getVolFromPointer],
  );
  const handleVolPointerUp = useCallback(
    (e: React.PointerEvent) => {
      isVolDraggingRef.current = false;
      const v = getVolFromPointer(e.clientY, activeVolTrackRef.current);
      if (v !== null) controls.setVolume(v);
      activeVolTrackRef.current = null;
    },
    [controls, getVolFromPointer],
  );

  if (!currentTrack) return null;

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < queue.length - 1;
  const effectiveVolume = isMuted ? 0 : volume;
  const cardHeightClass = currentLrcText
    ? "h-[88px] sm:h-[68px]"
    : "h-[60px] sm:h-[68px]";

  return (
    <>
      {/* 播放列表面板 */}
      {showQueue && (
        <div
          className={cn(
            "fixed z-55 bottom-[104px] sm:bottom-[96px] left-1/2 -translate-x-1/2 w-full max-w-lg px-4",
            "animate-in slide-in-from-bottom-4 fade-in duration-200",
          )}
        >
          <div className="rounded-3xl overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/40 shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            {/* 顶栏头部 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/20">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  播放列表
                </span>
                <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-blue-50 dark:bg-blue-950/30 text-blue-500 dark:text-blue-400 border border-blue-100/30 dark:border-blue-800/10">
                  {queue.length}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => controls.clearQueue()}
                  className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/25 px-2.5 py-1.5 rounded-xl transition-all active:scale-95"
                >
                  <Trash2 size={13} />
                  清空列表
                </button>
                <button
                  onClick={() => setShowQueue(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-90"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* 歌曲列表 */}
            <div className="max-h-72 overflow-y-auto overscroll-contain no-scrollbar">
              {queue.map((track, i) => (
                <div
                  key={`${track.songId}-${i}`}
                  onClick={() => controls.jumpTo(i)}
                  className={cn(
                    "flex items-center gap-3.5 px-5 py-3 cursor-pointer transition-all group/item select-none border-b border-slate-50/50 dark:border-slate-800/10 last:border-b-0",
                    i === currentIndex
                      ? "bg-linear-to-r from-blue-500/8 to-transparent dark:from-blue-500/10 dark:to-transparent"
                      : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40",
                  )}
                >
                  {/* 封面与播放指示器 */}
                  <div className="shrink-0 w-8.5 h-8.5 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 relative shadow-sm">
                    {track.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={track.coverUrl} alt={track.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music size={12} className="text-slate-400" />
                      </div>
                    )}
                    {i === currentIndex && (
                      <div className="absolute inset-0 bg-black/40 dark:bg-black/50 flex items-center justify-center">
                        {isPlaying ? (
                          <span className="flex gap-0.5 items-end h-3">
                            {[60, 100, 40].map((h, j) => (
                              <span
                                key={j}
                                className="w-0.5 bg-blue-400 dark:bg-blue-400 rounded-full"
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

                  {/* 歌曲名与歌手 */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm truncate",
                        i === currentIndex
                          ? "font-bold text-blue-600 dark:text-blue-400"
                          : "font-medium text-slate-700 dark:text-slate-200 group-hover/item:text-slate-900 dark:group-hover/item:text-white transition-colors",
                      )}
                    >
                      {track.title}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5 font-medium group-hover/item:text-slate-500 dark:group-hover/item:text-slate-400 transition-colors">
                      {track.artist || "未知歌手"}
                    </p>
                  </div>

                  {/* 删除单曲按钮 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      controls.removeFromQueue(i);
                    }}
                    className="shrink-0 p-2 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all opacity-0 group-hover/item:opacity-100 active:scale-90"
                  >
                    <X size={14} />
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
          "fixed bottom-4 left-6 right-6 z-50 mx-auto max-w-7xl",
          "bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl",
          "border border-slate-200/60 dark:border-slate-700/50",
          "rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)]",
          "transition-all duration-300 ease-in-out select-none",
          playerVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0 pointer-events-none",
          cardHeightClass
        )}
      >
        {/* 进度条 */}
        <div
          ref={trackRef}
          className={cn(
            "absolute top-0 left-0 right-0 h-1 cursor-pointer bg-slate-200 dark:bg-slate-700/50 z-10 rounded-t-2xl overflow-hidden",
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

        {/* ── 桌面端布局 (sm以上显示) ────────────────────────────────────────── */}
        <div className="hidden sm:flex items-center justify-between w-full h-full px-4">
          {/* 1. 曲目基本信息与歌词 */}
          <div className="flex items-center gap-3 w-1/3 min-w-0">
            {/* 封面 */}
            <div className="shrink-0 w-11 h-11 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-900/5 dark:ring-white/10 shadow-sm relative">
              {currentTrack.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentTrack.coverUrl}
                  alt={currentTrack.title}
                  className={cn(
                    "w-full h-full object-cover transition-transform duration-700",
                    isPlaying && "scale-105",
                  )}
                />
              ) : isLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 size={16} className="animate-spin text-blue-500" />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music size={16} className="text-slate-400" />
                </div>
              )}
            </div>
            {/* 标题 & 歌手/歌词 堆叠 */}
            <div className="min-w-0 flex-1">
              <Link
                href={`/song/${currentTrack.songId}`}
                className="block text-sm font-bold text-slate-800 dark:text-slate-100 truncate leading-tight hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {currentTrack.title}
              </Link>
              <div className="h-4 overflow-hidden mt-0.5">
                {error ? (
                  <div className="flex items-center gap-1">
                    <AlertCircle size={10} className="text-rose-500 shrink-0" />
                    <p className="text-[10px] text-rose-500 truncate">{error}</p>
                  </div>
                ) : currentLrcText ? (
                  <p
                    key={currentLrcIndex}
                    className="text-[11px] font-medium text-blue-500 dark:text-blue-400 truncate animate-in fade-in slide-in-from-bottom-1 duration-300"
                  >
                    {currentLrcText}
                  </p>
                ) : currentTrack.artist ? (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                    {currentTrack.artist}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {/* 2. 播放主控制器 */}
          <div className="flex items-center gap-3 justify-center w-1/3 shrink-0">
            <button
              onClick={controls.prev}
              disabled={!hasPrev}
              aria-label="上一首"
              className={cn(
                "p-2 rounded-full transition-all active:scale-90",
                hasPrev
                  ? "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80"
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
                "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
                isLoading
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                  : isPlaying
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25 hover:bg-blue-600 active:scale-95"
                    : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-95",
              )}
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : isPlaying ? (
                <Pause size={16} className="fill-current" />
              ) : (
                <Play size={16} className="fill-current translate-x-0.5" />
              )}
            </button>
            <button
              onClick={controls.next}
              disabled={!hasNext}
              aria-label="下一首"
              className={cn(
                "p-2 rounded-full transition-all active:scale-90",
                hasNext
                  ? "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                  : "text-slate-300 dark:text-slate-700 cursor-not-allowed",
              )}
            >
              <SkipForward size={16} className="fill-current" />
            </button>
          </div>

          {/* 3. 工具栏 (时间、播放列表、音量) */}
          <div className="flex items-center gap-3 justify-end w-1/3 shrink-0">
            {/* 时间码 */}
            <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 dark:text-slate-500">
              <span>{formatPlayerTime(displayTime)}</span>
              <span className="opacity-40">/</span>
              <span>{formatPlayerTime(duration)}</span>
            </div>

            {/* 列表按钮 */}
            <button
              onClick={() => setShowQueue((v) => !v)}
              aria-label="播放列表"
              className={cn(
                "p-2 rounded-full transition-colors",
                "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
                "hover:bg-slate-100 dark:hover:bg-slate-800/80",
                showQueue && "bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400",
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
                "absolute bottom-full right-1/2 mb-3 p-2.5 rounded-2xl w-12",
                "bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl",
                "border border-slate-200/60 dark:border-slate-700/50",
                "shadow-2xl shadow-slate-200/40 dark:shadow-black/40",
                "transition-all duration-200 origin-bottom",
                "flex flex-col items-center gap-3 select-none",
                showVolume
                  ? "opacity-100 scale-100 pointer-events-auto translate-x-1/2 translate-y-0"
                  : "opacity-0 scale-95 pointer-events-none translate-x-1/2 translate-y-2",
              )}>
                <span className="shrink-0 text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500 text-center w-full">
                  {Math.round(effectiveVolume * 100)}%
                </span>

                <div
                  className="relative w-6 h-28 flex justify-center cursor-pointer select-none group/vol-area"
                  onPointerDown={(e) => handleVolPointerDown(e, volTrackRef)}
                  onPointerMove={handleVolPointerMove}
                  onPointerUp={handleVolPointerUp}
                  onPointerCancel={handleVolPointerUp}
                >
                  {/* The actual thin track */}
                  <div
                    ref={volTrackRef}
                    className="relative w-1 h-full rounded-full bg-slate-200 dark:bg-slate-700/50 overflow-hidden group-hover/vol-area:bg-slate-300 dark:group-hover/vol-area:bg-slate-600 transition-colors"
                  >
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-full"
                      style={{ height: `${effectiveVolume * 100}%` }}
                    />
                  </div>
                  {/* Knob handle */}
                  <div
                    className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white border border-slate-200 shadow-md pointer-events-none scale-0 group-hover/vol-area:scale-100 transition-transform duration-150"
                    style={{
                      bottom: `calc(${effectiveVolume * 100}% - 6px)`
                    }}
                  />
                </div>

                <button
                  onClick={controls.toggleMute}
                  aria-label={isMuted ? "取消静音" : "静音"}
                  className={cn(
                    "shrink-0 p-1 rounded-full transition-all",
                    "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200",
                    "hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90"
                  )}
                >
                  {effectiveVolume === 0 ? (
                    <VolumeX size={14} />
                  ) : effectiveVolume < 0.3 ? (
                    <Volume size={14} />
                  ) : effectiveVolume < 0.7 ? (
                    <Volume1 size={14} />
                  ) : (
                    <Volume2 size={14} />
                  )}
                </button>
              </div>

              <button
                onClick={() => setShowVolume((v) => !v)}
                aria-label={isMuted ? "取消静音" : "音量"}
                className={cn(
                  "p-2 rounded-full transition-colors",
                  "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
                  "hover:bg-slate-100 dark:hover:bg-slate-800/80",
                  showVolume && "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
                )}
              >
                {effectiveVolume === 0 ? (
                  <VolumeX size={15} />
                ) : effectiveVolume < 0.3 ? (
                  <Volume size={15} />
                ) : effectiveVolume < 0.7 ? (
                  <Volume1 size={15} />
                ) : (
                  <Volume2 size={15} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── 移动端布局 (sm以下显示，自适应高度) ─────────────────────────────── */}
        <div className="flex sm:hidden flex-col justify-center w-full h-full px-3.5 py-2">
          {/* 第一排：曲目封面、曲目信息与基础操作按钮 */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {/* 封面 */}
              <div className="shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-900/5 dark:ring-white/10 shadow-sm relative">
                {currentTrack.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentTrack.coverUrl}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
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

              {/* 歌曲名 & 歌手 */}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate leading-tight">
                  {currentTrack.title}
                </div>
                {!currentLrcText && currentTrack.artist && (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    {currentTrack.artist}
                  </p>
                )}
                {error && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <AlertCircle size={9} className="text-rose-500 shrink-0" />
                    <p className="text-[9px] text-rose-500 truncate">{error}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 紧凑操作栏 */}
            <div className="flex items-center gap-1 shrink-0 ml-2">
              <button
                onClick={controls.prev}
                disabled={!hasPrev}
                aria-label="上一首"
                className={cn(
                  "p-1.5 rounded-full transition-all text-slate-600 dark:text-slate-300 active:scale-75",
                  !hasPrev && "text-slate-300 dark:text-slate-700 opacity-40 pointer-events-none"
                )}
              >
                <SkipBack size={14} className="fill-current" />
              </button>

              <button
                onClick={controls.toggle}
                disabled={isLoading}
                aria-label={isPlaying ? "暂停" : "播放"}
                className={cn(
                  "w-8.5 h-8.5 rounded-full flex items-center justify-center transition-all bg-blue-500 text-white shadow-md active:scale-90",
                  isLoading && "bg-slate-100 dark:bg-slate-800 text-slate-400"
                )}
              >
                {isLoading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : isPlaying ? (
                  <Pause size={13} className="fill-current" />
                ) : (
                  <Play size={13} className="fill-current translate-x-0.5" />
                )}
              </button>

              <button
                onClick={controls.next}
                disabled={!hasNext}
                aria-label="下一首"
                className={cn(
                  "p-1.5 rounded-full transition-all text-slate-600 dark:text-slate-300 active:scale-75",
                  !hasNext && "text-slate-300 dark:text-slate-700 opacity-40 pointer-events-none"
                )}
              >
                <SkipForward size={14} className="fill-current" />
              </button>

              <button
                onClick={() => setShowQueue((v) => !v)}
                aria-label="播放列表"
                className={cn(
                  "p-1.5 rounded-full text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
                  showQueue && "text-blue-500 dark:text-blue-400"
                )}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </button>

              {/* 音量面板 (移动端版) */}
              <div className="relative shrink-0" ref={volumeRefMobile}>
                <div className={cn(
                  "absolute bottom-full right-1/2 mb-3 p-2.5 rounded-2xl w-12",
                  "bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl",
                  "border border-slate-200/60 dark:border-slate-700/50",
                  "shadow-2xl shadow-slate-200/40 dark:shadow-black/40",
                  "transition-all duration-200 origin-bottom",
                  "flex flex-col items-center gap-3 select-none",
                  showVolume
                    ? "opacity-100 scale-100 pointer-events-auto translate-x-1/2 translate-y-0"
                    : "opacity-0 scale-95 pointer-events-none translate-x-1/2 translate-y-2",
                )}>
                  <span className="shrink-0 text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500 text-center w-full">
                    {Math.round(effectiveVolume * 100)}%
                  </span>

                  <div
                    className="relative w-6 h-28 flex justify-center cursor-pointer select-none group/vol-area"
                    onPointerDown={(e) => handleVolPointerDown(e, volTrackRefMobile)}
                    onPointerMove={handleVolPointerMove}
                    onPointerUp={handleVolPointerUp}
                    onPointerCancel={handleVolPointerUp}
                  >
                    <div
                      ref={volTrackRefMobile}
                      className="relative w-1 h-full rounded-full bg-slate-200 dark:bg-slate-700/50 overflow-hidden group-hover/vol-area:bg-slate-300 dark:group-hover/vol-area:bg-slate-600 transition-colors"
                    >
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-full"
                        style={{ height: `${effectiveVolume * 100}%` }}
                      />
                    </div>
                    {/* Knob handle */}
                    <div
                      className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white border border-slate-200 shadow-md pointer-events-none scale-0 group-hover/vol-area:scale-100 transition-transform duration-150"
                      style={{
                        bottom: `calc(${effectiveVolume * 100}% - 6px)`
                      }}
                    />
                  </div>

                  <button
                    onClick={controls.toggleMute}
                    aria-label={isMuted ? "取消静音" : "静音"}
                    className={cn(
                      "shrink-0 p-1 rounded-full transition-all",
                      "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200",
                      "hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90"
                    )}
                  >
                    {effectiveVolume === 0 ? (
                      <VolumeX size={14} />
                    ) : effectiveVolume < 0.3 ? (
                      <Volume size={14} />
                    ) : effectiveVolume < 0.7 ? (
                      <Volume1 size={14} />
                    ) : (
                      <Volume2 size={14} />
                    )}
                  </button>
                </div>

                <button
                  onClick={() => setShowVolume((v) => !v)}
                  aria-label={isMuted ? "取消静音" : "音量"}
                  className={cn(
                    "p-1.5 rounded-full transition-colors",
                    "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
                    "hover:bg-slate-100 dark:hover:bg-slate-800/80",
                    showVolume && "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
                  )}
                >
                  {effectiveVolume === 0 ? (
                    <VolumeX size={14} />
                  ) : effectiveVolume < 0.3 ? (
                    <Volume size={14} />
                  ) : effectiveVolume < 0.7 ? (
                    <Volume1 size={14} />
                  ) : (
                    <Volume2 size={14} />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 第二排：移动端专属歌词舱（仅在有歌词时动态滑出，提供完整宽度空间） */}
          {currentLrcText && (
            <div className="w-full mt-2 h-4.5 overflow-hidden relative flex items-center justify-center select-none bg-blue-50/40 dark:bg-blue-950/20 rounded-lg px-2 border border-blue-100/10 dark:border-blue-900/10">
              <p
                key={currentLrcIndex}
                className="text-[10px] font-semibold text-blue-500 dark:text-blue-400 truncate text-center w-full animate-in fade-in slide-in-from-bottom-1 duration-300"
              >
                {currentLrcText}
              </p>
            </div>
          )}
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
