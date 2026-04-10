import { getServiceClient, fetchAll, TABLES } from "./supabase-server";
import type {
  ImageryCategory,
  ImageryItem,
  ImageryOccurrence,
  SongRef,
} from "./types";

export async function getImageryCategories(): Promise<ImageryCategory[]> {
  const supabase = getServiceClient();
  if (!supabase) return [];

  return fetchAll<ImageryCategory>(
    supabase,
    TABLES.IMAGERY_CAT,
    "id, name, parent_id, level, description",
  );
}

export async function getImageryWithCounts(): Promise<ImageryItem[]> {
  const supabase = getServiceClient();
  if (!supabase) return [];

  const imageryData = await fetchAll<{ id: number; name: string }>(
    supabase,
    TABLES.IMAGERY,
    "id, name",
  );

  if (imageryData.length === 0) return [];

  const occurrences = await fetchAll<
    Pick<ImageryOccurrence, "imagery_id" | "category_id">
  >(supabase, TABLES.IMAGERY_OCC, "imagery_id, category_id");

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
  Array<{ song: SongRef; categoryId: number; occurrenceCount: number }>
> {
  const supabase = getServiceClient();
  if (!supabase) return [];

  const occurrences = await fetchAll<
    Pick<ImageryOccurrence, "song_id" | "category_id">
  >(supabase, TABLES.IMAGERY_OCC, "song_id, category_id", (q) =>
    q.eq("imagery_id", imageryId),
  );

  if (occurrences.length === 0) return [];

  const songCountMap = new Map<
    number,
    { categoryId: number; occurrenceCount: number }
  >();
  for (const occ of occurrences) {
    const existing = songCountMap.get(occ.song_id);
    if (existing) {
      existing.occurrenceCount++;
    } else {
      songCountMap.set(occ.song_id, { categoryId: occ.category_id, occurrenceCount: 1 });
    }
  }

  if (songCountMap.size === 0) return [];

  const { data: songs, error } = await supabase
    .from(TABLES.MUSIC)
    .select("id, title, album, lyricist")
    .in("id", Array.from(songCountMap.keys()));

  if (error || !songs) {
    console.error("[getSongsForImagery] Failed to fetch songs:", error);
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
