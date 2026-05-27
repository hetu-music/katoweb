"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// ─── 类型 ─────────────────────────────────────────────────────────────────────

export interface PlayerTrack {
  songId: number;
  title: string;
  artist?: string | null;
  navId: string;
  lrcLyrics?: string | null;
}

export interface PlayerState {
  currentTrack: PlayerTrack | null;
  queue: PlayerTrack[];
  currentIndex: number;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  error: string | null;
}

export interface PlayerControls {
  play: (track: PlayerTrack) => void;
  enqueue: (track: PlayerTrack) => void;
  toggle: () => void;
  pause: () => void;
  jumpTo: (index: number) => void;
  prev: () => void;
  next: () => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
}

interface PlayerContextValue {
  state: PlayerState;
  controls: PlayerControls;
  /** 底部播放条是否展开可见 */
  playerVisible: boolean;
  setPlayerVisible: (v: boolean) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const PlayerContext = createContext<PlayerContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const retryCountRef = useRef(0);
  const currentNavIdRef = useRef<string | null>(null);
  const prevNavIdRef = useRef<string | null>(null);
  const wasLoadingRef = useRef(false);

  const [playerVisible, setPlayerVisible] = useState(false);

  const [state, setState] = useState<PlayerState>({
    currentTrack: null,
    queue: [],
    currentIndex: -1,
    isPlaying: false,
    isLoading: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    isMuted: false,
    error: null,
  });

  // ── 获取 stream URL ──────────────────────────────────────────────────────
  const fetchAndSetSrc = useCallback((navId: string, isRetry = false) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!isRetry) retryCountRef.current = 0;

    setState((s) => ({ ...s, isLoading: true, error: null }));

    fetch(`/api/navidrome/stream-url?songId=${encodeURIComponent(navId)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`stream-url error: ${r.status}`);
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
          err instanceof Error ? err.message : "获取播放地址失败，请稍后重试";
        setState((s) => ({ ...s, isLoading: false, error: msg }));
      });
  }, []);

  // ── 初始化 Audio，绑定事件（只执行一次） ─────────────────────────────────
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
    const onCanPlay = () =>
      setState((s) => ({ ...s, isLoading: false }));
    const onPlay = () =>
      setState((s) => ({ ...s, isPlaying: true }));
    const onPause = () =>
      setState((s) => ({ ...s, isPlaying: false }));
    const onEnded = () => {
      setState((s) => {
        const nextIndex = s.currentIndex + 1;
        if (nextIndex < s.queue.length) {
          const nextTrack = s.queue[nextIndex];
          currentNavIdRef.current = nextTrack.navId;
          return {
            ...s,
            currentIndex: nextIndex,
            currentTrack: nextTrack,
            isPlaying: false,
            currentTime: 0,
          };
        }
        return { ...s, isPlaying: false, currentTime: 0 };
      });
    };
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
      const isTokenError =
        err?.code === MediaError.MEDIA_ERR_NETWORK ||
        err?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED;
      if (isTokenError && retryCountRef.current < 1) {
        retryCountRef.current += 1;
        const id = currentNavIdRef.current;
        if (id) { fetchAndSetSrc(id, true); return; }
      }
      let msg = "播放失败，请稍后重试";
      if (err?.code === MediaError.MEDIA_ERR_NETWORK) msg = "网络错误，无法加载音频";
      if (err?.code === MediaError.MEDIA_ERR_DECODE) msg = "音频解码失败";
      if (err?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) msg = "不支持的音频格式或无权限";
      setState((s) => ({ ...s, isLoading: false, isPlaying: false, error: msg }));
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
    };
  }, [fetchAndSetSrc]);

  // ── currentTrack 变化时加载新 URL ────────────────────────────────────────
  useEffect(() => {
    const navId = state.currentTrack?.navId ?? null;
    if (!navId || navId === prevNavIdRef.current) return;
    prevNavIdRef.current = navId;
    currentNavIdRef.current = navId;
    fetchAndSetSrc(navId);
  }, [state.currentTrack?.navId, fetchAndSetSrc]);

  // ── 加载完成后自动播放 ────────────────────────────────────────────────────
  useEffect(() => {
    if (wasLoadingRef.current && !state.isLoading && state.currentTrack) {
      audioRef.current?.play().catch(() => {});
    }
    wasLoadingRef.current = state.isLoading;
  }, [state.isLoading, state.currentTrack]);

  // ── Controls ──────────────────────────────────────────────────────────────

  const play = useCallback((track: PlayerTrack) => {
    // 首次播放时自动展开播放条
    setPlayerVisible(true);
    setState((s) => {
      const existingIndex = s.queue.findIndex((t) => t.songId === track.songId);
      if (existingIndex !== -1) {
        return {
          ...s,
          currentIndex: existingIndex,
          currentTrack: s.queue[existingIndex],
        };
      }
      const newQueue = [...s.queue, track];
      const newIndex = newQueue.length - 1;
      return { ...s, queue: newQueue, currentIndex: newIndex, currentTrack: track };
    });
  }, []);

  const enqueue = useCallback((track: PlayerTrack) => {
    setState((s) => {
      if (s.queue.some((t) => t.songId === track.songId)) return s;
      return { ...s, queue: [...s.queue, track] };
    });
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() =>
        setState((s) => ({ ...s, error: "播放被浏览器阻止，请手动点击播放" })),
      );
    } else {
      audio.pause();
    }
  }, []);

  const pause = useCallback(() => { audioRef.current?.pause(); }, []);

  const jumpTo = useCallback((index: number) => {
    setState((s) => {
      if (index < 0 || index >= s.queue.length) return s;
      return { ...s, currentIndex: index, currentTrack: s.queue[index] };
    });
  }, []);

  const prev = useCallback(() => {
    setState((s) => {
      const i = s.currentIndex - 1;
      if (i < 0) return s;
      return { ...s, currentIndex: i, currentTrack: s.queue[i] };
    });
  }, []);

  const next = useCallback(() => {
    setState((s) => {
      const i = s.currentIndex + 1;
      if (i >= s.queue.length) return s;
      return { ...s, currentIndex: i, currentTrack: s.queue[i] };
    });
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setState((s) => {
      const newQueue = s.queue.filter((_, i) => i !== index);
      if (index === s.currentIndex) {
        audioRef.current?.pause();
        if (newQueue.length === 0) {
          return { ...s, queue: [], currentIndex: -1, currentTrack: null, isPlaying: false, currentTime: 0, duration: 0 };
        }
        const newIndex = Math.min(index, newQueue.length - 1);
        return { ...s, queue: newQueue, currentIndex: newIndex, currentTrack: newQueue[newIndex] };
      }
      const newIndex = index < s.currentIndex ? s.currentIndex - 1 : s.currentIndex;
      return { ...s, queue: newQueue, currentIndex: newIndex };
    });
  }, []);

  const clearQueue = useCallback(() => {
    audioRef.current?.pause();
    prevNavIdRef.current = null;
    setState((s) => ({
      ...s,
      queue: [],
      currentIndex: -1,
      currentTrack: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      error: null,
    }));
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

  const controls: PlayerControls = {
    play, enqueue, toggle, pause, jumpTo, prev, next,
    removeFromQueue, clearQueue, seek, setVolume, toggleMute,
  };

  return (
    <PlayerContext.Provider value={{ state, controls, playerVisible, setPlayerVisible }}>
      {children}
    </PlayerContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

export function formatPlayerTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function parseLrc(lrc: string): Array<{ time: number; text: string }> {
  const lines: Array<{ time: number; text: string }> = [];
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
