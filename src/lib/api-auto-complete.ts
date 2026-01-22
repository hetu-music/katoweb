// ============================================
// 自动补全相关类型和函数
// ============================================

/** 支持的音乐提供者 */
export type MusicProviderType = "netease" | "kugou";

/**
 * 搜索结果项 - 供用户选择
 */
export type SearchResultItem = {
  id: string | number; // 网易云是数字，酷狗是 FileHash 字符串
  name: string;
  album: string | null;
  albumartist: string | null;
  artists: string[];
  duration: number | null; // 毫秒（网易云）或秒（酷狗，会转换为秒）
  publishTime: string | number | null; // 时间戳（网易云）或日期字符串（酷狗）
};

/**
 * 搜索响应
 */
export type SearchResponse = {
  type: "search";
  results: SearchResultItem[];
  hasMore: boolean;
  total: number;
};

/**
 * 自动补全最终返回的 JSON 结构
 * 包含：album, genre, lyricist, composer, length, date, type, albumartist, arranger, comment, lyrics, nelink, kglink
 */
export type AutoCompleteResponse = {
  album?: string | null;
  genre?: string[] | null;
  lyricist?: string[] | null;
  composer?: string[] | null;
  length?: number | null; // 秒
  date?: string | null; // YYYY-MM-DD
  type?: string[] | null;
  albumartist?: string[] | null;
  arranger?: string[] | null;
  comment?: string | null;
  lyrics?: string | null;
  nelink?: string | null; // 网易云音乐链接: https://music.163.com/#/song?id={id}
  kglink?: string | null; // 酷狗音乐链接: https://www.kugou.com/song/#hash={hash}
};

/**
 * 详情响应
 */
export type DetailResponse = {
  type: "detail";
  data: AutoCompleteResponse;
};

/**
 * 搜索歌曲 - 根据关键词搜索
 *
 * @param keywords - 搜索关键词（歌曲标题）
 * @param csrfToken - CSRF token
 * @param provider - 音乐提供者，默认 netease
 * @param limit - 返回数量，默认 10
 * @returns 搜索结果列表
 */
export async function apiSearchSongs(
  keywords: string,
  csrfToken: string,
  provider: MusicProviderType = "netease",
  limit: number = 10,
): Promise<SearchResponse> {
  const params = new URLSearchParams({
    action: "search",
    keywords,
    provider,
    limit: limit.toString(),
  });

  const res = await fetch(`/api/admin/auto-complete?${params}`, {
    method: "GET",
    headers: {
      "x-csrf-token": csrfToken,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `搜索失败: ${res.status}`);
  }

  return res.json();
}

/**
 * 获取歌曲详情 - 根据用户选择的歌曲获取详细信息
 *
 * @param song - 用户选择的搜索结果项
 * @param csrfToken - CSRF token
 * @param provider - 音乐提供者，默认 netease
 * @returns 歌曲详情
 */
export async function apiGetSongDetail(
  song: SearchResultItem,
  csrfToken: string,
  provider: MusicProviderType = "netease",
): Promise<AutoCompleteResponse> {
  const params = new URLSearchParams({
    action: "detail",
    id: song.id.toString(),
    provider,
  });

  // 传递搜索结果中已有的信息
  if (song.duration !== null) {
    params.append("duration", song.duration.toString());
  }
  if (song.publishTime !== null) {
    params.append("publishTime", song.publishTime.toString());
  }
  if (song.album) {
    params.append("album", song.album);
  }
  if (song.albumartist) {
    params.append("albumartist", song.albumartist);
  }

  const res = await fetch(`/api/admin/auto-complete?${params}`, {
    method: "GET",
    headers: {
      "x-csrf-token": csrfToken,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `获取详情失败: ${res.status}`);
  }

  const response: DetailResponse = await res.json();
  return response.data;
}
