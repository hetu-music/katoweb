"use client";

/**
 * PlayerContext.tsx
 *
 * 现在只是 zustand player-store 的薄包装。
 * Audio 实例和所有状态都在模块级单例里，不受 React 树挂载/卸载影响。
 * 保持 usePlayer() / usePlayerTime() 等公共接口不变，现有组件无需修改。
 */

import React, { useEffect, useRef, useState } from "react";
import { usePlayerStore } from "@/store/player-store";
import { getAudio } from "@/lib/audio-engine";

// ─── 重新导出类型，保持向后兼容 ───────────────────────────────────────────────

export type { PlayerTrack, PlayerState, PlayerActions as PlayerControls } from "@/store/player-store";

// ─── usePlayer ────────────────────────────────────────────────────────────────

/**
 * 主播放器 hook。
 * 返回与原 PlayerContext 完全兼容的结构：{ state, controls, audioRef, playerVisible, setPlayerVisible, lyricsMap }
 */
export function usePlayer() {
  const store = usePlayerStore();

  // audioRef 保持向后兼容（GlobalPlayer 的 seeked 事件监听用到）
  const audioRef = useRef(getAudio());

  const state = {
    currentTrack: store.currentTrack,
    queue: store.queue,
    currentIndex: store.currentIndex,
    isPlaying: store.isPlaying,
    isLoading: store.isLoading,
    volume: store.volume,
    isMuted: store.isMuted,
    error: store.error,
  };

  const controls = {
    play: store.play,
    enqueue: store.enqueue,
    toggle: store.toggle,
    pause: store.pause,
    jumpTo: store.jumpTo,
    prev: store.prev,
    next: store.next,
    removeFromQueue: store.removeFromQueue,
    clearQueue: store.clearQueue,
    seek: store.seek,
    setVolume: store.setVolume,
    toggleMute: store.toggleMute,
  };

  return {
    state,
    controls,
    audioRef,
    playerVisible: store.playerVisible,
    setPlayerVisible: store.setPlayerVisible,
    lyricsMap: store.lyricsMap,
  };
}

// ─── PlayerProvider ───────────────────────────────────────────────────────────

/**
 * 保留 PlayerProvider 以兼容现有的 providers.tsx，实际上只是透传 children。
 * store 是模块级单例，不需要 Provider 包裹。
 */
export function PlayerProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// ─── usePlayerTime ────────────────────────────────────────────────────────────

/**
 * 订阅播放进度的专用 hook。
 * 用 requestAnimationFrame 循环直读 audio.currentTime，约 60fps 平滑更新。
 * 暂停时自动降级为事件驱动，避免空转消耗 CPU。
 */
export function usePlayerTime(): { currentTime: number; duration: number } {
  const [time, setTime] = useState({ currentTime: 0, duration: 0 });
  const rafIdRef = useRef<number>(0);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    const audio = getAudio();
    if (!audio) return;

    const readTime = () => {
      const ct = audio.currentTime;
      const dur = isFinite(audio.duration) ? audio.duration : 0;
      setTime((prev) =>
        prev.currentTime === ct && prev.duration === dur
          ? prev
          : { currentTime: ct, duration: dur },
      );
    };

    const startRaf = () => {
      cancelAnimationFrame(rafIdRef.current);
      const loop = () => {
        readTime();
        if (isPlayingRef.current) {
          rafIdRef.current = requestAnimationFrame(loop);
        }
      };
      rafIdRef.current = requestAnimationFrame(loop);
    };

    const onPlay = () => {
      isPlayingRef.current = true;
      startRaf();
    };
    const onPause = () => {
      isPlayingRef.current = false;
      cancelAnimationFrame(rafIdRef.current);
      readTime();
    };
    const onSeeked = () => readTime();
    const onDurationChange = () => readTime();
    const onLoadedMetadata = () => readTime();

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("seeked", onSeeked);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);

    if (!audio.paused) {
      isPlayingRef.current = true;
      startRaf();
    } else {
      readTime();
    }

    return () => {
      cancelAnimationFrame(rafIdRef.current);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("seeked", onSeeked);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, []);

  return time;
}

// ─── 工具函数（保持原有导出） ─────────────────────────────────────────────────

export function formatPlayerTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function parseLrc(lrc: string): Array<{ time: number; text: string }> {
  const lines: Array<{ time: number; text: string }> = [];
  const tagRe = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;
  for (const raw of lrc.split("\n")) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const times: number[] = [];
    let match: RegExpExecArray | null;
    tagRe.lastIndex = 0;
    while ((match = tagRe.exec(trimmed)) !== null) {
      const time =
        parseInt(match[1]) * 60 +
        parseInt(match[2]) +
        parseInt(match[3]) / (match[3].length === 3 ? 1000 : 100);
      times.push(time);
    }
    if (times.length === 0) continue;
    const text = trimmed.replace(/\[\d{2}:\d{2}\.\d{2,3}\]/g, "").trim();
    if (!text) continue;
    for (const time of times) {
      lines.push({ time, text });
    }
  }
  return lines.sort((a, b) => a.time - b.time);
}

export function getCurrentLrcIndex(
  lines: Array<{ time: number; text: string }>,
  currentTime: number,
): number {
  if (!lines.length) return -1;
  let idx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time <= currentTime) idx = i;
    else break;
  }
  return idx;
}
