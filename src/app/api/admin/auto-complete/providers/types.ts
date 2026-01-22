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
        id: number,
        duration: number | null,
        publishTime: number | null,
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
