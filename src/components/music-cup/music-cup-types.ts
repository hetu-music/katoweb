import type { Song } from "@/lib/types";

export type CupStage =
  "landing" | "draw" | "group" | "wildcard" | "knockout" | "result";

export type KnockoutSize = 32 | 16 | 8 | 4 | 2;

export interface KnockoutRound {
  size: KnockoutSize;
  entrants: number[];
  winners: number[];
}

export interface TournamentState {
  stage: CupStage;
  groups: number[][];
  groupIndex: number;
  groupWinners: number[];
  groupLosers: number[];
  pendingSelection: number[];
  wildcards: number[];
  rounds: KnockoutRound[];
  roundIndex: number;
  matchIndex: number;
  pendingWinner: number | null;
  createdAt: number | null;
}

export interface PersistedTournament {
  version: 1;
  current: TournamentState;
  history: TournamentState[];
}

export interface CupResult {
  champion: Song;
  runnerUp: Song;
  semifinalists: Song[];
}
