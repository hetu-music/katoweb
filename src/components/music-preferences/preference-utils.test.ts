import assert from "node:assert/strict";
import test from "node:test";
import type { Song } from "@/lib/types";
import {
  applyPreferenceOutcome,
  buildPreferenceTiers,
  createInitialRatings,
  getPreferenceBudget,
  selectPreferencePair,
} from "./preference-utils";

const songs: Song[] = [1, 2, 3, 4].map((id) => ({
  id,
  title: `Song ${id}`,
  album: null,
  year: null,
  genre: null,
  lyricist: null,
  composer: null,
  arranger: null,
  artist: ["河图"],
  length: null,
  hascover: null,
  date: null,
  type: null,
  updated_at: "",
  has_audio: false,
}));

test("preference ratings update both songs and reduce uncertainty", () => {
  const initial = createInitialRatings(songs.map((song) => song.id));
  const next = applyPreferenceOutcome(initial, 1, 2, 1);
  const winner = next.find((rating) => rating.songId === 1);
  const loser = next.find((rating) => rating.songId === 2);
  assert.ok(winner && winner.rating > 1500);
  assert.ok(loser && loser.rating < 1500);
  assert.equal(winner?.comparisons, 1);
  assert.ok(winner && winner.uncertainty < 350);
});

test("pair selector avoids a previously compared pair while alternatives exist", () => {
  const ratings = createInitialRatings(songs.map((song) => song.id));
  const pair = selectPreferencePair(songs, ratings, [
    { leftSongId: 1, rightSongId: 2, outcome: 1 },
  ]);
  assert.ok(pair);
  assert.notDeepEqual(new Set([pair.left.id, pair.right.id]), new Set([1, 2]));
});

test("tiers and comparison budget are stable", () => {
  const ratings = createInitialRatings([1, 2, 3]);
  ratings[0].rating = 1700;
  ratings[1].rating = 1600;
  const tiers = buildPreferenceTiers(ratings);
  assert.equal(tiers[0].songs[0].songId, 1);
  assert.equal(getPreferenceBudget(48), 362);
});
