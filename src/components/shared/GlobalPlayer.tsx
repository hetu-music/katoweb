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
  Volume2,
  VolumeX,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { formatPlayerTime, usePlayer } from "@/context/PlayerContext";

// ─── LRC 解析 ────────────────────────────────────────────────────────────────

interface LrcLine {
  time: number;
  text: string;
}

function parseLrc(lrc: string): LrcLine[] {
  const lines: LrcLine[] = [];
  const re = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;
  for (const raw of lrc.split("\n")) {
    const m = raw.match(re);
    if (!m) continue;
    const time =
      parseInt(m[1]) * 60 +
      parseInt(m[2]) +
      parseInt(m[3]) / (m[3].length === 3 ? 1000 : 100);
    const text = m[4].trim();
    if (text) lines.push({ time, text });
  }
  return lines.sort((a, b) => a.time - b.time);
}

function getCurrentLrcIndex(lines: LrcLine[], currentTime: number): number {
  if (!lines.length) return -1;
  let idx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time <= currentTime) idx = i;
    else break;
  }
  return idx;
}

// ─── 组件 ─────────────────────────────────────────────────────────────────────

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

  // ── 进度条：直接操作 DOM，绕开 React re-render ────────────────────────────
  const progressBarRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const [seekPreview, setSeekPreview] = useState<number | null>(null);
  const displayTime = seekPreview !== null ? seekPreview : currentTime;

  useEffect(() => {
    if (isDraggingRef.current) return;
    const bar = progressBarRef.current;
    if (!bar) return;
    const pct = duration > 0 ? (currentTime / duration) * 100 : 0;
    bar.style.width = `${pct}%`;
  }, [currentTime, duration]);

  // ── 音量面板 ──────────────────────────────────────────────────────────────
  const [showVolume, setShowVolume] = useState(false);
  const volumeRef = useRef<HTMLDivElement>(null);

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

  // ── LRC 歌词 ──────────────────────────────────────────────────────────────
  const lrcLines = useMemo(() => {
    const lrc = currentTrack?.lrcLyrics;
    if (!lrc) return [];
    return parseLrc(lrc);
  }, [currentTrack?.lrcLyrics]);

  const currentLrcIndex = useMemo(
    () => getCurrentLrcIndex(lrcLines, currentTime),
    [lrcLines, currentTime],
  );

  const currentLrcText =
    currentLrcIndex >= 0 ? lrcLines[currentLrcIndex]?.text : null;

  // ── 进度条拖拽（原生 pointer events） ────────────────────────────────────
  const trackRef = useRef<HTMLDivElement>(null);

  const getTimeFromPointer = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el || !duration) return null;
      const rect = el.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return ratio * duration;
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

  if (!currentTrack) return null;

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < queue.length - 1;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl",
        "border-t border-slate-200/60 dark:border-slate-700/50",
        "shadow-[0_-4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.3)]",
      )}
    >
      {/* 进度条 */}
      <div
        ref={trackRef}
        className={cn(
          "relative h-1 w-full cursor-pointer group/progress",
          "bg-slate-200 dark:bg-slate-700/50",
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
            {isLoading ? (
              <Loader2 size={14} className="animate-spin text-blue-500" />
            ) : (
              <Music size={14} className="text-slate-400" />
            )}
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
              "shadow-lg transition-all duration-200 origin-bottom-right",
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
      </div>
    </div>
  );
}
