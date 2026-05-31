"use client";

import { useEffect, useRef, useState } from "react";
import { getAudio } from "@/lib/player/audio-engine";
import { usePlayerStore } from "@/store/player-store";

/**
 * usePlayerTime
 *
 * 低频 React state（用于歌词行切换）+ 高频 DOM 回调（用于进度条/时间码）。
 *
 * - currentTime / duration：仅在歌词行可能切换时更新（约每秒一次），
 *   驱动 GlobalPlayer 里 currentLrcIndex 的 useMemo，避免 60fps 重渲染。
 * - onTick：每个 rAF 帧调用，供调用方直接操作 DOM（进度条宽度、时间码文字），
 *   完全绕开 React 渲染管线。
 */
export function usePlayerTime(
  onTick?: (currentTime: number, duration: number) => void,
): {
  currentTime: number;
  duration: number;
} {
  const trackDuration = usePlayerStore((s) => s.trackDuration);
  const seekBase = usePlayerStore((s) => s.seekBase);

  const seekBaseRef = useRef(seekBase);
  const trackDurationRef = useRef(trackDuration);
  const onTickRef = useRef(onTick);

  useEffect(() => {
    seekBaseRef.current = seekBase;
  }, [seekBase]);
  useEffect(() => {
    trackDurationRef.current = trackDuration;
  }, [trackDuration]);
  useEffect(() => {
    onTickRef.current = onTick;
  });

  const [currentTime, setCurrentTime] = useState(seekBase);
  const rafIdRef = useRef<number>(0);
  const isPlayingRef = useRef(false);
  // 上次触发 setState 时的秒数（整数），只在整秒变化时才 setState
  const lastSecRef = useRef(-1);
  // loadstart 到 canplay 之间屏蔽 readTime，防止 audio.currentTime=0 时写入错误位置
  const isLoadingRef = useRef(false);

  // seekBase 变化时立即同步
  const [prevSeekBase, setPrevSeekBase] = useState(seekBase);
  if (prevSeekBase !== seekBase) {
    setPrevSeekBase(seekBase);
    setCurrentTime(seekBase);
  }

  // 在 effect 中同步 lastSecRef，避免在渲染阶段写 ref
  useEffect(() => {
    lastSecRef.current = Math.floor(seekBase);
  }, [seekBase]);

  useEffect(() => {
    const audio = getAudio();
    if (!audio) return;

    const readTime = () => {
      // seek/加载期间 audio.currentTime 不可信（已被重置为 0），跳过
      if (isLoadingRef.current) return;

      const ct = seekBaseRef.current + audio.currentTime;
      const dur = trackDurationRef.current;

      // 高频 DOM 回调（每帧）
      onTickRef.current?.(ct, dur);

      // 低频 setState（每整秒，用于歌词行切换）
      const sec = Math.floor(ct);
      if (sec !== lastSecRef.current) {
        lastSecRef.current = sec;
        setCurrentTime(ct);
      }
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
    const onLoadedMetadata = () => readTime();
    const onLoadStart = () => {
      isLoadingRef.current = true;
    };
    const onCanPlay = () => {
      isLoadingRef.current = false;
      // 新流就绪，立即用最新的 seekBase + audio.currentTime 刷新一次
      readTime();
      // 如果正在播放，重启 rAF 循环
      if (isPlayingRef.current) startRaf();
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("seeked", onSeeked);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("loadstart", onLoadStart);
    audio.addEventListener("canplay", onCanPlay);

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
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("loadstart", onLoadStart);
      audio.removeEventListener("canplay", onCanPlay);
    };
  }, []);

  return { currentTime, duration: trackDuration };
}
