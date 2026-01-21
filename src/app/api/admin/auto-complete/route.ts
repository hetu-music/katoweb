import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthenticatedUser } from "@/lib/server-auth";
import { z } from "zod";

// Hetu API 基础地址 - 只能在服务器端访问
const HETU_API_BASE = "http://hetu-api:3000";

// ============================================
// 类型定义
// ============================================

/**
 * 搜索结果项 - 返回给前端供用户选择
 */
const SearchResultItemSchema = z.object({
    id: z.number(),
    name: z.string(),
    album: z.string().nullable(),
    artists: z.array(z.string()),
    duration: z.number().nullable(), // 毫秒
    publishTime: z.number().nullable(), // 时间戳
});

export type SearchResultItem = z.infer<typeof SearchResultItemSchema>;

/**
 * 搜索结果响应
 */
export type SearchResponse = {
    type: "search";
    results: SearchResultItem[];
    hasMore: boolean;
    total: number;
};

/**
 * 自动补全最终返回给前端的 JSON 结构
 * 基于 SongSchema，但去掉了以下字段：
 * title, hascover, discnumber, disctotal, tracktotal, track, kugolink, qmlink, nelink, nmn_status, artist
 */
const AutoCompleteResponseSchema = z.object({
    album: z.string().max(100).nullable().optional(),
    genre: z.array(z.string().max(30)).nullable().optional(),
    lyricist: z.array(z.string().max(30)).nullable().optional(),
    composer: z.array(z.string().max(30)).nullable().optional(),
    length: z.number().int().min(1).nullable().optional(),
    date: z.string().max(30).nullable().optional(),
    type: z.array(z.string().max(30)).nullable().optional(),
    albumartist: z.array(z.string().max(30)).nullable().optional(),
    arranger: z.array(z.string().max(30)).nullable().optional(),
    comment: z.string().max(10000).nullable().optional(),
    lyrics: z.string().max(10000).nullable().optional(),
});

export type AutoCompleteResponse = z.infer<typeof AutoCompleteResponseSchema>;

/**
 * 详情响应
 */
export type DetailResponse = {
    type: "detail";
    data: AutoCompleteResponse;
};

// ============================================
// 工具函数
// ============================================

/**
 * 将毫秒转换为秒
 */
function msToSeconds(ms: number | null | undefined): number | null {
    if (ms === null || ms === undefined) return null;
    return Math.round(ms / 1000);
}

/**
 * 将时间戳转换为日期字符串 (YYYY-MM-DD)
 */
function timestampToDateString(
    timestamp: number | null | undefined,
): string | null {
    if (timestamp === null || timestamp === undefined) return null;
    const date = new Date(timestamp);
    return date.toISOString().split("T")[0];
}

// ============================================
// API 调用函数
// ============================================

/**
 * 搜索歌曲 - 使用 /cloudsearch 接口
 *
 * @param keywords - 搜索关键词
 * @param limit - 返回数量，默认 10
 * @returns 搜索结果列表
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

    const res = await fetch(`${HETU_API_BASE}/cloudsearch?${params}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!res.ok) {
        throw new Error(`Hetu API 搜索失败: ${res.status}`);
    }

    const data = await res.json();

    // 解析返回结果
    if (data.code !== 200 || !data.result?.songs) {
        return {
            type: "search",
            results: [],
            hasMore: false,
            total: 0,
        };
    }

    // 转换搜索结果格式
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: SearchResultItem[] = data.result.songs.map((song: any) => ({
        id: song.id,
        name: song.name,
        album: song.album?.name || null,
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
 * 获取歌词
 *
 * @param id - 歌曲 ID
 * @returns 歌词数据
 */
async function fetchLyrics(id: number): Promise<{
    lyric: string | null;
    lyricist: string[] | null;
    composer: string[] | null;
}> {
    try {
        const res = await fetch(`${HETU_API_BASE}/lyric?id=${id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!res.ok) {
            return { lyric: null, lyricist: null, composer: null };
        }

        const data = await res.json();

        if (data.code !== 200 || !data.lrc?.lyric) {
            return { lyric: null, lyricist: null, composer: null };
        }

        const rawLyric = data.lrc.lyric as string;

        // 解析歌词中的元数据（作词、作曲）
        const { lyricist, composer, cleanedLyric } = parseLyricMetadata(rawLyric);

        return {
            lyric: cleanedLyric,
            lyricist,
            composer,
        };
    } catch {
        return { lyric: null, lyricist: null, composer: null };
    }
}

/**
 * 解析 LRC 歌词中的元数据（作词、作曲）
 * 格式示例：
 * [00:00.000] 作词 : 张国祥
 * [00:01.000] 作曲 : 汤小康
 *
 * @param rawLyric - 原始 LRC 歌词
 * @returns 解析后的数据
 */
function parseLyricMetadata(rawLyric: string): {
    lyricist: string[] | null;
    composer: string[] | null;
    cleanedLyric: string;
} {
    const lines = rawLyric.split("\n");
    let lyricist: string[] | null = null;
    let composer: string[] | null = null;
    const contentLines: string[] = [];

    for (const line of lines) {
        // 匹配 [时间戳] 作词 : xxx 或 [时间戳] 作曲 : xxx
        const lyricistMatch = line.match(/\[\d{2}:\d{2}[.\d]*\]\s*作词\s*[:：]\s*(.+)/i);
        const composerMatch = line.match(/\[\d{2}:\d{2}[.\d]*\]\s*作曲\s*[:：]\s*(.+)/i);

        if (lyricistMatch) {
            // 解析作词，可能有多人（用 / 或 、 分隔）
            lyricist = lyricistMatch[1]
                .split(/[/、,，]/)
                .map((s) => s.trim())
                .filter(Boolean);
        } else if (composerMatch) {
            // 解析作曲，可能有多人
            composer = composerMatch[1]
                .split(/[/、,，]/)
                .map((s) => s.trim())
                .filter(Boolean);
        } else {
            // 保留非元数据行
            contentLines.push(line);
        }
    }

    return {
        lyricist: lyricist && lyricist.length > 0 ? lyricist : null,
        composer: composer && composer.length > 0 ? composer : null,
        cleanedLyric: contentLines.join("\n"),
    };
}

/**
 * 获取歌曲详情 - 根据 id 获取详细信息
 *
 * @param id - 歌曲 ID
 * @param duration - 时长（毫秒），从搜索结果中获取
 * @param publishTime - 发布时间戳，从搜索结果中获取
 * @param album - 专辑名，从搜索结果中获取
 * @returns 歌曲详情
 */
async function getSongDetail(
    id: number,
    duration: number | null,
    publishTime: number | null,
    album: string | null,
): Promise<AutoCompleteResponse> {
    // 获取歌词和作词作曲信息
    const { lyric, lyricist, composer } = await fetchLyrics(id);

    return {
        album: album,
        length: msToSeconds(duration),
        date: timestampToDateString(publishTime),
        lyrics: lyric,
        lyricist: lyricist,
        composer: composer,
        // 以下字段暂无 API 支持
        arranger: null,
        albumartist: null,
        genre: null,
        type: null,
        comment: null,
    };
}

// ============================================
// API 路由
// ============================================

export const GET = withAuth(
    async (request: NextRequest, _user: AuthenticatedUser) => {
        try {
            const { searchParams } = new URL(request.url);
            const action = searchParams.get("action") || "search";

            // 搜索模式：根据关键词搜索歌曲
            if (action === "search") {
                const keywords = searchParams.get("keywords");
                const limit = parseInt(searchParams.get("limit") || "10", 10);

                if (!keywords) {
                    return NextResponse.json(
                        { error: "缺少 keywords 参数" },
                        { status: 400 },
                    );
                }

                const searchResult = await searchSongs(keywords, limit);
                return NextResponse.json(searchResult);
            }

            // 详情模式：根据 id 获取歌曲详情
            if (action === "detail") {
                const id = searchParams.get("id");
                const duration = searchParams.get("duration");
                const publishTime = searchParams.get("publishTime");
                const album = searchParams.get("album");

                if (!id) {
                    return NextResponse.json(
                        { error: "缺少 id 参数" },
                        { status: 400 },
                    );
                }

                const detail = await getSongDetail(
                    parseInt(id, 10),
                    duration ? parseInt(duration, 10) : null,
                    publishTime ? parseInt(publishTime, 10) : null,
                    album || null,
                );

                return NextResponse.json({
                    type: "detail",
                    data: detail,
                } as DetailResponse);
            }

            return NextResponse.json(
                { error: "无效的 action 参数，支持 'search' 或 'detail'" },
                { status: 400 },
            );
        } catch (e: unknown) {
            if (
                e &&
                typeof e === "object" &&
                "message" in e &&
                typeof (e as Error).message === "string"
            ) {
                console.error("Auto-complete error:", (e as Error).message);
            } else {
                console.error("Auto-complete error:", e);
            }
            return NextResponse.json(
                { error: "自动补全请求失败" },
                { status: 500 },
            );
        }
    },
    { requireCSRF: true },
);
