import {
  getServiceClient,
  getUserClient,
  fetchAll,
  TABLES,
} from "./supabase-server";
import { Song, SongDetail, SONG_LIST_VIEW_FIELDS } from "./types";
import { mapAndSortSongs } from "./utils-song";
import { processLyrics } from "./utils-lyrics";

/**
 * 获取所有歌曲数据
 *
 * - 公共展示路径（不传 accessToken）：高权限客户端 + 全量分页，确保获取全部数据
 * - Admin 路径（传 accessToken）：用户权限客户端，操作 temp 表
 *
 * @param table        - 表名，默认 TABLES.MUSIC；Admin 路径传 TABLES.ADMIN
 * @param accessToken  - 登录用户的 accessToken（仅 Admin 路径需要）
 * @param forListView  - 为 true 时只获取列表字段，排除歌词等大字段
 */
export async function getSongs(
  table: string = TABLES.MUSIC,
  accessToken?: string,
  forListView: boolean = false,
): Promise<Song[]> {
  const selectFields = forListView ? SONG_LIST_VIEW_FIELDS.join(",") : "*";

  // 公共主表：高权限 + 分页全量获取
  if (table === TABLES.MUSIC && !accessToken) {
    const supabase = getServiceClient();
    if (!supabase) {
      console.warn(
        "[getSongs] Service client unavailable, returning empty data",
      );
      return [];
    }
    const data = await fetchAll<Record<string, unknown>>(
      supabase,
      table,
      selectFields,
      (q) => q.order("id", { ascending: true }),
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return mapAndSortSongs(data as any);
  }

  // Admin / 其他表：用户权限客户端
  const supabase = getUserClient(accessToken);
  if (!supabase) {
    console.warn("[getSongs] User client unavailable, returning empty data");
    return [];
  }
  const { data, error } = await supabase
    .from(table)
    .select(selectFields)
    .order("id", { ascending: true });

  if (error) {
    console.error("[getSongs] Supabase error:", error);
    throw new Error("Failed to fetch songs");
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return mapAndSortSongs(data as any);
}

/**
 * 根据 ID 获取歌曲详情（兼容 music 和 temp 表）
 */
export async function getSongById(
  id: number,
  table: string = TABLES.MUSIC,
  accessToken?: string,
): Promise<SongDetail | null> {
  const supabase =
    table === TABLES.MUSIC && !accessToken
      ? getServiceClient()
      : getUserClient(accessToken);

  if (!supabase) {
    console.warn("[getSongById] Supabase client unavailable");
    return null;
  }

  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("[getSongById] query failed for id:", id, error);
    return null;
  }
  if (!data) {
    console.warn("[getSongById] No song found for id:", id);
    return null;
  }

  let normalLyrics = "";
  if (data.lyrics) {
    try {
      normalLyrics = processLyrics(data.lyrics).lyrics;
    } catch {
      console.error("[getSongById] Error processing lyrics for song", id);
      normalLyrics = "歌词转换失败，请检查LRC格式";
    }
  }

  return {
    ...data,
    year: data.date ? new Date(data.date).getFullYear() : null,
    normalLyrics,
  } as SongDetail & { normalLyrics: string };
}

/**
 * 新增歌曲（仅用于 Admin 路径，操作 temp 表）
 */
export async function createSong(
  song: Partial<Song>,
  table: string = TABLES.ADMIN,
  accessToken?: string,
): Promise<Song> {
  const supabase = getUserClient(accessToken);
  if (!supabase) throw new Error("[createSong] User client unavailable");

  const { data, error } = await supabase
    .from(table)
    .insert([song])
    .select()
    .single();

  if (error) throw new Error("Failed to create song");
  return data as Song;
}

/**
 * 更新歌曲（仅用于 Admin 路径，操作 temp 表，含乐观锁）
 */
export async function updateSong(
  id: number,
  song: Partial<Song>,
  table: string = TABLES.ADMIN,
  accessToken?: string,
): Promise<Song> {
  const supabase = getUserClient(accessToken);
  if (!supabase) throw new Error("[updateSong] User client unavailable");

  let query = supabase.from(table).update(song).eq("id", id);
  if (song.updated_at) {
    query = query.eq("updated_at", song.updated_at);
  }
  const { data, error } = await query.select().single();

  if (error) {
    if (
      error.code === "PGRST116" ||
      error.message.includes("Results contain 0 rows")
    ) {
      const conflictError: Error & { status?: number } = new Error(
        "乐观锁冲突",
      );
      conflictError.status = 409;
      throw conflictError;
    }
    throw new Error("Failed to update song");
  }
  return data as Song;
}
