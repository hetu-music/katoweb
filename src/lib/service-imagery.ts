import { createSupabaseDataClient } from "./supabase-server";
import { TABLE_NAMES } from "./constants";
import type {
  ImageryCategory,
  ImageryItem,
  ImageryOccurrence,
  SongRef,
} from "./types";

// 复用 MAIN 表的高权限客户端来访问所有意象相关表
function getSupabase() {
  return createSupabaseDataClient(TABLE_NAMES.MAIN);
}

const PAGE_SIZE = 1000;

/**
 * Supabase/PostgREST 默认每次最多返回 1000 行。
 * 此函数通过分页循环拉取指定表的全部数据。
 */
async function fetchAll<T>(
  supabase: NonNullable<ReturnType<typeof getSupabase>>,
  table: string,
  selectFields: string,
  extraFilter?: (
    query: ReturnType<typeof supabase.from>,
  ) => ReturnType<typeof supabase.from>,
): Promise<T[]> {
  const results: T[] = [];
  let from = 0;

  while (true) {
    let query = supabase
      .from(table)
      .select(selectFields)
      .range(from, from + PAGE_SIZE - 1);

    if (extraFilter) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      query = extraFilter(query as any) as any;
    }

    const { data, error } = await query;

    if (error) {
      console.error(`Failed to fetch ${table} (range ${from}–${from + PAGE_SIZE - 1}):`, error);
      break;
    }

    if (!data || data.length === 0) break;

    results.push(...(data as T[]));

    if (data.length < PAGE_SIZE) break; // last page
    from += PAGE_SIZE;
  }

  return results;
}

export async function getImageryCategories(): Promise<ImageryCategory[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  // Categories are small — a single query is fine, but use fetchAll for consistency
  const data = await fetchAll<ImageryCategory>(
    supabase,
    "imagery_categories",
    "id, name, parent_id, level, description",
  );
  return data;
}

export async function getImageryWithCounts(): Promise<ImageryItem[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  // Fetch all imagery (may exceed 1000)
  const imageryData = await fetchAll<{ id: number; name: string }>(
    supabase,
    "imagery",
    "id, name",
  );

  if (imageryData.length === 0) return [];

  // Fetch all occurrences (may exceed 1000)
  const occurrences = await fetchAll<
    Pick<ImageryOccurrence, "imagery_id" | "category_id">
  >(supabase, "imagery_occurrences", "imagery_id, category_id");

  // Group occurrences by imagery_id
  const countMap = new Map<number, { count: number; categoryIds: Set<number> }>();
  for (const occ of occurrences) {
    const existing = countMap.get(occ.imagery_id);
    if (existing) {
      existing.count++;
      existing.categoryIds.add(occ.category_id);
    } else {
      countMap.set(occ.imagery_id, {
        count: 1,
        categoryIds: new Set([occ.category_id]),
      });
    }
  }

  return imageryData.map((i) => {
    const stats = countMap.get(i.id);
    return {
      id: i.id,
      name: i.name,
      count: stats?.count ?? 0,
      categoryIds: stats ? Array.from(stats.categoryIds) : [],
    };
  });
}

export async function getSongsForImagery(imageryId: number): Promise<
  Array<{
    song: SongRef;
    categoryId: number;
    occurrenceCount: number;
  }>
> {
  const supabase = getSupabase();
  if (!supabase) return [];

  // A single imagery rarely appears in more than 1000 songs, but paginate anyway
  const occurrences = await fetchAll<
    Pick<ImageryOccurrence, "song_id" | "category_id">
  >(supabase, "imagery_occurrences", "song_id, category_id", (q) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (q as any).eq("imagery_id", imageryId),
  );

  if (occurrences.length === 0) return [];

  // Collect unique song ids
  const songCountMap = new Map<
    number,
    { categoryId: number; occurrenceCount: number }
  >();
  for (const occ of occurrences) {
    const existing = songCountMap.get(occ.song_id);
    if (existing) {
      existing.occurrenceCount++;
    } else {
      songCountMap.set(occ.song_id, {
        categoryId: occ.category_id,
        occurrenceCount: 1,
      });
    }
  }

  if (songCountMap.size === 0) return [];

  const { data: songs, error: songError } = await supabase
    .from("music")
    .select("id, title, album, lyricist")
    .in("id", Array.from(songCountMap.keys()));

  if (songError || !songs) {
    console.error("Failed to fetch songs for imagery:", songError);
    return [];
  }

  return (songs as SongRef[]).map((song) => {
    const stats = songCountMap.get(song.id);
    return {
      song,
      categoryId: stats?.categoryId ?? 0,
      occurrenceCount: stats?.occurrenceCount ?? 1,
    };
  });
}
