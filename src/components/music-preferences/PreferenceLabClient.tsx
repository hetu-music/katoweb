"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  GitBranch,
  LogIn,
  Minus,
  Sparkles,
  Trophy,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useFavorites } from "@/context/FavoritesContext";
import { useUserContext } from "@/context/UserContext";
import type { Song } from "@/lib/types";
import { getCupCoverUrls } from "../music-cup/music-cup-cover";
import {
  applyPreferenceOutcome,
  buildPreferenceTiers,
  createInitialRatings,
  getPreferenceBudget,
  normalizeRatings,
  preferencePairKey,
  selectPreferencePair,
  sortPreferenceRatings,
  type PreferenceComparison,
  type PreferenceOutcome,
  type PreferenceRating,
} from "./preference-utils";
import "./preference.css";

const STORAGE_KEY = "hetu-music-preferences:v1";

interface PreferenceLabClientProps {
  songs: Song[];
  locale: string;
}

function PreferenceCover({ song }: { song: Song }) {
  const urls = getCupCoverUrls(song);
  const [failed, setFailed] = useState(false);
  return (
    <span className="preference-cover">
      {!failed && urls[0] ? (
        <Image
          src={urls[0]}
          alt={`《${song.title}》封面`}
          fill
          sizes="(max-width: 700px) 36vw, 220px"
          onError={() => setFailed(true)}
        />
      ) : null}
      <span>{song.title}</span>
    </span>
  );
}

function readLocalState(songIds: number[], storageKey: string) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      ratings?: PreferenceRating[];
      comparisons?: PreferenceComparison[];
    };
    if (!Array.isArray(parsed.ratings) || !Array.isArray(parsed.comparisons))
      return null;
    return {
      ratings: normalizeRatings(songIds, parsed.ratings),
      comparisons: parsed.comparisons,
    };
  } catch {
    return null;
  }
}

function Graph({
  songs,
  ratings,
  comparisons,
}: {
  songs: Song[];
  ratings: PreferenceRating[];
  comparisons: PreferenceComparison[];
}) {
  const visibleRatings = sortPreferenceRatings(ratings).slice(
    0,
    Math.min(72, ratings.length),
  );
  const visibleIds = new Set(visibleRatings.map((rating) => rating.songId));
  const visibleSongs = new Map(songs.map((song) => [song.id, song]));
  const tiers = buildPreferenceTiers(visibleRatings);
  const positions = new Map<number, { x: number; y: number }>();
  tiers.forEach((tier, tierIndex) => {
    tier.songs.forEach((rating, index) => {
      positions.set(rating.songId, {
        x: ((tierIndex + 0.5) / Math.max(tiers.length, 1)) * 100,
        y: ((index + 1) / (tier.songs.length + 1)) * 100,
      });
    });
  });
  const edges = comparisons.filter(
    (comparison) =>
      comparison.outcome !== 0 &&
      visibleIds.has(comparison.leftSongId) &&
      visibleIds.has(comparison.rightSongId),
  );
  const ties = comparisons.filter(
    (comparison) =>
      comparison.outcome === 0 &&
      visibleIds.has(comparison.leftSongId) &&
      visibleIds.has(comparison.rightSongId),
  );

  return (
    <div className="preference-graph" aria-label="歌曲偏好有向图">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <marker
            id="preference-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="4"
            markerHeight="4"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" />
          </marker>
        </defs>
        {edges.map((edge, index) => {
          const winnerId =
            edge.outcome === 1 ? edge.leftSongId : edge.rightSongId;
          const loserId =
            edge.outcome === 1 ? edge.rightSongId : edge.leftSongId;
          const from = positions.get(winnerId);
          const to = positions.get(loserId);
          if (!from || !to) return null;
          return (
            <line
              key={`${preferencePairKey(edge.leftSongId, edge.rightSongId)}-${index}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              markerEnd="url(#preference-arrow)"
            />
          );
        })}
        {ties.map((tie, index) => {
          const from = positions.get(tie.leftSongId);
          const to = positions.get(tie.rightSongId);
          if (!from || !to) return null;
          return (
            <line
              key={`tie-${preferencePairKey(tie.leftSongId, tie.rightSongId)}-${index}`}
              className="is-tie"
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
            />
          );
        })}
      </svg>
      {visibleRatings.map((rating) => {
        const song = visibleSongs.get(rating.songId);
        const position = positions.get(rating.songId);
        if (!song || !position) return null;
        return (
          <span
            key={rating.songId}
            className="preference-node"
            style={{ left: `${position.x}%`, top: `${position.y}%` }}
            title={`${song.title} · ${Math.round(rating.rating)} 分 · 不确定度 ${Math.round(rating.uncertainty)}`}
          >
            <b>{song.title.slice(0, 8)}</b>
            <small>{Math.round(rating.rating)}</small>
          </span>
        );
      })}
      {ratings.length > visibleRatings.length ? (
        <p className="preference-graph-note">
          图中显示当前排名前 {visibleRatings.length}{" "}
          首；完整排序见右侧层级列表。
        </p>
      ) : null}
    </div>
  );
}

export default function PreferenceLabClient({
  songs,
  locale,
}: PreferenceLabClientProps) {
  const { isLoggedIn } = useFavorites();
  const { user } = useUserContext();
  const storageKey = user?.id ? `${STORAGE_KEY}:user:${user.id}` : STORAGE_KEY;
  const songIds = useMemo(() => songs.map((song) => song.id), [songs]);
  const songById = useMemo(
    () => new Map(songs.map((song) => [song.id, song])),
    [songs],
  );
  const [ratings, setRatings] = useState<PreferenceRating[]>(() =>
    createInitialRatings(songIds),
  );
  const [comparisons, setComparisons] = useState<PreferenceComparison[]>([]);
  const [pair, setPair] = useState<{ left: Song; right: Song } | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [loadedStorageKey, setLoadedStorageKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const local = readLocalState(songIds, storageKey);
    const load = async () => {
      if (isLoggedIn) {
        try {
          const response = await fetch("/api/public/music-preferences");
          if (response.ok) {
            const data = (await response.json()) as {
              ratings?: Array<{
                song_id: number;
                rating: number;
                uncertainty: number;
                comparisons: number;
                updated_at?: string;
              }>;
              comparisons?: Array<{
                id?: string;
                left_song_id: number;
                right_song_id: number;
                outcome: PreferenceOutcome;
                created_at?: string;
              }>;
            };
            if (active) {
              setRatings(
                normalizeRatings(
                  songIds,
                  (data.ratings ?? []).map((rating) => ({
                    songId: rating.song_id,
                    rating: rating.rating,
                    uncertainty: rating.uncertainty,
                    comparisons: rating.comparisons,
                    updatedAt: rating.updated_at,
                  })),
                ),
              );
              setComparisons(
                (data.comparisons ?? []).map((comparison) => ({
                  id: comparison.id,
                  leftSongId: comparison.left_song_id,
                  rightSongId: comparison.right_song_id,
                  outcome: comparison.outcome,
                  createdAt: comparison.created_at,
                })),
              );
            }
          } else if (local && active) {
            setRatings(local.ratings);
            setComparisons(local.comparisons);
          }
        } catch {
          if (local && active) {
            setRatings(local.ratings);
            setComparisons(local.comparisons);
          }
        }
      } else if (local && active) {
        setRatings(local.ratings);
        setComparisons(local.comparisons);
      }
      if (active) {
        setLoadedStorageKey(storageKey);
        setHydrated(true);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [isLoggedIn, songIds, storageKey]);

  useEffect(() => {
    if (!hydrated || loadedStorageKey !== storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify({ ratings, comparisons }));
    queueMicrotask(() => {
      setPair(
        (current) =>
          current ?? selectPreferencePair(songs, ratings, comparisons),
      );
    });
  }, [comparisons, hydrated, loadedStorageKey, ratings, songs, storageKey]);

  const budget = getPreferenceBudget(songs.length);
  const progress = budget
    ? Math.min(100, (comparisons.length / budget) * 100)
    : 0;
  const tiers = buildPreferenceTiers(ratings);

  const submit = async (outcome: PreferenceOutcome) => {
    if (!pair || submitting) return;
    setSubmitting(true);
    setError(null);
    const comparison: PreferenceComparison = {
      leftSongId: pair.left.id,
      rightSongId: pair.right.id,
      outcome,
      createdAt: new Date().toISOString(),
    };
    setRatings((current) =>
      applyPreferenceOutcome(current, pair.left.id, pair.right.id, outcome),
    );
    setComparisons((current) => [...current, comparison]);
    setPair(null);

    if (isLoggedIn) {
      try {
        const csrfResponse = await fetch("/api/public/csrf-token");
        const csrf = csrfResponse.ok
          ? ((await csrfResponse.json()) as { csrfToken?: string }).csrfToken
          : "";
        const response = await fetch("/api/public/music-preferences", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": csrf ?? "",
          },
          body: JSON.stringify({
            leftSongId: comparison.leftSongId,
            rightSongId: comparison.rightSongId,
            outcome,
          }),
        });
        if (!response.ok)
          setError("本次选择已暂存本地，但服务器尚未启用偏好排序表。");
      } catch {
        setError("网络暂时不可用，本次选择已保存在本地。");
      }
    }
    setSubmitting(false);
  };

  if (songs.length < 2) {
    return (
      <main className="preference-lab">
        <p>歌曲目录不足，暂时无法开始排序。</p>
      </main>
    );
  }

  return (
    <main className="preference-lab">
      <header className="preference-header">
        <Link href="/music-cup" className="preference-back">
          <ArrowLeft size={16} /> 返回音乐杯
        </Link>
        <p className="preference-eyebrow">
          <Sparkles size={15} /> PERSONAL MUSIC ATLAS
        </p>
        <h1>把喜欢排成一条河</h1>
        <p>
          每次只比较两首歌。你的选择会逐步收敛成一个带有不确定度的个人排序；它是可继续修正的偏好地图，不是永久定论。
        </p>
      </header>

      {!isLoggedIn ? (
        <aside className="preference-login-note">
          <LogIn size={17} />{" "}
          当前以访客模式运行；登录后的新选择会同步到账号，已有访客记录仍保存在本机。{" "}
          <Link href="/login">去登录</Link>
        </aside>
      ) : null}

      <section className="preference-workbench">
        <div className="preference-compare-panel">
          <div className="preference-panel-heading">
            <span>第 {comparisons.length + 1} 次比较</span>
            <strong>{Math.round(progress)}% 建议进度</strong>
          </div>
          <div className="preference-progress">
            <span style={{ width: `${progress}%` }} />
          </div>
          {pair ? (
            <>
              <p className="preference-question">此刻更想留下哪一首？</p>
              <div className="preference-pair">
                <button
                  type="button"
                  className="preference-song-card"
                  onClick={() => void submit(1)}
                  disabled={submitting}
                >
                  <PreferenceCover song={pair.left} />
                  <strong>{pair.left.title}</strong>
                  <small>{pair.left.album || "专辑未收录"}</small>
                  <span>选 A</span>
                </button>
                <button
                  type="button"
                  className="preference-song-card"
                  onClick={() => void submit(-1)}
                  disabled={submitting}
                >
                  <PreferenceCover song={pair.right} />
                  <strong>{pair.right.title}</strong>
                  <small>{pair.right.album || "专辑未收录"}</small>
                  <span>选 B</span>
                </button>
              </div>
              <button
                type="button"
                className="preference-tie-button"
                onClick={() => void submit(0)}
                disabled={submitting}
              >
                <Minus size={16} /> 两首平局，暂时分不出高下
              </button>
            </>
          ) : (
            <div className="preference-loading">
              正在寻找下一组有信息量的对决…
            </div>
          )}
          <p className="preference-budget">
            建议完成约 {budget} 次比较后查看稳定层级；你可以随时继续精修。
          </p>
          {error ? <p className="preference-error">{error}</p> : null}
        </div>

        <div className="preference-ranking-panel">
          <div className="preference-panel-heading">
            <span>
              <Trophy size={15} /> 当前层级
            </span>
            <strong>
              {ratings.filter((rating) => rating.comparisons > 0).length} /{" "}
              {ratings.length} 首已有记录
            </strong>
          </div>
          <div className="preference-tier-list">
            {tiers.slice(0, 8).map((tier) => (
              <section key={tier.label} className="preference-tier">
                <h2>{tier.label}</h2>
                <ol>
                  {tier.songs.slice(0, 12).map((rating) => {
                    const song = songById.get(rating.songId);
                    if (!song) return null;
                    return (
                      <li key={rating.songId}>
                        <span>{song.title}</span>
                        <small>
                          {Math.round(rating.rating)} · ±
                          {Math.round(rating.uncertainty)}
                        </small>
                      </li>
                    );
                  })}
                </ol>
              </section>
            ))}
          </div>
        </div>
      </section>

      <section className="preference-graph-section">
        <div className="preference-section-title">
          <GitBranch size={18} />
          <div>
            <span>DIRECTED PREFERENCE GRAPH</span>
            <h2>你的偏好树状图</h2>
          </div>
          <p>箭头从胜者指向败者；层级由当前 rating 聚合，虚线平局不连方向。</p>
        </div>
        <Graph songs={songs} ratings={ratings} comparisons={comparisons} />
      </section>

      <footer className="preference-footer">
        数据只属于当前账号 · {locale === "zh-TW" ? "繁體介面" : "简体介面"} ·
        访客记录保存在本机
      </footer>
    </main>
  );
}
