import { createSupabaseDataClient } from "./supabase-server";
import type {
  ImageryCategory,
  ImageryItem,
  ImageryOccurrence,
  SongRef,
} from "./types";

export async function getImageryCategories(): Promise<ImageryCategory[]> {
  const supabase = createSupabaseDataClient("imagery_categories");
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("imagery_categories")
    .select("id, name, parent_id, level, description")
    .order("level", { ascending: true })
    .order("name");

  if (error) {
    console.error("Failed to fetch imagery categories:", error);
    return [];
  }
  return (data ?? []) as ImageryCategory[];
}

export async function getImageryWithCounts(): Promise<ImageryItem[]> {
  const supabase = createSupabaseDataClient("imagery");
  if (!supabase) return [];

  // Fetch all imagery
  const { data: imageryData, error: imageryError } = await supabase
    .from("imagery")
    .select("id, name")
    .order("name");

  if (imageryError || !imageryData) {
    console.error("Failed to fetch imagery:", imageryError);
    return [];
  }

  // Fetch all occurrences for counting and category mapping
  const supabase2 = createSupabaseDataClient("imagery_occurrences");
  if (!supabase2) return imageryData.map((i) => ({ ...i, count: 0, categoryIds: [] }));

  const { data: occurrences, error: occError } = await supabase2
    .from("imagery_occurrences")
    .select("imagery_id, category_id");

  if (occError || !occurrences) {
    console.error("Failed to fetch imagery occurrences:", occError);
    return imageryData.map((i) => ({ ...i, count: 0, categoryIds: [] }));
  }

  // Group occurrences by imagery_id
  const countMap = new Map<number, { count: number; categoryIds: Set<number> }>();
  for (const occ of occurrences as Pick<ImageryOccurrence, "imagery_id" | "category_id">[]) {
    const existing = countMap.get(occ.imagery_id);
    if (existing) {
      existing.count++;
      existing.categoryIds.add(occ.category_id);
    } else {
      countMap.set(occ.imagery_id, { count: 1, categoryIds: new Set([occ.category_id]) });
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
  const supabase = createSupabaseDataClient("imagery_occurrences");
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("imagery_occurrences")
    .select("song_id, category_id")
    .eq("imagery_id", imageryId);

  if (error || !data) {
    console.error("Failed to fetch occurrences for imagery:", error);
    return [];
  }

  // Collect unique song ids
  const songCountMap = new Map<
    number,
    { categoryId: number; occurrenceCount: number }
  >();
  for (const occ of data as Pick<ImageryOccurrence, "song_id" | "category_id">[]) {
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

  const supabase2 = createSupabaseDataClient("music");
  if (!supabase2) return [];

  const { data: songs, error: songError } = await supabase2
    .from("music")
    .select("id, title, album")
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
