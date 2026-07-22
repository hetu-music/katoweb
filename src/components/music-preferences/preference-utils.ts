import type { Song } from "@/lib/types";

export type PreferenceOutcome = -1 | 0 | 1;

export interface PreferenceRating {
  songId: number;
  rating: number;
  uncertainty: number;
  comparisons: number;
  updatedAt?: string;
}

export interface PreferenceComparison {
  id?: string;
  leftSongId: number;
  rightSongId: number;
  outcome: PreferenceOutcome;
  createdAt?: string;
}

export interface PreferencePair {
  left: Song;
  right: Song;
}

export interface PreferenceTier {
  label: string;
  songs: PreferenceRating[];
}

const INITIAL_RATING = 1500;
const INITIAL_UNCERTAINTY = 350;

export function createInitialRatings(
  songIds: Iterable<number>,
): PreferenceRating[] {
  return [...new Set(songIds)].map((songId) => ({
    songId,
    rating: INITIAL_RATING,
    uncertainty: INITIAL_UNCERTAINTY,
    comparisons: 0,
  }));
}

export function normalizeRatings(
  songIds: Iterable<number>,
  ratings: PreferenceRating[],
): PreferenceRating[] {
  const byId = new Map(ratings.map((rating) => [rating.songId, rating]));
  return createInitialRatings(songIds).map((initial) => ({
    ...initial,
    ...byId.get(initial.songId),
    songId: initial.songId,
  }));
}

function pairKey(leftSongId: number, rightSongId: number) {
  return leftSongId < rightSongId
    ? `${leftSongId}:${rightSongId}`
    : `${rightSongId}:${leftSongId}`;
}

function randomItem<T>(items: T[]): T | undefined {
  return items.length
    ? items[Math.floor(Math.random() * items.length)]
    : undefined;
}

/**
 * Pick an informative pair: cover unseen songs first, then compare close
 * ratings. Previously compared pairs are avoided until the catalog is exhausted.
 */
export function selectPreferencePair(
  songs: Song[],
  ratings: PreferenceRating[],
  comparisons: PreferenceComparison[],
): PreferencePair | null {
  if (songs.length < 2) return null;
  const ratingById = new Map(ratings.map((rating) => [rating.songId, rating]));
  const compared = new Set(
    comparisons.map((comparison) =>
      pairKey(comparison.leftSongId, comparison.rightSongId),
    ),
  );
  const candidates = songs
    .map((song) => ({
      song,
      rating: ratingById.get(song.id) ?? {
        songId: song.id,
        rating: INITIAL_RATING,
        uncertainty: INITIAL_UNCERTAINTY,
        comparisons: 0,
      },
    }))
    .sort((a, b) => a.rating.comparisons - b.rating.comparisons);

  const unseen = candidates.filter((item) => item.rating.comparisons === 0);
  const anchors = (unseen.length ? unseen : candidates).slice(
    0,
    Math.min(12, candidates.length),
  );
  const pairs: Array<{ left: Song; right: Song; score: number }> = [];

  for (const first of anchors) {
    for (const second of candidates) {
      if (first.song.id === second.song.id) continue;
      const key = pairKey(first.song.id, second.song.id);
      const difference = Math.abs(first.rating.rating - second.rating.rating);
      const uncertainty = first.rating.uncertainty + second.rating.uncertainty;
      pairs.push({
        left: first.song,
        right: second.song,
        score:
          (compared.has(key) ? 100000 : 0) + difference - uncertainty * 0.08,
      });
    }
  }

  const fresh = pairs.filter((pair) => pair.score < 100000);
  const pool = fresh.length ? fresh : pairs;
  if (!pool.length) return null;
  const bestScore = Math.min(...pool.map((pair) => pair.score));
  const finalists = pool.filter((pair) => pair.score <= bestScore + 35);
  const selected = randomItem(finalists) ?? finalists[0];
  if (!selected) return null;
  return { left: selected.left, right: selected.right };
}

export function applyPreferenceOutcome(
  ratings: PreferenceRating[],
  leftSongId: number,
  rightSongId: number,
  outcome: PreferenceOutcome,
): PreferenceRating[] {
  const byId = new Map(ratings.map((rating) => [rating.songId, { ...rating }]));
  const left = byId.get(leftSongId);
  const right = byId.get(rightSongId);
  if (!left || !right || leftSongId === rightSongId) return ratings;

  const expectedLeft = 1 / (1 + 10 ** ((right.rating - left.rating) / 400));
  const scoreLeft = outcome === 1 ? 1 : outcome === -1 ? 0 : 0.5;
  const kLeft = Math.max(
    12,
    Math.min(48, 32 * (left.uncertainty / INITIAL_UNCERTAINTY)),
  );
  const kRight = Math.max(
    12,
    Math.min(48, 32 * (right.uncertainty / INITIAL_UNCERTAINTY)),
  );
  const delta = scoreLeft - expectedLeft;
  const nextUncertainty = (value: number) => Math.max(45, value * 0.93);

  left.rating += kLeft * delta;
  right.rating -= kRight * delta;
  left.uncertainty = nextUncertainty(left.uncertainty);
  right.uncertainty = nextUncertainty(right.uncertainty);
  left.comparisons += 1;
  right.comparisons += 1;
  byId.set(leftSongId, left);
  byId.set(rightSongId, right);
  return ratings.map((rating) => byId.get(rating.songId) ?? rating);
}

export function sortPreferenceRatings(ratings: PreferenceRating[]) {
  return [...ratings].sort(
    (a, b) => b.rating - a.rating || a.uncertainty - b.uncertainty,
  );
}

export function buildPreferenceTiers(
  ratings: PreferenceRating[],
): PreferenceTier[] {
  const sorted = sortPreferenceRatings(ratings);
  const tiers: PreferenceTier[] = [];
  for (const rating of sorted) {
    const previous = tiers[tiers.length - 1];
    if (
      !previous ||
      previous.songs[previous.songs.length - 1].rating - rating.rating > 90
    ) {
      tiers.push({ label: `第 ${tiers.length + 1} 层`, songs: [rating] });
    } else {
      previous.songs.push(rating);
    }
  }
  return tiers;
}

export function getPreferenceBudget(songCount: number) {
  if (songCount < 2) return 0;
  return Math.ceil(songCount * Math.log2(songCount) * 1.35);
}

export const preferencePairKey = pairKey;
