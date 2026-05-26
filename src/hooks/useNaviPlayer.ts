"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface NaviPlayerState {
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  error: string | null;
}

export interface NaviPlayerControls {
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
}

export function useNaviPlayer(
  songNavId: string | null,
): [
  NaviPlayerState,
  NaviPlayerControls,
  React.RefObject<HTMLAudioElement | null>,
] {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // 错误重试计数：每首歌最多自动重试一次（应对 token 过期场景）
  const retryCountRef = useRef(0);
  // 追踪当前 songNavId，供 onError 闭包读取
  const songNavIdRef = useRef<string | null>(null);
  const [state, setState] = useState<NaviPlayerState>({
    isPlaying: false,
    isLoading: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    isMuted: false,
    error: null,
  });

  // 向服务端获取 stream URL 并赋给 audio.src
  // isRetry=true 时跳过重置 retryCount，避免递归
  const fetchAndSetSrc = useCallback(
    (id: string, isRetry = false) => {
      const audio = audioRef.current;
      if (!audio) return;

      if (!isRetry) retryCountRef.current = 0;

      setState((s) => ({ ...s, isLoading: true, error: null }));

      fetch(`/api/navidrome/stream-url?songId=${encodeURIComponent(id)}`)
        .then((r) => {
          if (!r.ok) throw new Error(`stream-url API error: ${r.status}`);
          return r.json() as Promise<{ url?: string; error?: string }>;
        })
        .then(({ url, error }) => {
          if (!url) throw new Error(error ?? "未获取到播放地址");
          audio.pause();
          audio.src = url;
          audio.load();
          setState((s) => ({
            ...s,
            isLoading: false,
            isPlaying: false,
            currentTime: 0,
            duration: 0,
            error: null,
          }));
        })
        .catch((err: unknown) => {
          const msg =
            err instanceof Error
              ? err.message
              : "获取播放地址失败，请稍后重试";
          setState((s) => ({ ...s, isLoading: false, error: msg }));
        });
    },
    [],
  );

  // 初始化 audio 元素，绑定所有事件
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "metadata";
      audioRef.current.volume = 0.8;
    }
    const audio = audioRef.current;

    const onLoadStart = () =>
      setState((s) => ({ ...s, isLoading: true, error: null }));
    const onCanPlay = () => setState((s) => ({ ...s, isLoading: false }));
    const onPlay = () => setState((s) => ({ ...s, isPlaying: true }));
    const onPause = () => setState((s) => ({ ...s, isPlaying: false }));
    const onEnded = () =>
      setState((s) => ({ ...s, isPlaying: false, currentTime: 0 }));
    const onTimeUpdate = () =>
      setState((s) => ({ ...s, currentTime: audio.currentTime }));
    const onDurationChange = () =>
      setState((s) => ({
        ...s,
        duration: isFinite(audio.duration) ? audio.duration : 0,
      }));
    const onVolumeChange = () =>
      setState((s) => ({ ...s, volume: audio.volume, isMuted: audio.muted }));
    const onError = () => {
      const err = audio.error;

      // MEDIA_ERR_NETWORK 或 SRC_NOT_SUPPORTED 可能是 token 过期，尝试重新获取 URL
      const isTokenError =
        err?.code === MediaError.MEDIA_ERR_NETWORK ||
        err?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED;

      if (isTokenError && retryCountRef.current < 1) {
        retryCountRef.current += 1;
        const currentId = songNavIdRef.current;
        if (currentId) {
          fetchAndSetSrc(currentId, true);
          return;
        }
      }

      let msg = "播放失败，请稍后重试";
      if (err?.code === MediaError.MEDIA_ERR_NETWORK)
        msg = "网络错误，无法加载音频";
      if (err?.code === MediaError.MEDIA_ERR_DECODE) msg = "音频解码失败";
      if (err?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED)
        msg = "不支持的音频格式或无权限";
      setState((s) => ({
        ...s,
        isLoading: false,
        isPlaying: false,
        error: msg,
      }));
    };

    audio.addEventListener("loadstart", onLoadStart);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("volumechange", onVolumeChange);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("loadstart", onLoadStart);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("volumechange", onVolumeChange);
      audio.removeEventListener("error", onError);
      audio.pause();
      audio.src = "";
    };
  }, []);

  // 当 songNavId 变化时，向服务端请求 stream URL，再赋给 audio.src
  useEffect(() => {
    songNavIdRef.current = songNavId;
    if (!songNavId) return;
    fetchAndSetSrc(songNavId);
  }, [songNavId, fetchAndSetSrc]);

  const play = useCallback(() => {
    audioRef.current?.play().catch(() => {
      setState((s) => ({
        ...s,
        error: "播放被浏览器阻止，请手动点击播放",
      }));
    });
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {
        setState((s) => ({
          ...s,
          error: "播放被浏览器阻止，请手动点击播放",
        }));
      });
    } else {
      audio.pause();
    }
  }, []);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(time, audio.duration || 0));
  }, []);

  const setVolume = useCallback((vol: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = Math.max(0, Math.min(1, vol));
    if (vol > 0) audio.muted = false;
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
  }, []);

  return [state, { play, pause, toggle, seek, setVolume, toggleMute }, audioRef];
}

export function formatPlayerTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
