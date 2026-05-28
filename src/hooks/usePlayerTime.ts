"use client";

import { useEffect, useRef, useState } from "react";
import { getAudio } from "@/lib/audio-engine";

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
