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
  coverUrl?: string | null;
}

/**
 * 播放器核心状态 — 不含高频更新的 currentTime / duration。
 * 时间数据通过 usePlayerTime() hook 单独订阅，避免每秒多次的全局重渲染。
 */
export interface PlayerState {
  currentTrack: PlayerTrack | null;
  queue: PlayerTrack[];
  currentIndex: number;
  isPlaying: boolean;
  isLoading: boolean;
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
  /** 直接读取音频元素的时间，不经过 React state，供 usePlayerTime 使用 */
  audioRef: React.RefObject<HTMLAudioElement | null>;
  /** 底部播放条是否展开可见 */
  playerVisible: boolean;
  setPlayerVisible: (v: boolean) => void;
  /** 歌词 map，由 PlayerContext 内部按需 fetch，外部只读 */
  lyricsMap: Map<number, string>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const PlayerContext = createContext<PlayerContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const retryCountRef = useRef(0);
  const currentSongIdRef = useRef<number | null>(null);
  const prevSongIdRef = useRef<number | null>(null);
  const wasLoadingRef = useRef(false);

  const [playerVisible, setPlayerVisible] = useState(false);
  const [lyricsMap, setLyricsMap] = useState<Map<number, string>>(new Map());

  const [state, setState] = useState<PlayerState>({
    currentTrack: null,
    queue: [],
    currentIndex: -1,
    isPlaying: false,
    isLoading: false,
    volume: 0.8,
    isMuted: false,
    error: null,
  });

  // ── 获取 stream URL ──────────────────────────────────────────────────────
  const fetchAndSetSrc = useCallback((songId: number, isRetry = false) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!isRetry) retryCountRef.current = 0;

    setState((s) => ({ ...s, isLoading: true, error: null }));

    fetch(`/api/navidrome/stream-url?songId=${encodeURIComponent(songId)}`)
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
          currentSongIdRef.current = nextTrack.songId;
          return { ...s, currentIndex: nextIndex, currentTrack: nextTrack, isPlaying: false };
        }
        return { ...s, isPlaying: false };
      });
    };
    // timeupdate / durationchange 不再写入 React state，由 usePlayerTime 直接读 audio 元素
    const onVolumeChange = () =>
      setState((s) => ({ ...s, volume: audio.volume, isMuted: audio.muted }));
    const onError = () => {
      const err = audio.error;
      const isTokenError =
        err?.code === MediaError.MEDIA_ERR_NETWORK ||
        err?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED;
      if (isTokenError && retryCountRef.current < 1) {
        retryCountRef.current += 1;
        const id = currentSongIdRef.current;
        if (id !== null) { fetchAndSetSrc(id, true); return; }
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
    audio.addEventListener("volumechange", onVolumeChange);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("loadstart", onLoadStart);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("volumechange", onVolumeChange);
      audio.removeEventListener("error", onError);
    };
  }, [fetchAndSetSrc]);

  // ── currentTrack 变化时加载新 URL ────────────────────────────────────────
  useEffect(() => {
    const songId = state.currentTrack?.songId ?? null;
    if (songId === null || songId === prevSongIdRef.current) return;
    prevSongIdRef.current = songId;
    currentSongIdRef.current = songId;
    fetchAndSetSrc(songId);
  }, [state.currentTrack?.songId, fetchAndSetSrc]);

  // ── 按需 fetch 当前曲目歌词 ───────────────────────────────────────────────
  useEffect(() => {
    const songId = state.currentTrack?.songId;
    if (!songId) return;
    if (lyricsMap.has(songId)) return;

    fetch(`/api/public/songs/${songId}/lyrics`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { lyrics: string | null } | null) => {
        if (!data?.lyrics) return;
        setLyricsMap((prev) => {
          if (prev.has(songId)) return prev;
          const next = new Map(prev);
          next.set(songId, data.lyrics!);
          return next;
        });
      })
      .catch(() => {/* 歌词加载失败不影响播放 */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentTrack?.songId]);

  // ── MediaSession：系统级媒体控制（锁屏、通知栏、蓝牙耳机等）────────────
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const { currentTrack, queue, currentIndex } = state;
    if (!currentTrack) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist ?? undefined,
      artwork: currentTrack.coverUrl
        ? [{ src: currentTrack.coverUrl, sizes: "512x512", type: "image/jpeg" }]
        : undefined,
    });

    const doSeek = (time: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = Math.max(0, Math.min(time, audio.duration || 0));
      // seek 后立即同步一次 positionState，让系统进度条即时响应
      try {
        navigator.mediaSession.setPositionState({
          duration: audio.duration || 0,
          playbackRate: audio.playbackRate,
          position: audio.currentTime,
        });
      } catch { /* ignore */ }
    };

    navigator.mediaSession.setActionHandler("play", () => {
      audioRef.current?.play().catch(() => {});
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      audioRef.current?.pause();
    });
    navigator.mediaSession.setActionHandler("previoustrack", currentIndex > 0 ? () => {
      setState((s) => {
        const i = s.currentIndex - 1;
        if (i < 0) return s;
        return { ...s, currentIndex: i, currentTrack: s.queue[i] };
      });
    } : null);
    navigator.mediaSession.setActionHandler("nexttrack", currentIndex < queue.length - 1 ? () => {
      setState((s) => {
        const i = s.currentIndex + 1;
        if (i >= s.queue.length) return s;
        return { ...s, currentIndex: i, currentTrack: s.queue[i] };
      });
    } : null);
    navigator.mediaSession.setActionHandler("seekbackward", (d) => {
      const audio = audioRef.current;
      if (!audio) return;
      doSeek(audio.currentTime - (d.seekOffset ?? 10));
    });
    navigator.mediaSession.setActionHandler("seekforward", (d) => {
      const audio = audioRef.current;
      if (!audio) return;
      doSeek(audio.currentTime + (d.seekOffset ?? 10));
    });
    navigator.mediaSession.setActionHandler("seekto", (d) => {
      if (d.seekTime != null) doSeek(d.seekTime);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentTrack, state.currentIndex, state.queue.length]);

  // ── MediaSession：同步播放状态 ────────────────────────────────────────────
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = state.isPlaying ? "playing" : "paused";
  }, [state.isPlaying]);

  // ── MediaSession：用 timeupdate 持续同步进度条 ───────────────────────────
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;

    const syncPosition = () => {
      const audio = audioRef.current;
      if (!audio || !audio.duration) return;
      try {
        navigator.mediaSession.setPositionState({
          duration: audio.duration,
          playbackRate: audio.playbackRate,
          position: Math.min(audio.currentTime, audio.duration),
        });
      } catch { /* ignore */ }
    };

    // 等待 audio 就绪
    const bind = () => {
      const audio = audioRef.current;
      if (!audio) { setTimeout(bind, 100); return; }
      audio.addEventListener("timeupdate", syncPosition);
      audio.addEventListener("seeked", syncPosition);
    };
    bind();

    return () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.removeEventListener("timeupdate", syncPosition);
      audio.removeEventListener("seeked", syncPosition);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 加载完成后自动播放 ────────────────────────────────────────────────────
  useEffect(() => {
    if (wasLoadingRef.current && !state.isLoading && state.currentTrack && !state.error) {
      audioRef.current?.play().catch(() => {});
    }
    wasLoadingRef.current = state.isLoading;
  }, [state.isLoading, state.currentTrack, state.error]);

  // ── Controls ──────────────────────────────────────────────────────────────

  const play = useCallback((track: PlayerTrack) => {
    setPlayerVisible(true);
    setState((s) => {
      const existingIndex = s.queue.findIndex((t) => t.songId === track.songId);
      if (existingIndex !== -1) {
        return { ...s, currentIndex: existingIndex, currentTrack: s.queue[existingIndex] };
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
          prevSongIdRef.current = null;
          currentSongIdRef.current = null;
          return { ...s, queue: [], currentIndex: -1, currentTrack: null, isPlaying: false };
        }
        const newIndex = Math.min(index, newQueue.length - 1);
        prevSongIdRef.current = null;
        return { ...s, queue: newQueue, currentIndex: newIndex, currentTrack: newQueue[newIndex] };
      }
      const newIndex = index < s.currentIndex ? s.currentIndex - 1 : s.currentIndex;
      return { ...s, queue: newQueue, currentIndex: newIndex };
    });
  }, []);

  const clearQueue = useCallback(() => {
    audioRef.current?.pause();
    prevSongIdRef.current = null;
    setState((s) => ({
      ...s,
      queue: [],
      currentIndex: -1,
      currentTrack: null,
      isPlaying: false,
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
    <PlayerContext.Provider value={{ state, controls, audioRef, playerVisible, setPlayerVisible, lyricsMap }}>
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

/**
 * 订阅播放进度的专用 hook。
 *
 * 用 requestAnimationFrame 循环直读 audio.currentTime，实现约 60fps 的平滑更新。
 * 暂停时自动降级为 timeupdate 事件驱动，避免空转消耗 CPU。
 * 不经过 PlayerProvider 的 state，只有 GlobalPlayer 会重渲染。
 */
export function usePlayerTime(): { currentTime: number; duration: number } {
  const { audioRef } = usePlayer();
  const [time, setTime] = useState({ currentTime: 0, duration: 0 });
  const rafIdRef = useRef<number>(0);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    let bound = false;

    const readTime = () => {
      const audio = audioRef.current;
      if (!audio) return;
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
      readTime(); // 暂停时同步一次最终位置
    };
    // seeked / durationchange 无论播放状态都需要立即同步
    const onSeeked = () => readTime();
    const onDurationChange = () => readTime();

    const bind = () => {
      const audio = audioRef.current;
      if (!audio) return false;
      bound = true;

      audio.addEventListener("play", onPlay);
      audio.addEventListener("pause", onPause);
      audio.addEventListener("seeked", onSeeked);
      audio.addEventListener("durationchange", onDurationChange);

      // 如果 audio 已经在播放（hook 晚于 audio 挂载），立即启动 rAF
      if (!audio.paused) {
        isPlayingRef.current = true;
        startRaf();
      } else {
        readTime(); // 同步初始状态
      }
      return true;
    };

    if (!bind()) {
      const timer = setTimeout(() => bind(), 100);
      return () => clearTimeout(timer);
    }

    return () => {
      cancelAnimationFrame(rafIdRef.current);
      if (bound) {
        const audio = audioRef.current;
        if (!audio) return;
        audio.removeEventListener("play", onPlay);
        audio.removeEventListener("pause", onPause);
        audio.removeEventListener("seeked", onSeeked);
        audio.removeEventListener("durationchange", onDurationChange);
      }
    };
  }, [audioRef]);

  return time;
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
