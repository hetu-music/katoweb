"use client";

import { usePlayerStore } from "@/store/player-store";
import { usePlayerTime } from "@/hooks/player/usePlayerTime";
import {
  formatPlayerTime,
  getCurrentLrcIndex,
  parseLrc,
} from "@/lib/player/player-utils";
import { getAudio } from "@/lib/player/audio-engine";
import { cn } from "@/lib/utils/utils";
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
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export default function GlobalPlayer() {
  const pathname = usePathname();
  const {
    currentTrack,
    queue,
    currentIndex,
    isPlaying,
    isLoading,
    volume,
    isMuted,
    error,
    playerVisible,
    lyricsMap,
    play,
    enqueue,
    toggle,
    pause,
    jumpTo,
    prev,
    next,
    removeFromQueue,
    clearQueue,
    seek,
    setVolume,
    toggleMute,
  } = usePlayerStore();
  const controls = useMemo(
    () => ({
      play,
      enqueue,
      toggle,
      pause,
      jumpTo,
      prev,
      next,
      removeFromQueue,
      clearQueue,
      seek,
      setVolume,
      toggleMute,
    }),
    [
      play,
      enqueue,
      toggle,
      pause,
      jumpTo,
      prev,
      next,
      removeFromQueue,
      clearQueue,
      seek,
      setVolume,
      toggleMute,
    ],
  );
  const audioRef = useRef(getAudio());

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
  const queueRef = useRef<HTMLDivElement>(null);
  const queueRefMobile = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showQueue) return;
    const handler = (e: MouseEvent) => {
      const isClickInsideDesktop = queueRef.current?.contains(e.target as Node);
      const isClickInsideMobile = queueRefMobile.current?.contains(
        e.target as Node,
      );
      if (!isClickInsideDesktop && !isClickInsideMobile) {
        setShowQueue(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showQueue]);

  // ── 音量面板 ──────────────────────────────────────────────────────────────
  const [showVolume, setShowVolume] = useState(false);
  const volumeRef = useRef<HTMLDivElement>(null);
  const volumeRefMobile = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showVolume) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      const isClickInsideDesktop = volumeRef.current?.contains(target);
      const isClickInsideMobile = volumeRefMobile.current?.contains(target);
      if (!isClickInsideDesktop && !isClickInsideMobile) {
        setShowVolume(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
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

  // opus seek 是重新请求流，触发 canplay 而非 seeked，preview 在 canplay 后清除
  // 等下一个 rAF 帧（此时 seekBase + audio.currentTime 已稳定）再释放 preview
  useEffect(() => {
    const onCanPlay = () => {
      if (isSeekingRef.current) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            isSeekingRef.current = false;
            setSeekPreview(null);
          });
        });
      }
    };
    const bind = () => {
      const a = audioRef.current;
      if (!a) {
        setTimeout(bind, 100);
        return;
      }
      a.addEventListener("canplay", onCanPlay);
    };
    bind();
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const a = audioRef.current;
      a?.removeEventListener("canplay", onCanPlay);
    };
  }, []);

  // ── 音量拖拽 ──────────────────────────────────────────────────────────────
  const volTrackRef = useRef<HTMLDivElement>(null);
  const volTrackRefMobile = useRef<HTMLDivElement>(null);
  const isVolDraggingRef = useRef(false);
  const activeVolTrackRef = useRef<HTMLDivElement | null>(null);

  const getVolFromPointer = useCallback(
    (clientY: number, trackEl: HTMLDivElement | null) => {
      if (!trackEl) return null;
      const rect = trackEl.getBoundingClientRect();
      return Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
    },
    [],
  );

  const handleVolPointerDown = useCallback(
    (
      e: React.PointerEvent,
      trackRef: React.RefObject<HTMLDivElement | null>,
    ) => {
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

  // 沉浸式全屏页面不显示播放条 UI（音频继续播放）
  const HIDDEN_PATHS = ["/imagery", "/story"];
  if (HIDDEN_PATHS.some((p) => pathname.startsWith(p))) return null;

  if (!currentTrack) return null;

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < queue.length - 1;
  const effectiveVolume = isMuted ? 0 : volume;
  const cardHeightClass = currentLrcText
    ? "h-[88px] sm:h-[68px]"
    : "h-[60px] sm:h-[68px]";

  return (
    <>
      {/* 底部播放条 */}
      <div
        className={cn(
          "fixed bottom-4 left-6 right-6 z-50 mx-auto max-w-7xl",
          "bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl",
          "border border-slate-200/60 dark:border-slate-700/50",
          "rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)]",
          "transition-all duration-300 ease-in-out select-none",
          playerVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-12 opacity-0 pointer-events-none",
          cardHeightClass,
        )}
      >
        {/* 顶部裁剪进度条容器 (防止其溢出卡片圆角) */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none z-10">
          {/* 进度条 */}
          <div
            ref={trackRef}
            className={cn(
              "absolute top-0 left-0 right-0 cursor-pointer pointer-events-auto [touch-action:none]",
              "group/prog",
              !duration && "pointer-events-none opacity-40",
            )}
            style={{ paddingBottom: "12px" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <div className="h-1 bg-slate-200 dark:bg-slate-700/50 rounded-t-2xl overflow-hidden group-hover/prog:h-1.5 transition-all duration-150">
              <div
                className="h-full bg-blue-500 rounded-r-full"
                style={{
                  width:
                    duration > 0 ? `${(displayTime / duration) * 100}%` : "0%",
                }}
              />
            </div>
          </div>
        </div>

        {/* ── 桌面端布局 (sm以上显示) ────────────────────────────────────────── */}
        <div className="hidden sm:flex items-center justify-between w-full h-full px-4">
          {/* 1. 曲目基本信息与歌词 */}
          <div className="flex items-center gap-3 w-1/3 min-w-0">
            {/* 封面 */}
            <div className="shrink-0 w-11 h-11 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-900/5 dark:ring-white/10 shadow-sm relative">
              {currentTrack.coverUrl ? (
                <Image
                  src={currentTrack.coverUrl}
                  alt={currentTrack.title}
                  width={44}
                  height={44}
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
                    <p className="text-[10px] text-rose-500 truncate">
                      {error}
                    </p>
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
                <Play size={16} className="fill-current" />
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

            {/* 播放队列容器 (带 Ref) */}
            <div className="relative shrink-0" ref={queueRef}>
              {/* 列表弹出面板 (Desktop Popover) */}
              <div
                className={cn(
                  "absolute bottom-full right-0 mb-3 rounded-2xl w-[380px] overflow-hidden",
                  "bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl",
                  "border border-slate-200/60 dark:border-slate-700/50",
                  "shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)]",
                  "transition-all duration-200 origin-bottom-right",
                  "animate-in fade-in slide-in-from-bottom-2 duration-200",
                  "flex flex-col select-none z-50",
                  showQueue
                    ? "opacity-100 scale-100 pointer-events-auto translate-y-0"
                    : "opacity-0 scale-95 pointer-events-none translate-y-2",
                )}
              >
                {/* 顶栏头部 */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-950/20">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      播放队列
                    </span>
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-blue-50 dark:bg-blue-950/30 text-blue-500 dark:text-blue-400 border border-blue-100/30 dark:border-blue-800/10">
                      {queue.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => controls.clearQueue()}
                      className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 px-2 py-1 rounded-lg transition-all active:scale-95"
                    >
                      <Trash2 size={12} />
                      清空
                    </button>
                    <button
                      onClick={() => setShowQueue(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-90"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {/* 歌曲列表 */}
                <div className="max-h-[320px] overflow-y-auto overscroll-contain no-scrollbar">
                  {queue.map((track, i) => (
                    <div
                      key={`${track.songId}-${i}`}
                      onClick={() => controls.jumpTo(i)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all group/item select-none border-b border-slate-50/50 dark:border-slate-800/5 last:border-b-0",
                        i === currentIndex
                          ? "bg-blue-500/5 dark:bg-blue-500/10"
                          : "hover:bg-slate-50/60 dark:hover:bg-slate-800/30",
                      )}
                    >
                      {/* 封面与播放指示器 */}
                      <div className="shrink-0 w-8 h-8 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 relative shadow-xs">
                        {track.coverUrl ? (
                          <Image
                            src={track.coverUrl}
                            alt={track.title}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music size={11} className="text-slate-400" />
                          </div>
                        )}
                        {i === currentIndex && (
                          <div className="absolute inset-0 bg-black/40 dark:bg-black/55 flex items-center justify-center">
                            {isPlaying ? (
                              <span className="flex gap-0.5 items-end h-2.5">
                                {[60, 100, 40].map((h, j) => (
                                  <span
                                    key={j}
                                    className="w-0.5 bg-blue-400 rounded-full"
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
                            "text-xs truncate",
                            i === currentIndex
                              ? "font-bold text-blue-600 dark:text-blue-400"
                              : "font-medium text-slate-700 dark:text-slate-200 group-hover/item:text-slate-900 dark:group-hover/item:text-white transition-colors",
                          )}
                        >
                          {track.title}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5 font-medium group-hover/item:text-slate-500 dark:group-hover/item:text-slate-400 transition-colors">
                          {track.artist || "未知歌手"}
                        </p>
                      </div>

                      {/* 删除单曲按钮 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          controls.removeFromQueue(i);
                        }}
                        className="shrink-0 p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all opacity-0 group-hover/item:opacity-100 active:scale-90"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 列表按钮 */}
              <button
                onClick={() => setShowQueue((v) => !v)}
                aria-label="播放列表"
                className={cn(
                  "p-2 rounded-full transition-colors",
                  "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300",
                  "hover:bg-slate-100 dark:hover:bg-slate-800/80",
                  showQueue &&
                    "bg-blue-50 dark:bg-blue-500/10 text-blue-500 dark:text-blue-400",
                )}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </button>
            </div>

            {/* 音量面板 */}
            <div className="relative shrink-0" ref={volumeRef}>
              <div
                className={cn(
                  "absolute bottom-full right-1/2 mb-3 p-2.5 rounded-2xl w-12",
                  "bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl",
                  "border border-slate-200/60 dark:border-slate-700/50",
                  "shadow-2xl shadow-slate-200/40 dark:shadow-black/40",
                  "transition-all duration-200 origin-bottom",
                  "flex flex-col items-center gap-3 select-none",
                  showVolume
                    ? "opacity-100 scale-100 pointer-events-auto translate-x-1/2 translate-y-0"
                    : "opacity-0 scale-95 pointer-events-none translate-x-1/2 translate-y-2",
                )}
              >
                <span className="shrink-0 text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500 text-center w-full">
                  {Math.round(effectiveVolume * 100)}%
                </span>

                <div
                  className="relative w-6 h-28 flex justify-center cursor-pointer select-none group/vol-area [touch-action:none]"
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
                      bottom: `calc(${effectiveVolume * 100}% - 6px)`,
                    }}
                  />
                </div>

                <button
                  onClick={controls.toggleMute}
                  aria-label={isMuted ? "取消静音" : "静音"}
                  className={cn(
                    "shrink-0 p-1 rounded-full transition-all",
                    "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200",
                    "hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90",
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
                  showVolume &&
                    "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
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
                  <Image
                    src={currentTrack.coverUrl}
                    alt={currentTrack.title}
                    width={40}
                    height={40}
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
                  !hasPrev &&
                    "text-slate-300 dark:text-slate-700 opacity-40 pointer-events-none",
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
                  isLoading && "bg-slate-100 dark:bg-slate-800 text-slate-400",
                )}
              >
                {isLoading ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : isPlaying ? (
                  <Pause size={13} className="fill-current" />
                ) : (
                  <Play size={13} className="fill-current" />
                )}
              </button>

              <button
                onClick={controls.next}
                disabled={!hasNext}
                aria-label="下一首"
                className={cn(
                  "p-1.5 rounded-full transition-all text-slate-600 dark:text-slate-300 active:scale-75",
                  !hasNext &&
                    "text-slate-300 dark:text-slate-700 opacity-40 pointer-events-none",
                )}
              >
                <SkipForward size={14} className="fill-current" />
              </button>

              {/* 播放队列容器 (移动端版, 带 Ref) */}
              <div className="relative shrink-0" ref={queueRefMobile}>
                {/* 列表弹出面板 (Mobile Popover) */}
                <div
                  className={cn(
                    "fixed left-6 right-6 z-50 rounded-2xl overflow-hidden",
                    currentLrcText ? "bottom-[112px]" : "bottom-[84px]",
                    "bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl",
                    "border border-slate-200/60 dark:border-slate-700/50",
                    "shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)]",
                    "transition-all duration-200 origin-bottom",
                    "animate-in fade-in slide-in-from-bottom-2 duration-200",
                    "flex flex-col select-none",
                    showQueue
                      ? "opacity-100 scale-100 pointer-events-auto translate-y-0"
                      : "opacity-0 scale-95 pointer-events-none translate-y-2",
                  )}
                >
                  {/* 顶栏头部 */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-950/20">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        播放队列
                      </span>
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-blue-50 dark:bg-blue-950/30 text-blue-500 dark:text-blue-400 border border-blue-100/30 dark:border-blue-800/10">
                        {queue.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => controls.clearQueue()}
                        className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 px-2 py-1 rounded-lg transition-all active:scale-95"
                      >
                        <Trash2 size={12} />
                        清空
                      </button>
                      <button
                        onClick={() => setShowQueue(false)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-90"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  {/* 歌曲列表 */}
                  <div className="max-h-[260px] overflow-y-auto overscroll-contain no-scrollbar">
                    {queue.map((track, i) => (
                      <div
                        key={`${track.songId}-${i}`}
                        onClick={() => controls.jumpTo(i)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all active:bg-slate-50/50 dark:active:bg-slate-800/20 select-none border-b border-slate-50/50 dark:border-slate-800/5 last:border-b-0",
                          i === currentIndex
                            ? "bg-blue-500/5 dark:bg-blue-500/10"
                            : "",
                        )}
                      >
                        {/* 封面与播放指示器 */}
                        <div className="shrink-0 w-8 h-8 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 relative shadow-xs">
                          {track.coverUrl ? (
                            <Image
                              src={track.coverUrl}
                              alt={track.title}
                              width={32}
                              height={32}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Music size={11} className="text-slate-400" />
                            </div>
                          )}
                          {i === currentIndex && (
                            <div className="absolute inset-0 bg-black/40 dark:bg-black/55 flex items-center justify-center">
                              {isPlaying ? (
                                <span className="flex gap-0.5 items-end h-2.5">
                                  {[60, 100, 40].map((h, j) => (
                                    <span
                                      key={j}
                                      className="w-0.5 bg-blue-400 rounded-full"
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
                              "text-xs truncate",
                              i === currentIndex
                                ? "font-bold text-blue-600 dark:text-blue-400"
                                : "font-medium text-slate-700 dark:text-slate-200",
                            )}
                          >
                            {track.title}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5 font-medium">
                            {track.artist || "未知歌手"}
                          </p>
                        </div>

                        {/* 删除单曲按钮 - 移动端默认不透明度 80% 以保持可见和便于点按 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            controls.removeFromQueue(i);
                          }}
                          className="shrink-0 p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all active:scale-90 opacity-80"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 列表按钮 */}
                <button
                  onClick={() => setShowQueue((v) => !v)}
                  aria-label="播放列表"
                  className={cn(
                    "p-1.5 rounded-full text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors",
                    showQueue && "text-blue-500 dark:text-blue-400",
                  )}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                </button>
              </div>

              {/* 音量面板 (移动端版) */}
              <div className="relative shrink-0" ref={volumeRefMobile}>
                <div
                  className={cn(
                    "absolute bottom-full right-1/2 mb-3 p-2.5 rounded-2xl w-12",
                    "bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl",
                    "border border-slate-200/60 dark:border-slate-700/50",
                    "shadow-2xl shadow-slate-200/40 dark:shadow-black/40",
                    "transition-all duration-200 origin-bottom",
                    "flex flex-col items-center gap-3 select-none",
                    showVolume
                      ? "opacity-100 scale-100 pointer-events-auto translate-x-1/2 translate-y-0"
                      : "opacity-0 scale-95 pointer-events-none translate-x-1/2 translate-y-2",
                  )}
                >
                  <span className="shrink-0 text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500 text-center w-full">
                    {Math.round(effectiveVolume * 100)}%
                  </span>

                  <div
                    className="relative w-10 h-28 flex justify-center cursor-pointer select-none group/vol-area [touch-action:none]"
                    onPointerDown={(e) =>
                      handleVolPointerDown(e, volTrackRefMobile)
                    }
                    onPointerMove={handleVolPointerMove}
                    onPointerUp={handleVolPointerUp}
                    onPointerCancel={handleVolPointerUp}
                  >
                    <div
                      ref={volTrackRefMobile}
                      className="relative w-1.5 h-full rounded-full bg-slate-200 dark:bg-slate-700/50 overflow-hidden transition-colors"
                    >
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-full"
                        style={{ height: `${effectiveVolume * 100}%` }}
                      />
                    </div>
                    {/* Knob handle - always visible on mobile */}
                    <div
                      className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border border-slate-200 shadow-md pointer-events-none"
                      style={{
                        bottom: `calc(${effectiveVolume * 100}% - 8px)`,
                      }}
                    />
                  </div>

                  <button
                    onClick={controls.toggleMute}
                    aria-label={isMuted ? "取消静音" : "静音"}
                    className={cn(
                      "shrink-0 p-1 rounded-full transition-all",
                      "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200",
                      "hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-90",
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
                    showVolume &&
                      "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
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
