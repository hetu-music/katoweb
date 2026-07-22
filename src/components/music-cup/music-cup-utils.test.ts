import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCupPool,
  CURATED_SONG_IDS,
  FALLBACK_SONGS,
  selectCupSongs,
} from "./music-cup-data";
import {
  commitKnockoutWinner,
  getCupResult,
  GROUP_LABELS,
  lockCurrentGroup,
  restoreTournament,
  startKnockout,
  startTournament,
  STORAGE_KEY,
} from "./music-cup-utils";

test("curated pool contains exactly 48 unique songs", () => {
  assert.equal(CURATED_SONG_IDS.length, 48);
  assert.equal(new Set(CURATED_SONG_IDS).size, 48);
  assert.deepEqual(GROUP_LABELS, "子丑寅卯辰巳午未申酉戌亥".split(""));
  assert.equal(STORAGE_KEY, "hetu-music-cup:v1");
});

test("fallback songs include the album and year published on hetu-music.com", () => {
  const songsById = new Map(FALLBACK_SONGS.map((song) => [song.id, song]));

  assert.deepEqual(
    { album: songsById.get(21)?.album, year: songsById.get(21)?.year },
    { album: "唱给你的歌", year: 2008 },
  );
  assert.deepEqual(
    { album: songsById.get(130)?.album, year: songsById.get(130)?.year },
    { album: "蚍蜉渡海", year: 2017 },
  );
  assert.deepEqual(
    { album: songsById.get(288)?.album, year: songsById.get(288)?.year },
    { album: "寒衣调", year: null },
  );
  assert.ok(FALLBACK_SONGS.every((song) => song.album));
});

test("live songs retain live fields while missing album metadata is filled", () => {
  const liveSong = {
    ...FALLBACK_SONGS[0],
    album: null,
    year: null,
    has_audio: false,
  };
  const selected = selectCupSongs([liveSong]);
  const mergedSong = selected.find((song) => song.id === liveSong.id);

  assert.equal(mergedSong?.album, "倾尽天下");
  assert.equal(mergedSong?.year, 2013);
  assert.equal(mergedSong?.has_audio, false);
});

test("all-song and favorites pools always resolve to 48 unique songs", () => {
  const extraSongs = Array.from({ length: 60 }, (_, index) => ({
    ...FALLBACK_SONGS[index % FALLBACK_SONGS.length],
    id: 1000 + index,
    title: `额外歌曲 ${index}`,
  }));
  const sampled = buildCupPool({ mode: "all", allSongs: extraSongs });
  assert.equal(sampled.songs.length, 48);
  assert.equal(new Set(sampled.songs.map((song) => song.id)).size, 48);
  assert.equal(sampled.sourceCount, 60);
  assert.equal(sampled.sampledCount, 12);

  const sparse = buildCupPool({
    mode: "favorites",
    allSongs: extraSongs.slice(0, 3),
    favoriteIds: [1000, 1001],
  });
  assert.equal(sparse.songs.length, 48);
  assert.equal(new Set(sparse.songs.map((song) => song.id)).size, 48);
  assert.equal(sparse.sourceCount, 2);
  assert.equal(sparse.filledCount, 46);
});

test("a complete tournament advances from draw to one champion", () => {
  let state = startTournament(CURATED_SONG_IDS);
  assert.equal(state.groups.length, 12);
  assert.ok(state.groups.every((group) => group.length === 4));
  assert.equal(new Set(state.groups.flat()).size, 48);

  state = { ...state, stage: "group" };
  for (let groupIndex = 0; groupIndex < 12; groupIndex += 1) {
    state = {
      ...state,
      pendingSelection: state.groups[groupIndex].slice(0, 2),
    };
    state = lockCurrentGroup(state);
  }

  assert.equal(state.stage, "wildcard");
  assert.equal(state.groupWinners.length, 24);
  assert.equal(state.groupLosers.length, 24);
  state = { ...state, pendingSelection: state.groupLosers.slice(0, 8) };
  state = startKnockout(state);

  assert.equal(state.stage, "knockout");
  assert.equal(state.rounds[0].entrants.length, 32);
  assert.equal(new Set(state.rounds[0].entrants).size, 32);

  let matchCount = 0;
  while (state.stage === "knockout") {
    const round = state.rounds[state.roundIndex];
    const winner = round.entrants[state.matchIndex * 2];
    state = commitKnockoutWinner(state, winner);
    matchCount += 1;
  }

  assert.equal(matchCount, 31);
  assert.equal(state.rounds.length, 5);
  assert.deepEqual(
    state.rounds.map((round) => round.size),
    [32, 16, 8, 4, 2],
  );

  const songsById = new Map(FALLBACK_SONGS.map((song) => [song.id, song]));
  const result = getCupResult(state, songsById);
  assert.ok(result);
  assert.notEqual(result.champion.id, result.runnerUp.id);
  assert.equal(result.semifinalists.length, 2);
});

test("persistence rejects stale song ids", () => {
  const state = startTournament(CURATED_SONG_IDS);
  const valid = JSON.stringify({ version: 1, current: state, history: [] });
  assert.ok(restoreTournament(valid, new Set(CURATED_SONG_IDS)));

  const invalid = JSON.stringify({
    version: 1,
    current: { ...state, pendingSelection: [999999] },
    history: [],
  });
  assert.equal(restoreTournament(invalid, new Set(CURATED_SONG_IDS)), null);
});
