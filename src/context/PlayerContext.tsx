"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export interface PlayerTrack {
  /** 本站歌曲 ID（数据库 ID，用于去重和标识） */
  songId: number;
  /** 歌曲标题 */
  title: string;
  /** 演唱者 */
  artist?: string | null;
  /** Navidrome 歌曲 ID */
  navId: string;
  /** LRC 格式歌词（可选） */
  lrcLyrics?: string | null;
}

export interface PlayerState {
  /** 当前播放曲目 */
  currentTrack: PlayerTrack | null;
  /** 播放队列 */
  queue: PlayerTrack[];
  /** 当前队列索引 */
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
  /** 播放指定曲目（如果已在队列中则跳转，否则替换队列） */
  play: (track: PlayerTrack) => void;
  /** 将曲目加入队列末尾（如果已存在则不重复添加） */
  enqueue: (track: PlayerTrack) => void;
  /** 播放/暂停切换 */
  toggle: () => void;
  /** 暂停 */
  pause: () => void;
  /** 跳转到队列中指定索引 */
  jumpTo: (index: number) => void;
  /** 上一首 */
  prev: () => void;
  /** 下一首 */
  next: () => void;
  /** 从队列中移除指定索引 */
  removeFromQueue: (index: number) => void;
  /** 清空队列 */
  clearQueue: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
}

interface PlayerContextValue {
  state: PlayerState;
  controls: PlayerControls;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const retryCountRef = useRef(0);
  const currentNavIdRef = useRef<string | null>(null);

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

  // 获取 stream URL 并赋给 audio
  const fetchAndSetSrc = useCallback((navId: string, isRetry = false) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!isRetry) retryCountRef.current = 0;

    setState((s) => ({ ...s, isLoading: true, error: null }));

    fetch(`/api/navidrome/stream-url?songId=${encodeURIComponent(navId)}`)
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
          err instanceof Error ? err.message : "获取播放地址失败，请稍后重试";
        setState((s) => ({ ...s, isLoading: false, error: msg }));
      });
  }, []);

  // 初始化 Audio 元素，绑定事件（只执行一次）
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
    const onEnded = () => {
      setState((s) => {
        // 自动播放下一首
        const nextIndex = s.currentIndex + 1;
        if (nextIndex < s.queue.length) {
          return { ...s, isPlaying: false, currentTime: 0 };
          // 实际跳转在 effect 里处理
        }
        return { ...s, isPlaying: false, currentTime: 0 };
      });
      // 自动下一首
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
        return s;
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
        const currentId = currentNavIdRef.current;
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
    };
  }, [fetchAndSetSrc]);

  // 当 currentTrack 变化时，加载新的 stream URL 并自动播放
  const prevNavIdRef = useRef<string | null>(null);
  useEffect(() => {
    const navId = state.currentTrack?.navId ?? null;
    if (!navId || navId === prevNavIdRef.current) return;
    prevNavIdRef.current = navId;
    currentNavIdRef.current = navId;
    fetchAndSetSrc(navId);
  }, [state.currentTrack?.navId, fetchAndSetSrc]);

  // 加载完成后自动播放（isLoading 从 true 变 false 且有 currentTrack）
  const wasLoadingRef = useRef(false);
  useEffect(() => {
    if (wasLoadingRef.current && !state.isLoading && state.currentTrack) {
      audioRef.current?.play().catch(() => {});
    }
    wasLoadingRef.current = state.isLoading;
  }, [state.isLoading, state.currentTrack]);

  // Controls
  const play = useCallback((track: PlayerTrack) => {
    setState((s) => {
      const existingIndex = s.queue.findIndex((t) => t.songId === track.songId);
      if (existingIndex !== -1) {
        // 已在队列中，直接跳转
        return {
          ...s,
          currentIndex: existingIndex,
          currentTrack: s.queue[existingIndex],
        };
      }
      // 不在队列中：加入队列末尾并跳转
      const newQueue = [...s.queue, track];
      const newIndex = newQueue.length - 1;
      return {
        ...s,
        queue: newQueue,
        currentIndex: newIndex,
        currentTrack: track,
      };
    });
  }, []);

  const enqueue = useCallback((track: PlayerTrack) => {
    setState((s) => {
      const exists = s.queue.some((t) => t.songId === track.songId);
      if (exists) return s;
      return { ...s, queue: [...s.queue, track] };
    });
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {
        setState((s) => ({ ...s, error: "播放被浏览器阻止，请手动点击播放" }));
      });
    } else {
      audio.pause();
    }
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const jumpTo = useCallback((index: number) => {
    setState((s) => {
      if (index < 0 || index >= s.queue.length) return s;
      return {
        ...s,
        currentIndex: index,
        currentTrack: s.queue[index],
      };
    });
  }, []);

  const prev = useCallback(() => {
    setState((s) => {
      const prevIndex = s.currentIndex - 1;
      if (prevIndex < 0) return s;
      return {
        ...s,
        currentIndex: prevIndex,
        currentTrack: s.queue[prevIndex],
      };
    });
  }, []);

  const next = useCallback(() => {
    setState((s) => {
      const nextIndex = s.currentIndex + 1;
      if (nextIndex >= s.queue.length) return s;
      return {
        ...s,
        currentIndex: nextIndex,
        currentTrack: s.queue[nextIndex],
      };
    });
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setState((s) => {
      const newQueue = s.queue.filter((_, i) => i !== index);
      let newIndex = s.currentIndex;
      let newTrack = s.currentTrack;

      if (index === s.currentIndex) {
        // 删除当前播放的曲目
        audioRef.current?.pause();
        if (newQueue.length === 0) {
          return {
            ...s,
            queue: [],
            currentIndex: -1,
            currentTrack: null,
            isPlaying: false,
            currentTime: 0,
            duration: 0,
          };
        }
        newIndex = Math.min(index, newQueue.length - 1);
        newTrack = newQueue[newIndex];
      } else if (index < s.currentIndex) {
        newIndex = s.currentIndex - 1;
      }

      return {
        ...s,
        queue: newQueue,
        currentIndex: newIndex,
        currentTrack: newTrack,
      };
    });
  }, []);

  const clearQueue = useCallback(() => {
    audioRef.current?.pause();
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
    prevNavIdRef.current = null;
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
  };

  return (
    <PlayerContext.Provider value={{ state, controls }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}

export function formatPlayerTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
