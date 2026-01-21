import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthenticatedUser } from "@/lib/server-auth";
import { z } from "zod";

// Hetu API 基础地址 - 只能在服务器端访问
const HETU_API_BASE = "http://hetu-api:3000";

/**
 * 自动补全返回给前端的 JSON 结构
 * 基于 SongSchema，但去掉了以下字段：
 * title, hascover, discnumber, disctotal, tracktotal, track, kugolink, qmlink, nelink, nmn_status
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

// 导出类型供其他地方使用
export type AutoCompleteResponse = z.infer<typeof AutoCompleteResponseSchema>;

/**
 * 处理从 hetu-api 获取的原始数据，整合成符合 AutoCompleteResponse 类型的 JSON
 * TODO: 根据 hetu-api 实际返回的数据结构实现具体的处理逻辑
 *
 * @param rawData - hetu-api 返回的原始数据
 * @returns 处理后的歌曲信息，符合 AutoCompleteResponse 类型
 */
function processAutoCompleteData(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rawData: any,
): AutoCompleteResponse {
    // TODO: 在这里实现具体的数据处理逻辑
    // 示例结构（根据实际 API 返回调整）：
    // return {
    //   album: rawData.album || null,
    //   genre: rawData.genre ? [rawData.genre] : null,
    //   lyricist: rawData.lyricist ? [rawData.lyricist] : null,
    //   composer: rawData.composer ? [rawData.composer] : null,
    //   artist: rawData.artist ? [rawData.artist] : null,
    //   length: rawData.duration || null,
    //   date: rawData.releaseDate || null,
    //   type: rawData.type ? [rawData.type] : null,
    //   albumartist: rawData.albumartist ? [rawData.albumartist] : null,
    //   arranger: rawData.arranger ? [rawData.arranger] : null,
    //   comment: rawData.comment || null,
    //   lyrics: rawData.lyrics || null,
    // };

    // 暂时直接返回原始数据
    return rawData as AutoCompleteResponse;
}

/**
 * 从 hetu-api 获取歌曲信息
 *
 * @param title - 歌曲标题
 * @param album - 专辑名（可选）
 * @returns hetu-api 返回的原始数据
 */
async function fetchFromHetuApi(
    title: string,
    album: string | null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
    const params = new URLSearchParams({ title });
    if (album) params.append("album", album);

    // TODO: 根据实际 hetu-api 接口调整路径和参数
    const res = await fetch(`${HETU_API_BASE}/api/song/search?${params}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!res.ok) {
        if (res.status === 404) {
            return null;
        }
        throw new Error(`Hetu API 请求失败: ${res.status}`);
    }

    return res.json();
}

export const GET = withAuth(
    async (request: NextRequest, _user: AuthenticatedUser) => {
        try {
            const { searchParams } = new URL(request.url);
            const title = searchParams.get("title");
            const album = searchParams.get("album");

            if (!title) {
                return NextResponse.json(
                    { error: "缺少 title 参数" },
                    { status: 400 },
                );
            }

            // 1. 从 hetu-api 获取原始数据
            const rawData = await fetchFromHetuApi(title, album);

            if (!rawData) {
                return NextResponse.json(
                    { error: "未找到匹配的歌曲" },
                    { status: 404 },
                );
            }

            // 2. 处理数据，整合成符合 SongDetail 类型的 JSON
            const processedData = processAutoCompleteData(rawData);

            // 3. 返回处理后的数据给前端
            return NextResponse.json(processedData);
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
