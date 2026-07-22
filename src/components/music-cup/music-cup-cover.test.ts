import assert from "node:assert/strict";
import test from "node:test";
import type { Song } from "@/lib/types";
import { getCupCoverUrls, getHetuMusicCoverUrl } from "./music-cup-cover";

function createSong(overrides: Partial<Song> = {}): Song {
  return {
    id: 9,
    title: "倾尽天下",
    album: null,
    year: null,
    genre: null,
    lyricist: null,
    composer: null,
    artist: ["河图"],
    length: null,
    updated_at: "",
    ...overrides,
  };
}

test("uses the public site's OG cover for catalog artwork", () => {
  const song = createSong({ hascover: true });

  assert.equal(
    getHetuMusicCoverUrl(song),
    "https://hetu-music.com/og-cover/9.jpg",
  );
  assert.deepEqual(getCupCoverUrls(song), [
    "https://cover.hetu-music.com/cover/9.jpg",
    "https://hetu-music.com/og-cover/9.jpg",
    "https://hetu-music.com/og-cover/default.jpg",
  ]);
});

test("falls back to the site's generic cover when artwork status is unknown", () => {
  const song = createSong({ id: 288, hascover: null });

  assert.equal(
    getHetuMusicCoverUrl(song),
    "https://hetu-music.com/og-cover/default.jpg",
  );
  assert.deepEqual(getCupCoverUrls(song), [
    "https://cover.hetu-music.com/cover/default.jpg",
    "https://hetu-music.com/og-cover/288.jpg",
    "https://hetu-music.com/og-cover/default.jpg",
  ]);
});
