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

  /**
   * 竞态锁：记录当前"正在加载"的 songId。
   * 当网络请求返回时，若当前值已改变（用户快速切歌），则直接丢弃旧的返回结果。
   */
  const loadingTrackIdRef = useRef<number | null>(null);
  const retryCountRef = useRef(0);

  /**
   * 播放意图：记录加载完成后是否应该自动播放。
   * 取代了脆弱的 wasLoadingRef 方案，以状态驱动替代时间窗口判定。
   *   - 用户点击播放 → true
   *   - 用户暂停后切歌 → false（新歌加载完保持暂停）
   *   - onEnded 自动切下一首 → true
   */
  const shouldPlayAfterLoadRef = useRef(false);

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

  // ── 工具：安全播放（优雅处理 Play Promise 被打断/拦截的异常） ────────────
  /**
   * audio.play() 返回一个 Promise。
   * 若在 resolve 之前调用了 pause()，浏览器会抛出：
   *   "DOMException: The play() request was interrupted by a call to pause()"
   * 这是完全正常的浏览器行为，不应让它造成播放器卡死。
   */
  const safePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const promise = audio.play();
    if (promise !== undefined) {
      promise.catch((err: Error) => {
        // AbortError = 被 pause() 打断，正常行为，忽略
        // NotAllowedError = 浏览器阻止自动播放
        if (err.name !== "AbortError") {
          console.warn("[Player] play() failed:", err.message);
          if (err.name === "NotAllowedError") {
            setState((s) => ({
              ...s,
              isPlaying: false,
              error: "播放被浏览器阻止，请手动点击播放",
            }));
          }
        }
      });
    }
  }, []);

  /**
   * iOS/Safari 解锁技术：在同步交互上下文中激活 Audio 对象。
   * iOS Safari 只允许在直接由用户手势触发的同步代码中调用 play()，
   * 此后该 Audio 实例在本次页面生命周期内永久解锁，后续异步 play() 不会被拦截。
   */
  const syncUnlockAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    // 瞬时同步激活，不产生任何可听见的声音
    const promise = audio.play();
    if (promise !== undefined) {
      promise
        .then(() => audio.pause())
        .catch((_err: unknown) => {
          /* iOS unlock: ignore play/pause race */
        });
    }
  }, []);

  // ── 获取 stream URL ──────────────────────────────────────────────────────
  /**
   * 向服务端请求流地址并设置到 audio.src。
   * 引入竞态锁：每次调用时将 songId 写入 loadingTrackIdRef，
   * fetch 回调执行时检查 id 是否仍匹配，不匹配则丢弃（用户已切歌）。
   */
  const fetchAndSetSrc = useCallback((songId: number, isRetry = false) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!isRetry) {
      retryCountRef.current = 0;
      loadingTrackIdRef.current = songId; // 【竞态锁】记录当前目标
    }

    setState((s) => ({ ...s, isLoading: true, error: null }));

    fetch(`/api/navidrome/stream-url?songId=${encodeURIComponent(songId)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`stream-url error: ${r.status}`);
        return r.json() as Promise<{ url?: string; error?: string }>;
      })
      .then(({ url, error }) => {
        // 【竞态锁检查】若用户在请求期间已切到其他歌曲，直接丢弃此结果
        if (songId !== loadingTrackIdRef.current) return;

        if (!url) throw new Error(error ?? "未获取到播放地址");

        audio.pause();
        audio.src = url;
        audio.load();

        setState((s) => ({
          ...s,
          isLoading: false,
          error: null,
          // 【关键】isPlaying 不在这里重置，它代表"用户意图"
          // shouldPlayAfterLoadRef 决定 canplay 时是否实际播放
        }));
      })
      .catch((err: unknown) => {
        // 若已切歌，静默丢弃旧请求的错误
        if (songId !== loadingTrackIdRef.current) return;

        const msg =
          err instanceof Error ? err.message : "获取播放地址失败，请稍后重试";
        setState((s) => ({
          ...s,
          isLoading: false,
          isPlaying: false,
          error: msg,
        }));
        shouldPlayAfterLoadRef.current = false;
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

    /**
     * canplay：音频已加载足够数据，可以开始播放。
     * 根据 shouldPlayAfterLoadRef 决定是否自动播放。
     * 这是唯一的自动播放触发点，逻辑清晰、无竞态风险。
     */
    const onCanPlay = () => {
      setState((s) => ({ ...s, isLoading: false }));
      if (shouldPlayAfterLoadRef.current) {
        safePlay();
      }
    };

    const onPlay = () => setState((s) => ({ ...s, isPlaying: true }));
    const onPause = () => setState((s) => ({ ...s, isPlaying: false }));

    const onEnded = () => {
      setState((s) => {
        const nextIndex = s.currentIndex + 1;
        if (nextIndex < s.queue.length) {
          const nextTrack = s.queue[nextIndex];
          // onEnded 自动切下一首 → 应该自动播放
          shouldPlayAfterLoadRef.current = true;
          loadingTrackIdRef.current = nextTrack.songId;
          return {
            ...s,
            currentIndex: nextIndex,
            currentTrack: nextTrack,
            isPlaying: true, // 保持播放意图
            isLoading: true,
          };
        }
        shouldPlayAfterLoadRef.current = false;
        return { ...s, isPlaying: false };
      });
    };

    const onVolumeChange = () =>
      setState((s) => ({ ...s, volume: audio.volume, isMuted: audio.muted }));

    const onError = () => {
      const err = audio.error;
      const isNetworkError =
        err?.code === MediaError.MEDIA_ERR_NETWORK ||
        err?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED;

      if (isNetworkError && retryCountRef.current < 1) {
        retryCountRef.current += 1;
        const id = loadingTrackIdRef.current;
        if (id !== null) {
          fetchAndSetSrc(id, true);
          return;
        }
      }

      let msg = "播放失败，请稍后重试";
      if (err?.code === MediaError.MEDIA_ERR_NETWORK)
        msg = "网络错误，无法加载音频";
      if (err?.code === MediaError.MEDIA_ERR_DECODE) msg = "音频解码失败";
      if (err?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED)
        msg = "不支持的音频格式或无权限";

      shouldPlayAfterLoadRef.current = false;
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
  }, [fetchAndSetSrc, safePlay]);

  // ── currentTrack 变化时加载新 URL ────────────────────────────────────────
  useEffect(() => {
    const songId = state.currentTrack?.songId ?? null;
    if (songId === null) return;
    // 竞态锁当前 id 已是此歌曲，说明是 fetchAndSetSrc 内部触发的重渲染，跳过重复加载
    if (songId === loadingTrackIdRef.current && state.isLoading) return;
    loadingTrackIdRef.current = songId;
    fetchAndSetSrc(songId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentTrack?.songId]);

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
          next.set(songId, data.lyrics as string);
          return next;
        });
      })
      .catch(() => {
        /* 歌词加载失败不影响播放 */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentTrack?.songId]);

  // ── MediaSession：系统级媒体控制（锁屏、通知栏、蓝牙耳机等）────────────
  /**
   * 将音频当前进度同步到 MediaSession positionState，
   * 使系统锁屏、通知栏等外部控制器能显示准确的播放进度和歌曲时长。
   *
   * 修复原有问题：
   * - 原来只监听 timeupdate + seeked，切歌时 duration 为 NaN 导致锁屏进度卡死。
   * - 现在额外监听 durationchange + loadedmetadata，确保时长一解析出来就立即同步。
   * - 额外监听 ratechange，支持将来倍速播放时锁屏进度条正确推进。
   *
   * 使用 ref 存储函数以避免声明顺序问题（doSeek 在 MediaSession effect 中引用它），
   * 同时避免 React Compiler 的 memoization 警告。
   */
  const syncMediaSessionPositionRef = useRef(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator))
      return;
    const audio = audioRef.current;
    if (!audio || !audio.duration || isNaN(audio.duration)) return;
    try {
      navigator.mediaSession.setPositionState({
        duration: audio.duration,
        playbackRate: audio.playbackRate,
        position: Math.min(audio.currentTime, audio.duration),
      });
    } catch {
      /* setPositionState 在部分旧浏览器上可能抛出，忽略即可 */
    }
  });

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator))
      return;
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
      syncMediaSessionPositionRef.current();
    };

    navigator.mediaSession.setActionHandler("play", () => {
      shouldPlayAfterLoadRef.current = true;
      safePlay();
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      shouldPlayAfterLoadRef.current = false;
      audioRef.current?.pause();
    });

    /**
     * 外部切歌（蓝牙耳机/锁屏 Next/Prev）的 iOS 解锁关键：
     * 在同步动作处理器中立即调用 syncUnlockAudio()，确保音频对象被标记为
     * "已由用户手势激活"，后续的异步 fetch + play() 不会被 iOS 安全机制拦截。
     */
    navigator.mediaSession.setActionHandler(
      "previoustrack",
      currentIndex > 0
        ? () => {
            syncUnlockAudio(); // 【iOS 解锁】同步激活音频对象
            shouldPlayAfterLoadRef.current = true;
            setState((s) => {
              const i = s.currentIndex - 1;
              if (i < 0) return s;
              return {
                ...s,
                currentIndex: i,
                currentTrack: s.queue[i],
                isPlaying: true,
                isLoading: true,
              };
            });
          }
        : null,
    );
    navigator.mediaSession.setActionHandler(
      "nexttrack",
      currentIndex < queue.length - 1
        ? () => {
            syncUnlockAudio(); // 【iOS 解锁】同步激活音频对象
            shouldPlayAfterLoadRef.current = true;
            setState((s) => {
              const i = s.currentIndex + 1;
              if (i >= s.queue.length) return s;
              return {
                ...s,
                currentIndex: i,
                currentTrack: s.queue[i],
                isPlaying: true,
                isLoading: true,
              };
            });
          }
        : null,
    );
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
  }, [
    state.currentTrack,
    state.currentIndex,
    state.queue.length,
    safePlay,
    syncUnlockAudio,
  ]);

  // ── MediaSession：同步播放状态 ────────────────────────────────────────────
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator))
      return;
    navigator.mediaSession.playbackState = state.isPlaying
      ? "playing"
      : "paused";
  }, [state.isPlaying]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator))
      return;

    const syncPos = syncMediaSessionPositionRef.current;
    const bind = () => {
      const audio = audioRef.current;
      if (!audio) {
        setTimeout(bind, 100);
        return;
      }
      audio.addEventListener("timeupdate", syncPos);
      audio.addEventListener("seeked", syncPos);
      // 【修复】补充关键事件：时长解析成功时立即同步，消灭切歌后锁屏进度卡死问题
      audio.addEventListener("durationchange", syncPos);
      audio.addEventListener("loadedmetadata", syncPos);
      audio.addEventListener("ratechange", syncPos);
    };
    bind();

    return () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.removeEventListener("timeupdate", syncPos);
      audio.removeEventListener("seeked", syncPos);
      audio.removeEventListener("durationchange", syncPos);
      audio.removeEventListener("loadedmetadata", syncPos);
      audio.removeEventListener("ratechange", syncPos);
    };
  }, []);

  // ── Controls ──────────────────────────────────────────────────────────────

  const play = useCallback(
    (track: PlayerTrack) => {
      setPlayerVisible(true);

      // 【iOS 解锁】在同步点击上下文中激活音频对象，确保后续异步 play() 不被拦截
      syncUnlockAudio();
      shouldPlayAfterLoadRef.current = true;

      setState((s) => {
        const existingIndex = s.queue.findIndex(
          (t) => t.songId === track.songId,
        );
        if (existingIndex !== -1) {
          // 已在队列中：直接跳转并播放，无需重新加载
          const isSameTrack = s.currentTrack?.songId === track.songId;
          if (isSameTrack) {
            // 已是当前曲目，直接播放
            safePlay();
            return { ...s, isPlaying: true };
          }
          return {
            ...s,
            currentIndex: existingIndex,
            currentTrack: s.queue[existingIndex],
            isPlaying: true,
            isLoading: true,
          };
        }
        // 不在队列中：追加并跳转
        const newQueue = [...s.queue, track];
        const newIndex = newQueue.length - 1;
        return {
          ...s,
          queue: newQueue,
          currentIndex: newIndex,
          currentTrack: track,
          isPlaying: true,
          isLoading: true,
        };
      });
    },
    [syncUnlockAudio, safePlay],
  );

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
      shouldPlayAfterLoadRef.current = true;
      safePlay();
    } else {
      shouldPlayAfterLoadRef.current = false;
      audio.pause();
    }
  }, [safePlay]);

  const pause = useCallback(() => {
    shouldPlayAfterLoadRef.current = false;
    audioRef.current?.pause();
  }, []);

  const jumpTo = useCallback((index: number) => {
    // 保持当前的播放意图（播放中切歌继续播，暂停中切歌保持暂停）
    setState((s) => {
      if (index < 0 || index >= s.queue.length) return s;
      // 如果是当前在播的状态，保持播放意图
      shouldPlayAfterLoadRef.current = s.isPlaying;
      return {
        ...s,
        currentIndex: index,
        currentTrack: s.queue[index],
        isLoading: true,
      };
    });
  }, []);

  const prev = useCallback(() => {
    // 【iOS 解锁】直接点击按钮时同步解锁
    syncUnlockAudio();
    setState((s) => {
      const i = s.currentIndex - 1;
      if (i < 0) return s;
      shouldPlayAfterLoadRef.current = s.isPlaying;
      return {
        ...s,
        currentIndex: i,
        currentTrack: s.queue[i],
        isLoading: true,
      };
    });
  }, [syncUnlockAudio]);

  const next = useCallback(() => {
    // 【iOS 解锁】直接点击按钮时同步解锁
    syncUnlockAudio();
    setState((s) => {
      const i = s.currentIndex + 1;
      if (i >= s.queue.length) return s;
      shouldPlayAfterLoadRef.current = s.isPlaying;
      return {
        ...s,
        currentIndex: i,
        currentTrack: s.queue[i],
        isLoading: true,
      };
    });
  }, [syncUnlockAudio]);

  const removeFromQueue = useCallback((index: number) => {
    setState((s) => {
      const newQueue = s.queue.filter((_, i) => i !== index);
      if (index === s.currentIndex) {
        audioRef.current?.pause();
        if (newQueue.length === 0) {
          loadingTrackIdRef.current = null;
          shouldPlayAfterLoadRef.current = false;
          return {
            ...s,
            queue: [],
            currentIndex: -1,
            currentTrack: null,
            isPlaying: false,
          };
        }
        const newIndex = Math.min(index, newQueue.length - 1);
        loadingTrackIdRef.current = null;
        shouldPlayAfterLoadRef.current = false;
        return {
          ...s,
          queue: newQueue,
          currentIndex: newIndex,
          currentTrack: newQueue[newIndex],
          isLoading: true,
        };
      }
      const newIndex =
        index < s.currentIndex ? s.currentIndex - 1 : s.currentIndex;
      return { ...s, queue: newQueue, currentIndex: newIndex };
    });
  }, []);

  const clearQueue = useCallback(() => {
    audioRef.current?.pause();
    loadingTrackIdRef.current = null;
    shouldPlayAfterLoadRef.current = false;
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
    <PlayerContext.Provider
      value={{
        state,
        controls,
        audioRef,
        playerVisible,
        setPlayerVisible,
        lyricsMap,
      }}
    >
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
    const onLoadedMetadata = () => readTime();

    const bind = () => {
      const audio = audioRef.current;
      if (!audio) return false;
      bound = true;

      audio.addEventListener("play", onPlay);
      audio.addEventListener("pause", onPause);
      audio.addEventListener("seeked", onSeeked);
      audio.addEventListener("durationchange", onDurationChange);
      audio.addEventListener("loadedmetadata", onLoadedMetadata);

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
        const audio = audioRef.current;
        if (!audio) return;
        audio.removeEventListener("play", onPlay);
        audio.removeEventListener("pause", onPause);
        audio.removeEventListener("seeked", onSeeked);
        audio.removeEventListener("durationchange", onDurationChange);
        audio.removeEventListener("loadedmetadata", onLoadedMetadata);
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
