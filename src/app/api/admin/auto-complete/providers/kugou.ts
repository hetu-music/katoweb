import type {
    SearchResultItem,
    SearchResponse,
    AutoCompleteResponse,
} from "@/lib/api-auto-complete";
import { type MusicProvider } from "./types";

// ============================================
// 常量定义
// ============================================

const KUGOU_API_BASE = "http://kgm:3000";

// ============================================
// 酷狗音乐提供者
// ============================================

export const kugouProvider: MusicProvider = {
    name: "kugou",

    async searchSongs(
        keywords: string,
        limit: number = 10,
    ): Promise<SearchResponse> {
        const params = new URLSearchParams({
            keywords,
            pagesize: limit.toString(),
        });

        const res = await fetch(`${KUGOU_API_BASE}/search?${params}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) throw new Error(`酷狗 API 搜索失败: ${res.status}`);

        const data = await res.json();

        // 酷狗 API 返回结构：{ data: { lists: [...], total: number } }
        if (!data.data?.lists || !Array.isArray(data.data.lists)) {
            return { type: "search", results: [], hasMore: false, total: 0 };
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const results: SearchResultItem[] = data.data.lists.map((song: any) => {
            // 处理歌手数组：song.Singers 是 [{name: "xxx", id: xxx}, ...] 格式
            const singers: Array<{ name: string; id: number }> = song.Singers || [];
            const artistNames = singers.map((s) => s.name);
            const firstArtist = artistNames.length > 0 ? artistNames[0] : null;

            return {
                id: song.FileHash, // 酷狗使用 FileHash 作为 ID
                name: song.OriSongName || song.FileName?.split(" - ").pop() || "",
                album: song.AlbumName || null,
                albumartist: firstArtist,
                artists: artistNames,
                duration: song.Duration || null, // 酷狗返回秒
                publishTime: song.PublishDate || null, // 酷狗返回日期字符串如 "2026-01-16"
            };
        });

        return {
            type: "search",
            results,
            hasMore: results.length < (data.data.total || 0),
            total: data.data.total || results.length,
        };
    },

    async getSongDetail(
        id: number | string,
        duration: number | null,
        publishTime: number | string | null,
        album: string | null,
        albumartist: string | null,
    ): Promise<AutoCompleteResponse> {
        // 酷狗的详情 API 可以进一步获取歌词等信息
        // 但目前基础信息已经从搜索结果中获取
        // 如果需要歌词等额外信息，可以在此扩展

        return {
            album,
            length: duration, // 酷狗已经是秒，无需转换
            date: typeof publishTime === "string" ? publishTime : null, // 酷狗直接返回日期字符串
            lyrics: null, // 酷狗获取歌词需要额外接口，暂不实现
            lyricist: null,
            composer: null,
            arranger: null,
            albumartist: albumartist ? [albumartist] : null,
            genre: null,
            type: null,
            comment: null,
            kglink: `https://www.kugou.com/song/#hash=${id}`,
        };
    },
};
