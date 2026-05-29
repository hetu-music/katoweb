"use client";

import { useEffect, useRef, useState } from "react";
import { getAudio } from "@/lib/audio-engine";
import { usePlayerStore } from "@/store/player-store";

/**
 * 订阅播放进度的专用 hook。
 * 用 requestAnimationFrame 循环直读 audio.currentTime，约 60fps 平滑更新。
 * 暂停时自动降级为事件驱动，避免空转消耗 CPU。
 *
 * opus 流没有 Content-Length，audio.duration 为 Infinity，
 * 因此 duration 从 store.trackDuration 读取（由 getSong API 提供），
 * currentTime 为 store.seekBase + audio.currentTime。
 *
 * seekBase 用 ref 读取，避免 seekBase 变化时重新绑定事件导致闪烁。
 */
export function usePlayerTime(): { currentTime: number; duration: number } {
  const trackDuration = usePlayerStore((s) => s.trackDuration);
  const seekBase = usePlayerStore((s) => s.seekBase);

  // 用 ref 持有最新 seekBase，rAF 回调里直接读 ref，不触发重新绑定
  const seekBaseRef = useRef(seekBase);
  useEffect(() => {
    seekBaseRef.current = seekBase;
  }, [seekBase]);

  const [currentTime, setCurrentTime] = useState(seekBase);
  const rafIdRef = useRef<number>(0);
  const isPlayingRef = useRef(false);

  // seekBase 变化时立即同步 currentTime，避免进度条跳回 0
  // 用 useState 存上一次的 seekBase，在渲染期间比较并更新（React 官方推荐的 derived state 模式）
  const [prevSeekBase, setPrevSeekBase] = useState(seekBase);
  if (prevSeekBase !== seekBase) {
    setPrevSeekBase(seekBase);
    setCurrentTime(seekBase);
  }

  useEffect(() => {
    const audio = getAudio();
    if (!audio) return;

    const readTime = () => {
      const ct = seekBaseRef.current + audio.currentTime;
      setCurrentTime((prev) => (prev === ct ? prev : ct));
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

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("seeked", onSeeked);
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
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  // 只在挂载时绑定一次，seekBase 通过 ref 读取
  }, []);

  return { currentTime, duration: trackDuration };
}
