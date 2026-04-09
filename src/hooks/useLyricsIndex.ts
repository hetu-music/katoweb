"use client";

import { useState, useEffect, useRef } from "react";
import Fuse from "fuse.js";
import { Song } from "@/lib/types";

export type LyricsEntry = { id: number; l: string };

export type LyricsSearchState = "idle" | "loading" | "ready" | "error";

export interface UseLyricsIndexResult {
  // 扩充了歌词后的 Fuse 实例（ready 后替代初始实例）
  lyricsFuseInstance: Fuse<Song & { searchableContent: string; lyricContent: string }> | null;
  // 按 id 映射的歌词索引 Map，供展示搜索命中片段用
  lyricsMap: Map<number, string>;
  state: LyricsSearchState;
}

// 模块级缓存：在同一浏览器会话中跨组件重挂载保留，避免返回页面时重新 fetch
let _cachedEntries: LyricsEntry[] | null = null;

type FuseExtended = Fuse<Song & { searchableContent: string; lyricContent: string }>;

function buildFromEntries(
  songs: Song[],
  entries: LyricsEntry[],
): { map: Map<number, string>; fuse: FuseExtended } {
  const map = new Map<number, string>();
  entries.forEach((entry) => map.set(entry.id, entry.l));

  const searchData = songs.map((song) => ({
    ...song,
    searchableContent: [
      song.title,
      song.album || "",
      (song.lyricist || []).join(" "),
      (song.composer || []).join(" "),
    ]
      .filter(Boolean)
      .join(" "),
    lyricContent: map.get(song.id) || "",
  }));

  const fuse = new Fuse(searchData, {
    keys: [
      { name: "title", weight: 0.35 },
      { name: "album", weight: 0.2 },
      { name: "lyricist", weight: 0.15 },
      { name: "composer", weight: 0.1 },
      { name: "arranger", weight: 0.05 },
      { name: "lyricContent", weight: 0.15 },
    ],
    threshold: 0.35,
    includeScore: true,
    ignoreLocation: true,
    findAllMatches: true,
    minMatchCharLength: 1,
    shouldSort: true,
    includeMatches: true,
  });

  return { map, fuse };
}

/**
 * 后台异步拉取全部歌词文本，构建包含歌词的 Fuse.js 索引。
 * 拉取是非阻塞的，不影响页面首屏，完成后无感刷新搜索能力。
 * 拉取结果缓存在模块级变量中，返回详情页再回来时可即时恢复，无需重新 fetch。
 */
export function useLyricsIndex(songs: Song[]): UseLyricsIndexResult {
  const [state, setState] = useState<LyricsSearchState>("idle");
  const [lyricsMap, setLyricsMap] = useState<Map<number, string>>(new Map());
  const [lyricsFuseInstance, setLyricsFuseInstance] = useState<FuseExtended | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current || songs.length === 0) return;
    hasFetched.current = true;

    // 有缓存时立即从缓存恢复，无需网络请求
    if (_cachedEntries) {
      const { map, fuse } = buildFromEntries(songs, _cachedEntries);
      setLyricsMap(map);
      setLyricsFuseInstance(fuse);
      setState("ready");
      return;
    }

    const fetchIndex = async () => {
      setState("loading");
      try {
        const res = await fetch("/api/public/songs/lyrics-index");
        if (!res.ok) throw new Error("fetch failed");
        const data: LyricsEntry[] = await res.json();

        // 缓存供后续重挂载使用
        _cachedEntries = data;

        const { map, fuse } = buildFromEntries(songs, data);
        setLyricsMap(map);
        setLyricsFuseInstance(fuse);
        setState("ready");
      } catch {
        setState("error");
      }
    };

    // 页面交互后 1s 再拉取，确保不与首屏资源竞争
    const timer = setTimeout(fetchIndex, 1000);
    return () => clearTimeout(timer);
  }, [songs]);

  return { lyricsFuseInstance, lyricsMap, state };
}

/**
 * 从歌词文本中提取包含搜索词的简短片段，用于搜索结果展示。
 * 只截取匹配点附近少量上下文，由 CSS truncate 负责视觉截断。
 */
export function extractLyricsSnippet(
  lyricsText: string,
  query: string,
  maxLength = 36,
): string {
  if (!lyricsText || !query) return "";
  const lower = lyricsText.toLowerCase();
  const queryLower = query.toLowerCase();
  const idx = lower.indexOf(queryLower);
  if (idx === -1) return "";

  const start = Math.max(0, idx - 8);
  const end = Math.min(lyricsText.length, idx + query.length + maxLength);
  return lyricsText.slice(start, end).trim();
}
