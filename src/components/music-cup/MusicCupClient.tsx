"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  ChevronRight,
  Download,
  ExternalLink,
  ImageIcon,
  RotateCcw,
  Sparkles,
  Trophy,
  Undo2,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { Song } from "@/lib/types";
import { useFavorites } from "@/context/FavoritesContext";
import PlayButton from "@/components/shared/PlayButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createShareImage } from "./music-cup-share";
import { getCupCoverUrls, getHetuMusicCoverUrl } from "./music-cup-cover";
import {
  buildCupPool,
  CUP_POOL_SIZE,
  FALLBACK_SONGS,
  selectCupSongs,
  type CupPoolMode,
  type CupPoolResult,
} from "./music-cup-data";
import type { TournamentState } from "./music-cup-types";
import {
  commitKnockoutWinner,
  createInitialState,
  getCupResult,
  GROUP_LABELS,
  lockCurrentGroup,
  restoreTournament,
  roundLabel,
  startKnockout,
  startTournament,
  STORAGE_KEY,
  toggleSelection,
} from "./music-cup-utils";
import "./music-cup.css";

const POOL_STORAGE_KEY = "hetu-music-cup:pool:v1";

interface MusicCupClientProps {
  songs: Song[];
  locale: string;
}

interface SongChoiceProps {
  song: Song;
  selected: boolean;
  disabled?: boolean;
  compact?: boolean;
  badge?: string;
  onSelect: () => void;
}

const copyState = (state: TournamentState): TournamentState =>
  structuredClone(state);

const SHOW_PRIVATE_FIRST_SEAL = false;
const SHOW_AUDIO_PERMISSION_NOTE = false;

function CupCover({
  song,
  alt,
  sizes,
  priority,
}: {
  song: Song;
  alt: string;
  sizes: string;
  priority?: boolean;
}) {
  const sourceKey = `${song.id}:${String(song.hascover)}`;
  const [sourceState, setSourceState] = useState({
    key: sourceKey,
    index: 0,
  });
  const sourceIndex = sourceState.key === sourceKey ? sourceState.index : 0;
  const coverUrls = getCupCoverUrls(song);
  const coverUrl = coverUrls[sourceIndex];

  return (
    <>
      <span className="cup-cover-fallback" aria-hidden="true">
        <i>河图</i>
        <strong>{song.title}</strong>
      </span>
      {coverUrl ? (
        <Image
          src={coverUrl}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className="cup-cover-image"
          onError={() =>
            setSourceState({ key: sourceKey, index: sourceIndex + 1 })
          }
        />
      ) : null}
    </>
  );
}

function SongChoice({
  song,
  selected,
  disabled,
  compact,
  badge,
  onSelect,
}: SongChoiceProps) {
  return (
    <article
      className={`cup-song-card${selected ? " is-selected" : ""}${compact ? " is-compact" : ""}`}
    >
      <button
        type="button"
        className="cup-song-choice"
        onClick={onSelect}
        aria-pressed={selected}
        disabled={disabled}
      >
        <span className="cup-cover-wrap">
          <CupCover
            song={song}
            alt={`《${song.title}》封面`}
            sizes={
              compact
                ? "(max-width: 640px) 44vw, 180px"
                : "(max-width: 768px) 84vw, 360px"
            }
          />
          <span className="cup-cover-wash" />
          {badge ? <span className="cup-song-badge">{badge}</span> : null}
          <span className="cup-selection-mark" aria-hidden="true">
            {selected ? "选" : "择"}
          </span>
        </span>
        <span className="cup-song-copy">
          <span className="cup-song-title-row">
            <strong title={song.title}>{song.title}</strong>
            <time dateTime={song.year ? String(song.year) : undefined}>
              {song.year ?? "未知"}
            </time>
          </span>
          <small title={song.album || undefined}>
            {song.album || "专辑未收录"}
          </small>
        </span>
      </button>
      <span className="cup-song-tools">
        <PlayButton
          songId={song.id}
          title={song.title}
          artist={song.artist?.join(" / ")}
          coverUrl={getHetuMusicCoverUrl(song)}
          hasAudio={song.has_audio}
          className="cup-play-button"
          size={14}
        />
        <Link href={`/song/${song.id}`} target="_blank" rel="noreferrer">
          曲目档案 <ExternalLink size={12} />
        </Link>
      </span>
    </article>
  );
}

function StageHeading({
  seal,
  title,
  description,
}: {
  seal: string;
  title: string;
  description: string;
}) {
  return (
    <header className="cup-stage-heading">
      <span className="cup-stage-seal">{seal}</span>
      <div>
        <p>HETU MUSIC CUP</p>
        <h1>{title}</h1>
        <span>{description}</span>
      </div>
    </header>
  );
}

function PrimaryButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="cup-primary-button"
      disabled={disabled}
      onClick={onClick}
    >
      <span>{children}</span>
      <ChevronRight size={18} />
    </button>
  );
}

function stageProgress(state: TournamentState) {
  if (state.stage === "landing") return 0;
  if (state.stage === "draw") return 5;
  if (state.stage === "group") return 8 + (state.groupIndex / 12) * 30;
  if (state.stage === "wildcard") return 42;
  if (state.stage === "result") return 100;
  const round = state.rounds[state.roundIndex];
  if (!round) return 45;
  const roundOffsets: Record<number, number> = {
    32: 45,
    16: 66,
    8: 80,
    4: 89,
    2: 95,
  };
  const roundSpan: Record<number, number> = {
    32: 21,
    16: 14,
    8: 9,
    4: 6,
    2: 5,
  };
  return (
    roundOffsets[round.size] +
    (state.matchIndex / (round.entrants.length / 2)) * roundSpan[round.size]
  );
}

export default function MusicCupClient({
  songs: catalog,
  locale,
}: MusicCupClientProps) {
  const { favorites, isLoggedIn, loaded: favoritesLoaded } = useFavorites();
  const curatedSongs = useMemo(() => selectCupSongs(catalog), [catalog]);
  const [activeSongs, setActiveSongs] = useState<Song[]>(curatedSongs);
  const [poolMode, setPoolMode] = useState<CupPoolMode>("curated");
  const [poolInfo, setPoolInfo] = useState<CupPoolResult | null>(null);
  const [state, setState] = useState<TournamentState>(createInitialState);
  const [history, setHistory] = useState<TournamentState[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareStatus, setShareStatus] = useState<
    "idle" | "drawing" | "ready" | "error"
  >("idle");
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const knockoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const songsById = useMemo(
    () => new Map(activeSongs.map((song) => [song.id, song])),
    [activeSongs],
  );
  useEffect(() => {
    let active = true;
    let persistedMode: CupPoolMode = "curated";
    let persistedSongs = curatedSongs;
    let persistedInfo: CupPoolResult | null = null;
    try {
      const rawPool = localStorage.getItem(POOL_STORAGE_KEY);
      const parsed = rawPool ? JSON.parse(rawPool) : null;
      if (
        parsed &&
        (parsed.mode === "curated" ||
          parsed.mode === "favorites" ||
          parsed.mode === "all") &&
        Array.isArray(parsed.songIds)
      ) {
        // A small catalog can rely on bundled fallback songs to keep the
        // bracket valid; restore those IDs as well as live database rows.
        const byId = new Map([
          ...FALLBACK_SONGS.map((song) => [song.id, song] as const),
          ...catalog.map((song) => [song.id, song] as const),
        ]);
        const restoredSongs = parsed.songIds
          .map((id: unknown) => byId.get(Number(id)))
          .filter((song: Song | undefined): song is Song => Boolean(song));
        if (restoredSongs.length === CUP_POOL_SIZE) {
          persistedMode = parsed.mode;
          persistedSongs = restoredSongs;
          persistedInfo = {
            songs: restoredSongs,
            mode: parsed.mode,
            sourceCount:
              Number.isFinite(parsed.sourceCount) && parsed.sourceCount >= 0
                ? parsed.sourceCount
                : restoredSongs.length,
            sampledCount:
              Number.isFinite(parsed.sampledCount) && parsed.sampledCount >= 0
                ? parsed.sampledCount
                : 0,
            filledCount:
              Number.isFinite(parsed.filledCount) && parsed.filledCount >= 0
                ? parsed.filledCount
                : 0,
            targetSize: CUP_POOL_SIZE,
          };
        }
      }
    } catch {
      localStorage.removeItem(POOL_STORAGE_KEY);
    }
    const restored = restoreTournament(
      localStorage.getItem(STORAGE_KEY),
      new Set(persistedSongs.map((song) => song.id)),
    );
    queueMicrotask(() => {
      if (!active) return;
      setPoolMode(persistedMode);
      setActiveSongs(persistedSongs);
      setPoolInfo(persistedInfo);
      if (restored) {
        setState({ ...restored.current, pendingWinner: null });
        setHistory(restored.history);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, [catalog, curatedSongs]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        current: { ...state, pendingWinner: null },
        history,
      }),
    );
  }, [hydrated, history, state]);

  useEffect(
    () => () => {
      if (knockoutTimer.current) clearTimeout(knockoutTimer.current);
      if (shareUrl) URL.revokeObjectURL(shareUrl);
    },
    [shareUrl],
  );

  const commit = (nextState: TournamentState) => {
    setHistory((items) => [...items, copyState(state)]);
    setState(nextState);
  };

  const resetTournament = () => {
    if (knockoutTimer.current) clearTimeout(knockoutTimer.current);
    knockoutTimer.current = null;
    setState(createInitialState());
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
    setResetOpen(false);
  };

  const choosePoolMode = (mode: CupPoolMode) => {
    if (mode === "favorites" && !isLoggedIn) return;
    const preview = buildCupPool({
      mode,
      allSongs: catalog,
      favoriteIds: favorites,
    });
    setPoolMode(mode);
    setPoolInfo(preview);
    setActiveSongs(preview.songs);
    setState(createInitialState());
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(POOL_STORAGE_KEY);
  };

  const startSelectedPool = () => {
    // Keep the preview stable so users know exactly which songs enter the
    // bracket. A fresh pool is only generated when no preview exists yet.
    const result =
      poolInfo?.mode === poolMode
        ? poolInfo
        : buildCupPool({
            mode: poolMode,
            allSongs: catalog,
            favoriteIds: favorites,
          });
    setActiveSongs(result.songs);
    setPoolInfo(result);
    localStorage.setItem(
      POOL_STORAGE_KEY,
      JSON.stringify({
        mode: result.mode,
        songIds: result.songs.map((song) => song.id),
        sourceCount: result.sourceCount,
        sampledCount: result.sampledCount,
        filledCount: result.filledCount,
      }),
    );
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
    setState(startTournament(result.songs.map((song) => song.id)));
  };

  const undo = () => {
    if (history.length === 0 || state.pendingWinner !== null) return;
    const previous = history[history.length - 1];
    setState(previous);
    setHistory((items) => items.slice(0, -1));
  };

  const chooseKnockoutWinner = (winnerId: number) => {
    if (state.pendingWinner !== null) return;
    const snapshot = copyState({ ...state, pendingWinner: null });
    setState({ ...state, pendingWinner: winnerId });
    knockoutTimer.current = setTimeout(() => {
      setHistory((items) => [...items, snapshot]);
      setState((current) =>
        commitKnockoutWinner({ ...current, pendingWinner: null }, winnerId),
      );
      knockoutTimer.current = null;
    }, 520);
  };

  const generateShare = async () => {
    setShareOpen(true);
    setShareStatus("drawing");
    if (shareUrl) {
      URL.revokeObjectURL(shareUrl);
      setShareUrl(null);
    }
    try {
      const blob = await createShareImage(state, songsById, locale);
      setShareUrl(URL.createObjectURL(blob));
      setShareStatus("ready");
    } catch (error) {
      console.error("Failed to generate music cup share image", error);
      setShareStatus("error");
    }
  };

  if (!hydrated) {
    return (
      <main className="music-cup cup-hydrating">
        <span className="cup-ink-loader" />
        <p>正在续写赛程…</p>
      </main>
    );
  }

  const currentGroup = state.groups[state.groupIndex] ?? [];
  const knockoutRound = state.rounds[state.roundIndex];
  const currentMatch = knockoutRound?.entrants.slice(
    state.matchIndex * 2,
    state.matchIndex * 2 + 2,
  );
  const result = getCupResult(state, songsById);
  const progress = stageProgress(state);
  const poolCopy =
    poolMode === "curated"
      ? {
          eyebrow: "THE CURATED CANON",
          title: "定选四十八曲",
          description: "河图代表曲目 · 不以声量论高下",
        }
      : poolMode === "favorites"
        ? {
            eyebrow: "MY SAVED SONGS",
            title: "我的收藏入池",
            description: "从你的收藏中抽取并补足四十八曲",
          }
        : {
            eyebrow: "THE FULL ARCHIVE DRAW",
            title: "全库四十八曲",
            description: "从数据库全量歌曲中随机抽取并补足",
          };
  const poolSummary = poolInfo
    ? `本局入池 ${poolInfo.songs.length} 首 · 来源 ${poolInfo.sourceCount} 首${
        poolInfo.sampledCount > 0 ? ` · 未抽入 ${poolInfo.sampledCount} 首` : ""
      }${
        poolInfo.filledCount > 0 ? ` · 随机补入 ${poolInfo.filledCount} 首` : ""
      }`
    : null;

  return (
    <main className="music-cup">
      <div className="cup-paper-grain" aria-hidden="true" />
      <div className="cup-ink-moon" aria-hidden="true" />
      <div className="cup-branch cup-branch-one" aria-hidden="true" />
      <div className="cup-branch cup-branch-two" aria-hidden="true" />

      <nav className="cup-nav" aria-label="音乐杯赛事导航">
        <Link href="/" className="cup-brand" aria-label="返回河图作品勘鉴首页">
          <span>河图</span>
          <div>
            <strong>音乐杯</strong>
            <small>一曲定山河</small>
          </div>
        </Link>
        <div
          className="cup-progress"
          aria-label={`赛事进度 ${Math.round(progress)}%`}
        >
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="cup-nav-actions">
          <button
            type="button"
            onClick={undo}
            disabled={history.length === 0 || state.pendingWinner !== null}
          >
            <Undo2 size={15} /> <span>返回上一步</span>
          </button>
          {state.stage !== "landing" ? (
            <button type="button" onClick={() => setResetOpen(true)}>
              <RotateCcw size={15} /> <span>重开此局</span>
            </button>
          ) : null}
        </div>
      </nav>

      <section
        className="cup-stage"
        key={`${state.stage}-${state.groupIndex}-${state.roundIndex}`}
      >
        {state.stage === "landing" ? (
          <div className="cup-landing">
            <div className="cup-hero-copy">
              <p className="cup-kicker">
                <span /> 河图作品勘鉴 · 雅集特别企划
              </p>
              <h1>
                <span>四十八曲</span>
                <strong>问鼎山河</strong>
              </h1>
              <p className="cup-hero-lead">
                四十八曲入局，十二支分席；择二入围，八席遗珠归来，五重对决，终问一曲之魁。你的每一次取舍，都会写下只属于你的河图音乐谱系。
              </p>
              <div className="cup-rule-strip">
                <span>
                  <b>48</b>曲入局
                </span>
                <i />
                <span>
                  <b>12</b>支分席
                </span>
                <i />
                <span>
                  <b>1</b>曲问魁
                </span>
              </div>
              <div className="cup-pool-picker" aria-label="选择入池来源">
                <span className="cup-pool-picker-label">入池方式</span>
                <div className="cup-pool-options">
                  {(
                    [
                      ["curated", "河图初选", "编辑精选 48 首"],
                      ["all", "全库抽签", `${catalog.length} 首歌曲`],
                      [
                        "favorites",
                        "我的收藏",
                        isLoggedIn
                          ? `${favorites.length} 首收藏`
                          : "登录后可用",
                      ],
                    ] as const
                  ).map(([mode, label, detail]) => (
                    <button
                      key={mode}
                      type="button"
                      className={`cup-pool-option${poolMode === mode ? " is-active" : ""}`}
                      disabled={mode === "favorites" && !isLoggedIn}
                      onClick={() => choosePoolMode(mode)}
                    >
                      <strong>{label}</strong>
                      <small>{detail}</small>
                    </button>
                  ))}
                </div>
                <p className="cup-pool-help">
                  {poolMode === "curated"
                    ? "沿用河图代表曲目的固定初选名单。"
                    : poolMode === "all"
                      ? `从数据库全量歌曲${catalog.length > CUP_POOL_SIZE ? "随机抽取" : "直接纳入并补足"} ${CUP_POOL_SIZE} 首；再次点击可重抽。`
                      : favoritesLoaded
                        ? `从你的收藏${favorites.length > CUP_POOL_SIZE ? "随机抽取" : "纳入并补足"} ${CUP_POOL_SIZE} 首；再次点击可重抽。`
                        : "正在读取收藏…"}
                </p>
              </div>
              <PrimaryButton
                disabled={
                  poolMode === "favorites" && (!isLoggedIn || !favoritesLoaded)
                }
                onClick={startSelectedPool}
              >
                {poolMode === "curated" ? "开始抽签" : "确认入池并开始"}
              </PrimaryButton>
              {poolInfo ? (
                <small className="cup-pool-result">{poolSummary}</small>
              ) : null}
              {SHOW_AUDIO_PERMISSION_NOTE ? (
                <small className="cup-audio-note">
                  试听沿用站内会员权限；所有曲目均可打开档案查看。
                </small>
              ) : null}
            </div>

            <div className="cup-hero-art" aria-label="候选歌曲封面拼贴">
              {activeSongs.slice(0, 3).map((song, index) => (
                <div
                  className={`cup-hero-cover cover-${index + 1}`}
                  key={song.id}
                >
                  <CupCover
                    song={song}
                    alt={`《${song.title}》封面`}
                    priority={index === 0}
                    sizes="(max-width: 768px) 65vw, 360px"
                  />
                  <span className="cup-hero-title">{song.title}</span>
                </div>
              ))}
              {SHOW_PRIVATE_FIRST_SEAL ? (
                <span className="cup-red-seal">
                  私选
                  <br />
                  第一
                </span>
              ) : null}
            </div>

            <section className="cup-candidate-board">
              <div className="cup-candidate-title">
                <div>
                  <span>{poolCopy.eyebrow}</span>
                  <h2>{poolCopy.title}</h2>
                </div>
                <p>{poolCopy.description}</p>
              </div>
              <ol>
                {activeSongs.map((song, index) => (
                  <li key={song.id}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{song.title}</strong>
                  </li>
                ))}
              </ol>
            </section>
            <div className="cup-preference-link">
              <Link href="/music-cup/preferences">
                不参加淘汰赛？进入全库偏好排序 <ChevronRight size={15} />
              </Link>
            </div>
          </div>
        ) : null}

        {state.stage === "draw" ? (
          <div className="cup-draw-stage">
            <StageHeading
              seal="签"
              title="十二支分席落定"
              description="四曲同席，择二入围；余者暂退，候列遗珠归席之门。"
            />
            {poolSummary ? (
              <p className="cup-pool-result cup-pool-result-draw">
                {poolSummary}
              </p>
            ) : null}
            <div className="cup-group-grid">
              {state.groups.map((group, groupIndex) => (
                <article key={GROUP_LABELS[groupIndex]}>
                  <header>
                    <span>{GROUP_LABELS[groupIndex]}</span>
                    <div>
                      <small>支序</small>
                      <strong>{GROUP_LABELS[groupIndex]} 支</strong>
                    </div>
                  </header>
                  <ol>
                    {group.map((id, index) => (
                      <li key={id}>
                        <span>{index + 1}</span>
                        {songsById.get(id)?.title}
                      </li>
                    ))}
                  </ol>
                </article>
              ))}
            </div>
            <div className="cup-sticky-action">
              <p>
                <Sparkles size={15} /> 分席已落定，暂存于此间
              </p>
              <PrimaryButton
                onClick={() => commit({ ...state, stage: "group" })}
              >
                入 {GROUP_LABELS[0]} 支
              </PrimaryButton>
            </div>
          </div>
        ) : null}

        {state.stage === "group" ? (
          <div className="cup-selection-stage">
            <StageHeading
              seal={GROUP_LABELS[state.groupIndex]}
              title={`${GROUP_LABELS[state.groupIndex]} 支 · 择二入围`}
              description={`第 ${state.groupIndex + 1} / 十二支 · 已择 ${state.pendingSelection.length} / 二曲。`}
            />
            <div className="cup-selection-meter">
              {GROUP_LABELS.map((label, index) => (
                <span
                  key={label}
                  className={
                    index < state.groupIndex
                      ? "is-done"
                      : index === state.groupIndex
                        ? "is-current"
                        : ""
                  }
                >
                  {label}
                </span>
              ))}
            </div>
            <div className="cup-choice-grid">
              {currentGroup.map((id) => {
                const song = songsById.get(id);
                if (!song) return null;
                const selected = state.pendingSelection.includes(id);
                return (
                  <SongChoice
                    key={id}
                    song={song}
                    selected={selected}
                    disabled={!selected && state.pendingSelection.length >= 2}
                    onSelect={() =>
                      setState({
                        ...state,
                        pendingSelection: toggleSelection(
                          state.pendingSelection,
                          id,
                          2,
                        ),
                      })
                    }
                  />
                );
              })}
            </div>
            <div className="cup-sticky-action">
              <p>
                {state.pendingSelection.length < 2
                  ? `尚缺 ${2 - state.pendingSelection.length} 席，方可落印`
                  : "两席已定，可落印成章"}
              </p>
              <PrimaryButton
                disabled={state.pendingSelection.length !== 2}
                onClick={() => commit(lockCurrentGroup(state))}
              >
                {state.groupIndex === 11
                  ? "落印，赴遗珠归席"
                  : `落印，赴 ${GROUP_LABELS[state.groupIndex + 1]} 支`}
              </PrimaryButton>
            </div>
          </div>
        ) : null}

        {state.stage === "wildcard" ? (
          <div className="cup-selection-stage cup-wildcard-stage">
            <StageHeading
              seal="归"
              title="遗珠归席"
              description="二十四曲暂落尘外，再择八曲返席，共赴三十二强。"
            />
            <div className="cup-wildcard-counter">
              <span>已归席</span>
              <strong>{state.pendingSelection.length}</strong>
              <i>/ 8</i>
            </div>
            <div className="cup-wildcard-grid">
              {state.groupLosers.map((id) => {
                const song = songsById.get(id);
                if (!song) return null;
                const selected = state.pendingSelection.includes(id);
                return (
                  <SongChoice
                    key={id}
                    song={song}
                    compact
                    badge="遗珠"
                    selected={selected}
                    disabled={!selected && state.pendingSelection.length >= 8}
                    onSelect={() =>
                      setState({
                        ...state,
                        pendingSelection: toggleSelection(
                          state.pendingSelection,
                          id,
                          8,
                        ),
                      })
                    }
                  />
                );
              })}
            </div>
            <div className="cup-sticky-action">
              <p>二十四曲直入，八席归来；合为三十二强，再启争鸣</p>
              <PrimaryButton
                disabled={state.pendingSelection.length !== 8}
                onClick={() => commit(startKnockout(state))}
              >
                八席既定，开三十二强
              </PrimaryButton>
            </div>
          </div>
        ) : null}

        {state.stage === "knockout" && knockoutRound && currentMatch ? (
          <div className="cup-knockout-stage">
            <StageHeading
              seal={knockoutRound.size === 2 ? "冠" : "决"}
              title={roundLabel(knockoutRound.size)}
              description={`第 ${state.matchIndex + 1} / ${knockoutRound.entrants.length / 2} 场 · 择一曲入下一关`}
            />
            <div className="cup-round-path">
              {([32, 16, 8, 4, 2] as const).map((size) => (
                <span
                  key={size}
                  className={
                    size === knockoutRound.size
                      ? "is-current"
                      : size > knockoutRound.size
                        ? "is-done"
                        : ""
                  }
                >
                  {roundLabel(size)}
                </span>
              ))}
            </div>
            <div className="cup-versus-grid">
              {currentMatch.map((id, index) => {
                const song = songsById.get(id);
                if (!song) return null;
                const selected = state.pendingWinner === id;
                return (
                  <SongChoice
                    key={id}
                    song={song}
                    badge={index === 0 ? "上签" : "下签"}
                    selected={selected}
                    disabled={state.pendingWinner !== null && !selected}
                    onSelect={() => chooseKnockoutWinner(id)}
                  />
                );
              })}
              <span className="cup-vs-mark">
                VS<small>胜者入局</small>
              </span>
            </div>
            <p className="cup-knockout-hint">
              {state.pendingWinner
                ? "胜者已落印，正赴下一场…"
                : "择一封面，定本场胜负"}
            </p>
          </div>
        ) : null}

        {state.stage === "result" && result ? (
          <div className="cup-result-stage">
            <p className="cup-result-kicker">
              <Trophy size={18} /> HETU MUSIC CUP · 终局
            </p>
            <div className="cup-result-hero">
              <div className="cup-champion-cover">
                <CupCover
                  song={result.champion}
                  alt={`魁首《${result.champion.title}》封面`}
                  priority
                  sizes="(max-width: 768px) 76vw, 520px"
                />
                <span className="cup-crown">魁</span>
              </div>
              <div className="cup-result-copy">
                <span>今夜问鼎之曲</span>
                <h1>{result.champion.title}</h1>
                <p>四十八曲一路走来，此刻山河有名。</p>
                <div className="cup-result-actions">
                  <button type="button" onClick={generateShare}>
                    <ImageIcon size={17} /> 绘制晋级图
                  </button>
                  <button type="button" onClick={() => setResetOpen(true)}>
                    <RotateCcw size={17} /> 再开一局
                  </button>
                </div>
              </div>
            </div>
            <div className="cup-podium">
              <article>
                <span>次席</span>
                <span className="cup-podium-cover">
                  <CupCover
                    song={result.runnerUp}
                    alt={`次席《${result.runnerUp.title}》封面`}
                    sizes="54px"
                  />
                </span>
                <strong>{result.runnerUp.title}</strong>
              </article>
              {result.semifinalists.map((song) => (
                <article key={song.id}>
                  <span>四席</span>
                  <span className="cup-podium-cover">
                    <CupCover
                      song={song}
                      alt={`四席《${song.title}》封面`}
                      sizes="54px"
                    />
                  </span>
                  <strong>{song.title}</strong>
                </article>
              ))}
            </div>
            <div className="cup-result-footnote">
              <BookOpen size={16} />{" "}
              完整问鼎路径会写入分享图；返回前一步，可重择终局。
            </div>
          </div>
        ) : null}
      </section>

      <footer className="cup-footer">
        <span>河图作品勘鉴</span>
        <i />
        <span>择曲只记此刻心音</span>
      </footer>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="cup-modal cup-reset-modal">
          <DialogHeader>
            <div>
              <DialogTitle>
                {state.stage === "result" ? "再开一局？" : "重开此局？"}
              </DialogTitle>
              <DialogDescription>
                此局进度将尽数抹去，且不可追回。
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="cup-modal-actions">
            <button type="button" onClick={() => setResetOpen(false)}>
              续入此局
            </button>
            <button
              type="button"
              className="is-danger"
              onClick={resetTournament}
            >
              {state.stage === "result" ? "回到首页" : "重开此局"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="cup-modal cup-share-modal">
          <DialogHeader>
            <div>
              <DialogTitle>你的问鼎之路</DialogTitle>
              <DialogDescription>
                从三十二强至魁首，完整问鼎路径尽收一张长图。
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="cup-share-body">
            {shareStatus === "drawing" ? (
              <div className="cup-share-loading">
                <span className="cup-ink-loader" />
                <p>正在绘制问鼎之路…</p>
              </div>
            ) : null}
            {shareStatus === "error" ? (
              <div className="cup-share-loading">
                <p>问鼎图生成失败，请稍后再试。</p>
                <button type="button" onClick={generateShare}>
                  重绘问鼎图
                </button>
              </div>
            ) : null}
            {shareStatus === "ready" && shareUrl ? (
              <Image
                src={shareUrl}
                alt="河图音乐杯完整问鼎路径图"
                width={900}
                height={1400}
                unoptimized
              />
            ) : null}
          </div>
          {shareStatus === "ready" && shareUrl ? (
            <div className="cup-modal-actions">
              <button type="button" onClick={() => setShareOpen(false)}>
                关闭
              </button>
              <a
                href={shareUrl}
                download={`河图音乐杯-${result?.champion.title ?? "魁首"}.png`}
              >
                <Download size={16} /> 收下此图
              </a>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </main>
  );
}
