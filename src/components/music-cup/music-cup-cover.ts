import type { Song } from "@/lib/types";
import { getCoverUrl } from "@/lib/utils/utils-song";

const HETU_MUSIC_ORIGIN = "https://hetu-music.com";

function getCatalogCoverFilename(song: Song) {
  if (song.hascover === true) return `${song.id}.jpg`;
  if (song.hascover === false) return "proto.jpg";
  return "default.jpg";
}

export function getHetuMusicCoverUrl(song: Song) {
  return `${HETU_MUSIC_ORIGIN}/og-cover/${getCatalogCoverFilename(song)}`;
}

/**
 * The cover CDN can reject browser/image-optimizer requests with a 403. The
 * public site's OG proxy is the authoritative fallback and also exposes the
 * generic catalog covers for songs without their own artwork.
 */
export function getCupCoverUrls(song: Song) {
  return [
    getCoverUrl(song),
    `${HETU_MUSIC_ORIGIN}/og-cover/${song.id}.jpg`,
    getHetuMusicCoverUrl(song),
    `${HETU_MUSIC_ORIGIN}/og-cover/default.jpg`,
  ].filter((url, index, urls) => urls.indexOf(url) === index);
}
