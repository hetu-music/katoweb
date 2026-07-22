import type { Song } from "@/lib/types";
import type {
  CupResult,
  KnockoutSize,
  PersistedTournament,
  TournamentState,
} from "./music-cup-types";

export const STORAGE_KEY = "hetu-music-cup:v1";
// 十二组以地支为名，保留原有数字索引，避免影响赛事状态与存档。
export const GROUP_LABELS = "子丑寅卯辰巳午未申酉戌亥".split("");

const STAGES = new Set([
  "landing",
  "draw",
  "group",
  "wildcard",
  "knockout",
  "result",
]);

export function createInitialState(): TournamentState {
  return {
    stage: "landing",
    groups: [],
    groupIndex: 0,
    groupWinners: [],
    groupLosers: [],
    pendingSelection: [],
    wildcards: [],
    rounds: [],
    roundIndex: 0,
    matchIndex: 0,
    pendingWinner: null,
    createdAt: null,
  };
}

function randomIndex(max: number) {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const ceiling = Math.floor(0x100000000 / max) * max;
    const sample = new Uint32Array(1);
    do crypto.getRandomValues(sample);
    while (sample[0] >= ceiling);
    return sample[0] % max;
  }
  return Math.floor(Math.random() * max);
}

export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = randomIndex(index + 1);
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

export function startTournament(songIds: number[]): TournamentState {
  const shuffled = shuffle(songIds);
  return {
    ...createInitialState(),
    stage: "draw",
    groups: Array.from({ length: 12 }, (_, index) =>
      shuffled.slice(index * 4, index * 4 + 4),
    ),
    createdAt: Date.now(),
  };
}

export function toggleSelection(
  selected: number[],
  id: number,
  limit: number,
): number[] {
  if (selected.includes(id)) return selected.filter((item) => item !== id);
  if (selected.length >= limit) return selected;
  return [...selected, id];
}

export function lockCurrentGroup(state: TournamentState): TournamentState {
  const group = state.groups[state.groupIndex] ?? [];
  if (state.pendingSelection.length !== 2 || group.length !== 4) return state;

  const groupLosers = group.filter(
    (songId) => !state.pendingSelection.includes(songId),
  );
  const isLastGroup = state.groupIndex === state.groups.length - 1;

  return {
    ...state,
    stage: isLastGroup ? "wildcard" : "group",
    groupIndex: isLastGroup ? state.groupIndex : state.groupIndex + 1,
    groupWinners: [...state.groupWinners, ...state.pendingSelection],
    groupLosers: [...state.groupLosers, ...groupLosers],
    pendingSelection: [],
  };
}

export function startKnockout(state: TournamentState): TournamentState {
  if (state.pendingSelection.length !== 8) return state;
  const entrants = shuffle([...state.groupWinners, ...state.pendingSelection]);

  return {
    ...state,
    stage: "knockout",
    wildcards: state.pendingSelection,
    pendingSelection: [],
    rounds: [{ size: 32, entrants, winners: [] }],
    roundIndex: 0,
    matchIndex: 0,
    pendingWinner: null,
  };
}

export function commitKnockoutWinner(
  state: TournamentState,
  winnerId: number,
): TournamentState {
  const round = state.rounds[state.roundIndex];
  const match = round?.entrants.slice(
    state.matchIndex * 2,
    state.matchIndex * 2 + 2,
  );
  if (!round || !match.includes(winnerId)) return state;

  const rounds = state.rounds.map((item, index) =>
    index === state.roundIndex
      ? { ...item, winners: [...item.winners, winnerId] }
      : item,
  );
  const completedRound = rounds[state.roundIndex];
  const matchCount = round.entrants.length / 2;

  if (state.matchIndex < matchCount - 1) {
    return {
      ...state,
      rounds,
      matchIndex: state.matchIndex + 1,
      pendingWinner: null,
    };
  }

  if (round.size === 2) {
    return {
      ...state,
      stage: "result",
      rounds,
      pendingWinner: null,
    };
  }

  const nextSize = (round.size / 2) as KnockoutSize;
  return {
    ...state,
    rounds: [
      ...rounds,
      { size: nextSize, entrants: completedRound.winners, winners: [] },
    ],
    roundIndex: state.roundIndex + 1,
    matchIndex: 0,
    pendingWinner: null,
  };
}

export function getCupResult(
  state: TournamentState,
  songsById: Map<number, Song>,
): CupResult | null {
  const final = state.rounds.find((round) => round.size === 2);
  const semifinal = state.rounds.find((round) => round.size === 4);
  const championId = final?.winners[0];
  const runnerUpId = final?.entrants.find((id) => id !== championId);
  if (!championId || !runnerUpId || !semifinal) return null;

  const champion = songsById.get(championId);
  const runnerUp = songsById.get(runnerUpId);
  const semifinalists = semifinal.entrants
    .filter((id) => !semifinal.winners.includes(id))
    .map((id) => songsById.get(id))
    .filter((song): song is Song => Boolean(song));

  return champion && runnerUp ? { champion, runnerUp, semifinalists } : null;
}

function isIntegerArray(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.every((item) => Number.isSafeInteger(item) && item > 0)
  );
}

function isValidState(value: unknown, allowedIds: Set<number>) {
  if (!value || typeof value !== "object") return false;
  const state = value as TournamentState;
  if (!STAGES.has(state.stage)) return false;
  if (!Array.isArray(state.groups) || !state.groups.every(isIntegerArray)) {
    return false;
  }
  if (
    !isIntegerArray(state.groupWinners) ||
    !isIntegerArray(state.groupLosers) ||
    !isIntegerArray(state.pendingSelection) ||
    !isIntegerArray(state.wildcards) ||
    !Array.isArray(state.rounds)
  ) {
    return false;
  }

  const referencedIds = [
    ...state.groups.flat(),
    ...state.groupWinners,
    ...state.groupLosers,
    ...state.pendingSelection,
    ...state.wildcards,
  ];
  for (const round of state.rounds) {
    if (!isIntegerArray(round.entrants) || !isIntegerArray(round.winners)) {
      return false;
    }
    referencedIds.push(...round.entrants, ...round.winners);
  }

  return referencedIds.every((id) => allowedIds.has(id));
}

export function restoreTournament(
  raw: string | null,
  allowedIds: Set<number>,
): PersistedTournament | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as PersistedTournament;
    if (
      value.version !== 1 ||
      !isValidState(value.current, allowedIds) ||
      !Array.isArray(value.history) ||
      !value.history.every((state) => isValidState(state, allowedIds))
    ) {
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

export function roundLabel(size: KnockoutSize) {
  const labels: Record<KnockoutSize, string> = {
    32: "三十二强",
    16: "十六强",
    8: "八强",
    4: "四席争魁",
    2: "终局问鼎",
  };
  return labels[size];
}
