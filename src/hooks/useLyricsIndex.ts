"use client";

import { useState, useEffect, useRef } from "react";
import Fuse from "fuse.js";
import { Song } from "@/lib/types";
import { createFuseInstance } from "@/lib/utils-song";

export type LyricsEntry = { id: number; l: string };

export type LyricsSearchState = "idle" | "loading" | "ready" | "error";

export interface UseLyricsIndexResult {
  // 扩充了歌词后的 Fuse 实例（ready 后替代初始实例）
  lyricsFuseInstance: Fuse<Song & { searchableContent: string; lyricContent: string }> | null;
  // 按 id 映射的歌词索引 Map，供展示搜索命中片段用
  lyricsMap: Map<number, string>;
  state: LyricsSearchState;
}

/**
 * 后台异步拉取全部歌词文本，构建包含歌词的 Fuse.js 索引。
 * 拉取是非阻塞的，不影响页面首屏，完成后无感刷新搜索能力。
 */
export function useLyricsIndex(songs: Song[]): UseLyricsIndexResult {
  const [state, setState] = useState<LyricsSearchState>("idle");
  const [lyricsMap, setLyricsMap] = useState<Map<number, string>>(new Map());
  const [lyricsFuseInstance, setLyricsFuseInstance] = useState<
    Fuse<Song & { searchableContent: string; lyricContent: string }> | null
  >(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current || songs.length === 0) return;
    hasFetched.current = true;

    const fetchIndex = async () => {
      setState("loading");
      try {
        const res = await fetch("/api/public/songs/lyrics-index");
        if (!res.ok) throw new Error("fetch failed");
        const data: LyricsEntry[] = await res.json();

        // 构建 id -> 歌词 Map
        const map = new Map<number, string>();
        data.forEach((entry) => map.set(entry.id, entry.l));
        setLyricsMap(map);

        // 构建包含歌词的 Fuse 索引
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
            // 歌词权重较低但被包含
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
 * 从 Fuse 匹配结果中提取命中的歌词片段，用于搜索结果展示
 */
export function extractLyricsSnippet(
  lyricsText: string,
  query: string,
  maxLength = 60,
): string {
  if (!lyricsText || !query) return "";
  const lower = lyricsText.toLowerCase();
  const queryLower = query.toLowerCase();
  const idx = lower.indexOf(queryLower);
  if (idx === -1) return "";

  const start = Math.max(0, idx - 15);
  const end = Math.min(lyricsText.length, idx + query.length + maxLength);
  let snippet = lyricsText.slice(start, end).trim();
  if (start > 0) snippet = "..." + snippet;
  if (end < lyricsText.length) snippet = snippet + "...";
  return snippet;
}
