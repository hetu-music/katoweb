import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthenticatedUser } from "@/lib/server-auth";
import type {
    SearchResultItem,
    SearchResponse,
    AutoCompleteResponse,
    DetailResponse,
} from "@/lib/api-auto-complete";

// ============================================
// 常量定义
// ============================================

const HETU_API_BASE = "http://hetu-api:3000";

// ============================================
// 工具函数
// ============================================

/** 将毫秒转换为秒 */
const msToSeconds = (ms: number | null | undefined): number | null =>
    ms !== null && ms !== undefined ? Math.round(ms / 1000) : null;

/** 将时间戳转换为日期字符串 (YYYY-MM-DD) */
const timestampToDateString = (timestamp: number | null | undefined): string | null =>
    timestamp !== null && timestamp !== undefined
        ? new Date(timestamp).toISOString().split("T")[0]
        : null;

// ============================================
// 外部 API 交互逻辑
// ============================================

/**
 * 搜索歌曲 (Search)
 */
async function searchSongs(
    keywords: string,
    limit: number = 10,
): Promise<SearchResponse> {
    const params = new URLSearchParams({
        keywords,
        limit: limit.toString(),
        type: "1", // 单曲搜索
    });

    const res = await fetch(`${HETU_API_BASE}/search?${params}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) throw new Error(`Hetu API 搜索失败: ${res.status}`);

    const data = await res.json();

    if (data.code !== 200 || !data.result?.songs) {
        return { type: "search", results: [], hasMore: false, total: 0 };
    }

    // 映射结果
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: SearchResultItem[] = data.result.songs.map((song: any) => ({
        id: song.id,
        name: song.name,
        album: song.album?.name || null,
        albumartist: song.album?.artist?.name || null,
        artists: song.artists?.map((a: { name: string }) => a.name) || [],
        duration: song.duration || null,
        publishTime: song.album?.publishTime || null,
    }));

    return {
        type: "search",
        results,
        hasMore: data.result.hasMore || false,
        total: data.result.songCount || results.length,
    };
}

/**
 * 获取并解析歌词元数据
 */
async function fetchLyrics(id: number): Promise<{
    lyric: string | null;
    lyricist: string[] | null;
    composer: string[] | null;
    arranger: string[] | null;
}> {
    try {
        const res = await fetch(`${HETU_API_BASE}/lyric?id=${id}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) return { lyric: null, lyricist: null, composer: null, arranger: null };

        const data = await res.json();
        if (data.code !== 200 || !data.lrc?.lyric) {
            return { lyric: null, lyricist: null, composer: null, arranger: null };
        }

        return parseLyricMetadata(data.lrc.lyric as string);
    } catch {
        return { lyric: null, lyricist: null, composer: null, arranger: null };
    }
}

/**
 * 解析 LRC 格式歌词中的元数据
 */
function parseLyricMetadata(rawLyric: string) {
    const lines = rawLyric.split("\n");
    let lyricist: string[] | null = null;
    let composer: string[] | null = null;
    let arranger: string[] | null = null;

    for (const line of lines) {
        // 简单正则匹配 [时间] 标签 : 内容
        const lyricistMatch = line.match(/\[\d{2}:\d{2}[.\d]*\]\s*作词\s*[:：]\s*(.+)/i);
        const composerMatch = line.match(/\[\d{2}:\d{2}[.\d]*\]\s*作曲\s*[:：]\s*(.+)/i);
        const arrangerMatch = line.match(/\[\d{2}:\d{2}[.\d]*\]\s*编曲\s*[:：]\s*(.+)/i);

        const splitNames = (str: string) => str.split(/[/、,，]/).map((s) => s.trim()).filter(Boolean);

        if (lyricistMatch) {
            lyricist = splitNames(lyricistMatch[1]);
        } else if (composerMatch) {
            composer = splitNames(composerMatch[1]);
        } else if (arrangerMatch) {
            arranger = splitNames(arrangerMatch[1]);
        }
    }

    return {
        lyricist: lyricist?.length ? lyricist : null,
        composer: composer?.length ? composer : null,
        arranger: arranger?.length ? arranger : null,
        lyric: rawLyric,
    };
}

/**
 * 组装歌曲详情信息
 */
async function getSongDetail(
    id: number,
    duration: number | null,
    publishTime: number | null,
    album: string | null,
    albumartist: string | null,
): Promise<AutoCompleteResponse> {
    // 并行获取补充信息（如果有更多 API 可在此扩展）
    const { lyric, lyricist, composer, arranger } = await fetchLyrics(id);

    return {
        album,
        length: msToSeconds(duration),
        date: timestampToDateString(publishTime),
        lyrics: lyric,
        lyricist,
        composer,
        arranger,
        albumartist: albumartist ? [albumartist] : null,
        genre: null, // 暂无数据源
        type: null,  // 暂无数据源
        comment: null,
    };
}

// ============================================
// API 路由 Handler
// ============================================

export const GET = withAuth(
    async (request: NextRequest, _user: AuthenticatedUser) => {
        try {
            const { searchParams } = new URL(request.url);
            const action = searchParams.get("action") || "search";

            // 1. 搜索模式
            if (action === "search") {
                const keywords = searchParams.get("keywords");
                const limit = parseInt(searchParams.get("limit") || "10", 10);

                if (!keywords) {
                    return NextResponse.json({ error: "缺少 keywords 参数" }, { status: 400 });
                }

                const data = await searchSongs(keywords, limit);
                return NextResponse.json(data);
            }

            // 2. 详情模式
            if (action === "detail") {
                const id = searchParams.get("id");
                if (!id) {
                    return NextResponse.json({ error: "缺少 id 参数" }, { status: 400 });
                }

                // 从查询参数获取前端透传的基础信息
                const duration = searchParams.get("duration");
                const publishTime = searchParams.get("publishTime");
                const album = searchParams.get("album");
                const albumartist = searchParams.get("albumartist");

                const data = await getSongDetail(
                    parseInt(id, 10),
                    duration ? parseInt(duration, 10) : null,
                    publishTime ? parseInt(publishTime, 10) : null,
                    album || null,
                    albumartist || null,
                );

                const response: DetailResponse = { type: "detail", data };
                return NextResponse.json(response);
            }

            return NextResponse.json({ error: "无效的 action 参数" }, { status: 400 });

        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            console.error("Auto-complete error:", msg);
            return NextResponse.json({ error: "自动补全请求失败" }, { status: 500 });
        }
    },
    { requireCSRF: true }
);
