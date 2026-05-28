"use client";

import { create } from "zustand";
import { getAudio } from "@/lib/audio-engine";

// ─── 类型 ─────────────────────────────────────────────────────────────────────

export interface PlayerTrack {
  songId: number;
  title: string;
  artist?: string | null;
  coverUrl?: string | null;
}

export interface PlayerState {
  currentTrack: PlayerTrack | null;
  queue: PlayerTrack[];
  currentIndex: number;
  isPlaying: boolean;
  isLoading: boolean;
  volume: number;
  isMuted: boolean;
  error: string | null;
  playerVisible: boolean;
  lyricsMap: Map<number, string>;
}

export interface PlayerActions {
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
  setPlayerVisible: (v: boolean) => void;
  /** 内部：audio 事件回调用 */
  _setPlaying: (v: boolean) => void;
  _setLoading: (v: boolean) => void;
  _setError: (msg: string | null) => void;
  _setVolumeState: (volume: number, isMuted: boolean) => void;
  _onEnded: () => void;
  _addLyrics: (songId: number, lyrics: string) => void;
  /** 内部：stream-url fetch */
  _fetchAndSetSrc: (songId: number, isRetry?: boolean) => void;
}

// ─── 内部可变 refs（不放 store，避免触发订阅） ────────────────────────────────

/** 竞态锁：当前正在加载的 songId */
let _loadingTrackId: number | null = null;
/** 重试计数 */
let _retryCount = 0;
/** 播放意图：canplay 时是否自动播放 */
let _shouldPlayAfterLoad = false;

// ─── 工具 ─────────────────────────────────────────────────────────────────────

function safePlay() {
  const audio = getAudio();
  if (!audio) return;
  const promise = audio.play();
  if (promise !== undefined) {
    promise.catch((err: Error) => {
      if (err.name !== "AbortError") {
        console.warn("[Player] play() failed:", err.message);
        if (err.name === "NotAllowedError") {
          usePlayerStore.getState()._setError(
            "播放被浏览器阻止，请手动点击播放",
          );
          usePlayerStore.getState()._setPlaying(false);
        }
      }
    });
  }
}

function syncUnlockAudio() {
  const audio = getAudio();
  if (!audio) return;
  const promise = audio.play();
  if (promise !== undefined) {
    promise
      .then(() => audio.pause())
      .catch((_err: unknown) => {
        /* iOS unlock: ignore */
      });
  }
}

function syncMediaSessionPosition() {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator))
    return;
  const audio = getAudio();
  if (!audio || !audio.duration || isNaN(audio.duration)) return;
  try {
    navigator.mediaSession.setPositionState({
      duration: audio.duration,
      playbackRate: audio.playbackRate,
      position: Math.min(audio.currentTime, audio.duration),
    });
  } catch {
    /* ignore */
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const usePlayerStore = create<PlayerState & PlayerActions>((set, get) => ({
  // ── 初始状态 ──────────────────────────────────────────────────────────────
  currentTrack: null,
  queue: [],
  currentIndex: -1,
  isPlaying: false,
  isLoading: false,
  volume: 0.8,
  isMuted: false,
  error: null,
  playerVisible: false,
  lyricsMap: new Map(),

  // ── 内部 setters ──────────────────────────────────────────────────────────
  _setPlaying: (v) => set({ isPlaying: v }),
  _setLoading: (v) => set({ isLoading: v }),
  _setError: (msg) => set({ error: msg }),
  _setVolumeState: (volume, isMuted) => set({ volume, isMuted }),
  _addLyrics: (songId, lyrics) =>
    set((s) => {
      if (s.lyricsMap.has(songId)) return s;
      const next = new Map(s.lyricsMap);
      next.set(songId, lyrics);
      return { lyricsMap: next };
    }),

  _onEnded: () => {
    const s = get();
    const nextIndex = s.currentIndex + 1;
    if (nextIndex < s.queue.length) {
      const nextTrack = s.queue[nextIndex];
      _shouldPlayAfterLoad = true;
      _loadingTrackId = nextTrack.songId;
      set({
        currentIndex: nextIndex,
        currentTrack: nextTrack,
        isPlaying: true,
        isLoading: true,
      });
      get()._fetchAndSetSrc(nextTrack.songId);
    } else {
      _shouldPlayAfterLoad = false;
      set({ isPlaying: false });
    }
  },

  // ── stream-url fetch ──────────────────────────────────────────────────────
  _fetchAndSetSrc: (songId, isRetry = false) => {
    const audio = getAudio();
    if (!audio) return;

    if (!isRetry) {
      _retryCount = 0;
      _loadingTrackId = songId;
    }

    set({ isLoading: true, error: null });

    fetch(`/api/navidrome/stream-url?songId=${encodeURIComponent(songId)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`stream-url error: ${r.status}`);
        return r.json() as Promise<{ url?: string; error?: string }>;
      })
      .then(({ url, error }) => {
        if (songId !== _loadingTrackId) return;
        if (!url) throw new Error(error ?? "未获取到播放地址");

        audio.pause();
        audio.src = url;
        audio.load();

        set({ isLoading: false, error: null });
      })
      .catch((err: unknown) => {
        if (songId !== _loadingTrackId) return;
        const msg =
          err instanceof Error ? err.message : "获取播放地址失败，请稍后重试";
        _shouldPlayAfterLoad = false;
        set({ isLoading: false, isPlaying: false, error: msg });
      });
  },

  // ── setPlayerVisible ──────────────────────────────────────────────────────
  setPlayerVisible: (v) => set({ playerVisible: v }),

  // ── Controls ──────────────────────────────────────────────────────────────
  play: (track) => {
    set({ playerVisible: true });
    syncUnlockAudio();
    _shouldPlayAfterLoad = true;

    const s = get();
    const existingIndex = s.queue.findIndex((t) => t.songId === track.songId);

    if (existingIndex !== -1) {
      if (s.currentTrack?.songId === track.songId) {
        safePlay();
        set({ isPlaying: true });
        return;
      }
      _loadingTrackId = s.queue[existingIndex].songId;
      set({
        currentIndex: existingIndex,
        currentTrack: s.queue[existingIndex],
        isPlaying: true,
        isLoading: true,
      });
      get()._fetchAndSetSrc(s.queue[existingIndex].songId);
      return;
    }

    const newQueue = [...s.queue, track];
    const newIndex = newQueue.length - 1;
    _loadingTrackId = track.songId;
    set({
      queue: newQueue,
      currentIndex: newIndex,
      currentTrack: track,
      isPlaying: true,
      isLoading: true,
    });
    get()._fetchAndSetSrc(track.songId);
  },

  enqueue: (track) => {
    set((s) => {
      if (s.queue.some((t) => t.songId === track.songId)) return s;
      return { queue: [...s.queue, track] };
    });
  },

  toggle: () => {
    const audio = getAudio();
    if (!audio) return;
    if (audio.paused) {
      _shouldPlayAfterLoad = true;
      safePlay();
    } else {
      _shouldPlayAfterLoad = false;
      audio.pause();
    }
  },

  pause: () => {
    _shouldPlayAfterLoad = false;
    getAudio()?.pause();
  },

  jumpTo: (index) => {
    const s = get();
    if (index < 0 || index >= s.queue.length) return;
    _shouldPlayAfterLoad = s.isPlaying;
    const track = s.queue[index];
    _loadingTrackId = track.songId;
    set({ currentIndex: index, currentTrack: track, isLoading: true });
    get()._fetchAndSetSrc(track.songId);
  },

  prev: () => {
    syncUnlockAudio();
    const s = get();
    const i = s.currentIndex - 1;
    if (i < 0) return;
    _shouldPlayAfterLoad = s.isPlaying;
    const track = s.queue[i];
    _loadingTrackId = track.songId;
    set({ currentIndex: i, currentTrack: track, isLoading: true });
    get()._fetchAndSetSrc(track.songId);
  },

  next: () => {
    syncUnlockAudio();
    const s = get();
    const i = s.currentIndex + 1;
    if (i >= s.queue.length) return;
    _shouldPlayAfterLoad = s.isPlaying;
    const track = s.queue[i];
    _loadingTrackId = track.songId;
    set({ currentIndex: i, currentTrack: track, isLoading: true });
    get()._fetchAndSetSrc(track.songId);
  },

  removeFromQueue: (index) => {
    const s = get();
    const newQueue = s.queue.filter((_, i) => i !== index);

    if (index === s.currentIndex) {
      getAudio()?.pause();
      if (newQueue.length === 0) {
        _loadingTrackId = null;
        _shouldPlayAfterLoad = false;
        set({
          queue: [],
          currentIndex: -1,
          currentTrack: null,
          isPlaying: false,
        });
        return;
      }
      const newIndex = Math.min(index, newQueue.length - 1);
      _loadingTrackId = null;
      _shouldPlayAfterLoad = false;
      set({
        queue: newQueue,
        currentIndex: newIndex,
        currentTrack: newQueue[newIndex],
        isLoading: true,
      });
      get()._fetchAndSetSrc(newQueue[newIndex].songId);
      return;
    }

    const newIndex =
      index < s.currentIndex ? s.currentIndex - 1 : s.currentIndex;
    set({ queue: newQueue, currentIndex: newIndex });
  },

  clearQueue: () => {
    getAudio()?.pause();
    _loadingTrackId = null;
    _shouldPlayAfterLoad = false;
    set({
      queue: [],
      currentIndex: -1,
      currentTrack: null,
      isPlaying: false,
      error: null,
    });
  },

  seek: (time) => {
    const audio = getAudio();
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(time, audio.duration || 0));
  },

  setVolume: (vol) => {
    const audio = getAudio();
    if (!audio) return;
    audio.volume = Math.max(0, Math.min(1, vol));
    if (vol > 0) audio.muted = false;
  },

  toggleMute: () => {
    const audio = getAudio();
    if (!audio) return;
    audio.muted = !audio.muted;
  },
}));

// ─── Audio 事件绑定（模块加载时执行一次） ─────────────────────────────────────
// 在浏览器环境下，模块首次 import 时绑定，之后永不解绑。

if (typeof window !== "undefined") {
  // 延迟到下一个 tick，确保 store 已完全初始化
  setTimeout(() => {
    const audio = getAudio();
    if (!audio) return;

    audio.addEventListener("loadstart", () => {
      usePlayerStore.getState()._setLoading(true);
      usePlayerStore.getState()._setError(null);
    });

    audio.addEventListener("canplay", () => {
      usePlayerStore.getState()._setLoading(false);
      if (_shouldPlayAfterLoad) safePlay();
    });

    audio.addEventListener("play", () =>
      usePlayerStore.getState()._setPlaying(true),
    );
    audio.addEventListener("pause", () =>
      usePlayerStore.getState()._setPlaying(false),
    );
    audio.addEventListener("ended", () =>
      usePlayerStore.getState()._onEnded(),
    );
    audio.addEventListener("volumechange", () => {
      usePlayerStore
        .getState()
        ._setVolumeState(audio.volume, audio.muted);
    });

    audio.addEventListener("error", () => {
      const err = audio.error;
      const isNetworkError =
        err?.code === MediaError.MEDIA_ERR_NETWORK ||
        err?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED;

      if (isNetworkError && _retryCount < 1) {
        _retryCount += 1;
        if (_loadingTrackId !== null) {
          usePlayerStore.getState()._fetchAndSetSrc(_loadingTrackId, true);
          return;
        }
      }

      let msg = "播放失败，请稍后重试";
      if (err?.code === MediaError.MEDIA_ERR_NETWORK)
        msg = "网络错误，无法加载音频";
      if (err?.code === MediaError.MEDIA_ERR_DECODE) msg = "音频解码失败";
      if (err?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED)
        msg = "不支持的音频格式或无权限";

      _shouldPlayAfterLoad = false;
      usePlayerStore.getState()._setLoading(false);
      usePlayerStore.getState()._setPlaying(false);
      usePlayerStore.getState()._setError(msg);
    });

    // MediaSession 进度同步
    audio.addEventListener("timeupdate", syncMediaSessionPosition);
    audio.addEventListener("seeked", syncMediaSessionPosition);
    audio.addEventListener("durationchange", syncMediaSessionPosition);
    audio.addEventListener("loadedmetadata", syncMediaSessionPosition);
    audio.addEventListener("ratechange", syncMediaSessionPosition);
  }, 0);
}

// ─── MediaSession 元数据 & 控制（订阅 store 变化） ───────────────────────────

if (typeof window !== "undefined") {
  usePlayerStore.subscribe((state, prev) => {
    if (
      state.currentTrack === prev.currentTrack &&
      state.currentIndex === prev.currentIndex &&
      state.queue.length === prev.queue.length &&
      state.isPlaying === prev.isPlaying
    )
      return;

    if (!("mediaSession" in navigator)) return;

    const { currentTrack, currentIndex, queue, isPlaying } = state;

    // 同步播放状态
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";

    if (!currentTrack) return;

    // 同步元数据
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist ?? undefined,
      artwork: currentTrack.coverUrl
        ? [{ src: currentTrack.coverUrl, sizes: "512x512", type: "image/jpeg" }]
        : undefined,
    });

    // 同步控制按钮
    const doSeek = (time: number) => {
      const audio = getAudio();
      if (!audio) return;
      audio.currentTime = Math.max(0, Math.min(time, audio.duration || 0));
      syncMediaSessionPosition();
    };

    navigator.mediaSession.setActionHandler("play", () => {
      _shouldPlayAfterLoad = true;
      safePlay();
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      _shouldPlayAfterLoad = false;
      getAudio()?.pause();
    });
    navigator.mediaSession.setActionHandler(
      "previoustrack",
      currentIndex > 0
        ? () => {
            syncUnlockAudio();
            usePlayerStore.getState().prev();
          }
        : null,
    );
    navigator.mediaSession.setActionHandler(
      "nexttrack",
      currentIndex < queue.length - 1
        ? () => {
            syncUnlockAudio();
            usePlayerStore.getState().next();
          }
        : null,
    );
    navigator.mediaSession.setActionHandler("seekbackward", (d) => {
      const audio = getAudio();
      if (!audio) return;
      doSeek(audio.currentTime - (d.seekOffset ?? 10));
    });
    navigator.mediaSession.setActionHandler("seekforward", (d) => {
      const audio = getAudio();
      if (!audio) return;
      doSeek(audio.currentTime + (d.seekOffset ?? 10));
    });
    navigator.mediaSession.setActionHandler("seekto", (d) => {
      if (d.seekTime != null) doSeek(d.seekTime);
    });
  });
}

// ─── 歌词自动 fetch（订阅 currentTrack 变化） ────────────────────────────────

if (typeof window !== "undefined") {
  usePlayerStore.subscribe((state, prev) => {
    const songId = state.currentTrack?.songId;
    if (!songId || songId === prev.currentTrack?.songId) return;
    if (state.lyricsMap.has(songId)) return;

    fetch(`/api/public/songs/${songId}/lyrics`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { lyrics: string | null } | null) => {
        if (!data?.lyrics) return;
        usePlayerStore.getState()._addLyrics(songId, data.lyrics);
      })
      .catch(() => {
        /* 歌词加载失败不影响播放 */
      });
  });
}
