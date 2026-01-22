import type {
    SearchResponse,
    AutoCompleteResponse,
} from "@/lib/api-auto-complete";

/**
 * 音乐搜索提供者接口
 * 所有后端提供者都需要实现此接口
 */
export interface MusicProvider {
    /** 提供者名称标识 */
    name: string;

    /** 搜索歌曲 */
    searchSongs(keywords: string, limit?: number): Promise<SearchResponse>;

    /** 获取歌曲详情 */
    getSongDetail(
        id: number | string,
        duration: number | null,
        publishTime: number | string | null,
        album: string | null,
        albumartist: string | null,
    ): Promise<AutoCompleteResponse>;
}

// ============================================
// 工具函数
// ============================================

/** 将毫秒转换为秒 */
export const msToSeconds = (ms: number | null | undefined): number | null =>
    ms !== null && ms !== undefined ? Math.round(ms / 1000) : null;

/** 将时间戳转换为日期字符串 (YYYY-MM-DD) */
export const timestampToDateString = (
    timestamp: number | null | undefined,
): string | null =>
    timestamp !== null && timestamp !== undefined
        ? new Date(timestamp).toISOString().split("T")[0]
        : null;

/** 歌词元数据解析结果 */
export type LyricMetadata = {
    lyric: string;
    lyricist: string[] | null;
    composer: string[] | null;
    arranger: string[] | null;
};

/**
 * 解析 LRC 格式歌词中的元数据（作词、作曲、编曲）
 * 支持格式：[时间] 作词/作曲/编曲 : 内容
 */
export function parseLyricMetadata(rawLyric: string): LyricMetadata {
    const lines = rawLyric.split("\n");
    let lyricist: string[] | null = null;
    let composer: string[] | null = null;
    let arranger: string[] | null = null;

    const splitNames = (str: string) =>
        str
            .split(/[/、,，]/)
            .map((s) => s.trim())
            .filter(Boolean);

    for (const line of lines) {
        // 匹配带时间戳的格式：[00:00.00] 作词 : xxx
        const lyricistMatch = line.match(
            /\[\d{2}:\d{2}[.\d]*\]\s*作词\s*[:：]\s*(.+)/i,
        );
        const composerMatch = line.match(
            /\[\d{2}:\d{2}[.\d]*\]\s*作曲\s*[:：]\s*(.+)/i,
        );
        const arrangerMatch = line.match(
            /\[\d{2}:\d{2}[.\d]*\]\s*编曲\s*[:：]\s*(.+)/i,
        );

        if (lyricistMatch && !lyricist) {
            lyricist = splitNames(lyricistMatch[1]);
        } else if (composerMatch && !composer) {
            composer = splitNames(composerMatch[1]);
        } else if (arrangerMatch && !arranger) {
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

