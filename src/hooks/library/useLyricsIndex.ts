"use client";

import { useQuery } from "@tanstack/react-query";
import Fuse from "fuse.js";
import { useEffect, useMemo, useState } from "react";
import type { Song } from "@/lib/types";

export type LyricsEntry = { id: number; l: string };

export type LyricsSearchState = "idle" | "loading" | "ready" | "error";

export interface UseLyricsIndexResult {
  // 扩充了歌词后的 Fuse 实例（ready 后替代初始实例）
  lyricsFuseInstance: Fuse<
    Song & { searchableContent: string; lyricContent: string }
  > | null;
  // 按 id 映射的歌词索引 Map，供展示搜索命中片段用
  lyricsMap: Map<number, string>;
  state: LyricsSearchState;
}

type FuseExtended = Fuse<
  Song & { searchableContent: string; lyricContent: string }
>;

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

async function fetchLyricsIndex(): Promise<LyricsEntry[]> {
  const response = await fetch("/api/public/songs/lyrics-index");
  if (!response.ok) {
    throw new Error("fetch failed");
  }

  return response.json();
}

/**
 * 后台异步拉取全部歌词文本，构建包含歌词的 Fuse.js 索引。
 * 拉取是非阻塞的，不影响页面首屏，完成后无感刷新搜索能力。
 * 拉取结果缓存在模块级变量中，返回详情页再回来时可即时恢复，无需重新 fetch。
 */
export function useLyricsIndex(songs: Song[]): UseLyricsIndexResult {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (songs.length === 0) return;
    const timer = setTimeout(() => setEnabled(true), 1000);
    return () => clearTimeout(timer);
  }, [songs]);

  const query = useQuery({
    queryKey: ["lyrics-index"],
    queryFn: fetchLyricsIndex,
    enabled: enabled && songs.length > 0,
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });

  const builtIndex = useMemo(() => {
    if (!query.data) {
      return {
        map: new Map<number, string>(),
        fuse: null as FuseExtended | null,
      };
    }

    const { map, fuse } = buildFromEntries(songs, query.data);
    return { map, fuse };
  }, [songs, query.data]);

  const state: LyricsSearchState = !enabled
    ? "idle"
    : query.isPending
      ? "loading"
      : query.isError
        ? "error"
        : "ready";

  return {
    lyricsFuseInstance: builtIndex.fuse,
    lyricsMap: builtIndex.map,
    state,
  };
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
