import { getServiceClient, getUserClient, fetchAll, TABLES } from "./supabase-server";
import type {
  ImageryCategory,
  ImageryItem,
  ImageryMeaning,
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

  // category assignments from explicit map table
  const catMapRows = await fetchAll<{ imagery_id: number; category_id: number }>(
    supabase,
    TABLES.IMAGERY_MAP,
    "imagery_id, category_id",
  );

  // occurrence counts
  const occurrences = await fetchAll<Pick<ImageryOccurrence, "imagery_id">>(
    supabase,
    TABLES.IMAGERY_OCC,
    "imagery_id",
  );

  // meaning counts
  const meaningRows = await fetchAll<{ imagery_id: number }>(
    supabase,
    TABLES.IMAGERY_MEANINGS,
    "imagery_id",
  );

  const catMap = new Map<number, Set<number>>();
  for (const row of catMapRows) {
    if (!catMap.has(row.imagery_id)) catMap.set(row.imagery_id, new Set());
    catMap.get(row.imagery_id)!.add(row.category_id);
  }

  const countMap = new Map<number, number>();
  for (const occ of occurrences) {
    countMap.set(occ.imagery_id, (countMap.get(occ.imagery_id) ?? 0) + 1);
  }

  const meaningCountMap = new Map<number, number>();
  for (const row of meaningRows) {
    meaningCountMap.set(row.imagery_id, (meaningCountMap.get(row.imagery_id) ?? 0) + 1);
  }

  return imageryData.map((i) => ({
    id: i.id,
    name: i.name,
    count: countMap.get(i.id) ?? 0,
    categoryIds: catMap.has(i.id) ? Array.from(catMap.get(i.id)!) : [],
    meaningCount: meaningCountMap.get(i.id) ?? 0,
  }));
}

export async function getSongsForImagery(
  imageryId: number,
): Promise<
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
      songCountMap.set(occ.song_id, {
        categoryId: occ.category_id,
        occurrenceCount: 1,
      });
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

// ─── Admin CRUD: imagery items ─────────────────────────────────────────────────

export async function createImagery(
  name: string,
  accessToken: string,
): Promise<{ id: number; name: string }> {
  const supabase = getUserClient(accessToken);
  if (!supabase) throw new Error("Supabase client unavailable");

  const { data, error } = await supabase
    .from(TABLES.IMAGERY)
    .insert({ name })
    .select("id, name")
    .single();

  if (error) throw new Error(error.message);
  return data as { id: number; name: string };
}

export async function updateImagery(
  id: number,
  name: string,
  accessToken: string,
): Promise<{ id: number; name: string }> {
  const supabase = getUserClient(accessToken);
  if (!supabase) throw new Error("Supabase client unavailable");

  const { data, error } = await supabase
    .from(TABLES.IMAGERY)
    .update({ name })
    .eq("id", id)
    .select("id, name")
    .single();

  if (error) throw new Error(error.message);
  return data as { id: number; name: string };
}

export async function deleteImagery(
  id: number,
  accessToken: string,
): Promise<void> {
  const supabase = getUserClient(accessToken);
  if (!supabase) throw new Error("Supabase client unavailable");

  const { error } = await supabase.from(TABLES.IMAGERY).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Admin CRUD: imagery category map ─────────────────────────────────────────

export async function getCategoryMapForImagery(imageryId: number): Promise<number[]> {
  const supabase = getServiceClient();
  if (!supabase) return [];

  const rows = await fetchAll<{ category_id: number }>(
    supabase,
    TABLES.IMAGERY_MAP,
    "category_id",
    (q) => q.eq("imagery_id", imageryId),
  );
  return rows.map((r) => r.category_id);
}

export async function setImageryCategories(
  imageryId: number,
  categoryIds: number[],
  accessToken: string,
): Promise<void> {
  const supabase = getUserClient(accessToken);
  if (!supabase) throw new Error("Supabase client unavailable");

  // Delete all existing mappings for this imagery
  const { error: delErr } = await supabase
    .from(TABLES.IMAGERY_MAP)
    .delete()
    .eq("imagery_id", imageryId);
  if (delErr) throw new Error(delErr.message);

  if (categoryIds.length === 0) return;

  const rows = categoryIds.map((cid) => ({ imagery_id: imageryId, category_id: cid }));
  const { error: insErr } = await supabase.from(TABLES.IMAGERY_MAP).insert(rows);
  if (insErr) throw new Error(insErr.message);
}

// ─── Admin CRUD: imagery meanings ─────────────────────────────────────────────

export async function getMeaningsForImagery(imageryId: number): Promise<ImageryMeaning[]> {
  const supabase = getServiceClient();
  if (!supabase) return [];

  return fetchAll<ImageryMeaning>(
    supabase,
    TABLES.IMAGERY_MEANINGS,
    "id, imagery_id, label, description",
    (q) => q.eq("imagery_id", imageryId).order("id"),
  );
}

export async function createMeaning(
  imageryId: number,
  label: string,
  description: string | null,
  accessToken: string,
): Promise<ImageryMeaning> {
  const supabase = getUserClient(accessToken);
  if (!supabase) throw new Error("Supabase client unavailable");

  const { data, error } = await supabase
    .from(TABLES.IMAGERY_MEANINGS)
    .insert({ imagery_id: imageryId, label, description })
    .select("id, imagery_id, label, description")
    .single();

  if (error) throw new Error(error.message);
  return data as ImageryMeaning;
}

export async function updateMeaning(
  id: number,
  label: string,
  description: string | null,
  accessToken: string,
): Promise<ImageryMeaning> {
  const supabase = getUserClient(accessToken);
  if (!supabase) throw new Error("Supabase client unavailable");

  const { data, error } = await supabase
    .from(TABLES.IMAGERY_MEANINGS)
    .update({ label, description })
    .eq("id", id)
    .select("id, imagery_id, label, description")
    .single();

  if (error) throw new Error(error.message);
  return data as ImageryMeaning;
}

export async function deleteMeaning(id: number, accessToken: string): Promise<void> {
  const supabase = getUserClient(accessToken);
  if (!supabase) throw new Error("Supabase client unavailable");

  const { error } = await supabase.from(TABLES.IMAGERY_MEANINGS).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function createImageryCategory(
  data: { name: string; parent_id?: number | null; level?: number | null; description?: string | null },
  accessToken: string,
): Promise<ImageryCategory> {
  const supabase = getUserClient(accessToken);
  if (!supabase) throw new Error("Supabase client unavailable");

  const { data: created, error } = await supabase
    .from(TABLES.IMAGERY_CAT)
    .insert(data)
    .select("id, name, parent_id, level, description")
    .single();

  if (error) throw new Error(error.message);
  return created as ImageryCategory;
}

export async function updateImageryCategory(
  id: number,
  data: { name?: string; parent_id?: number | null; level?: number | null; description?: string | null },
  accessToken: string,
): Promise<ImageryCategory> {
  const supabase = getUserClient(accessToken);
  if (!supabase) throw new Error("Supabase client unavailable");

  const { data: updated, error } = await supabase
    .from(TABLES.IMAGERY_CAT)
    .update(data)
    .eq("id", id)
    .select("id, name, parent_id, level, description")
    .single();

  if (error) throw new Error(error.message);
  return updated as ImageryCategory;
}

export async function deleteImageryCategory(
  id: number,
  accessToken: string,
): Promise<void> {
  const supabase = getUserClient(accessToken);
  if (!supabase) throw new Error("Supabase client unavailable");

  const { error } = await supabase
    .from(TABLES.IMAGERY_CAT)
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Admin: occurrences ────────────────────────────────────────────────────────

export type OccurrenceWithSong = {
  id: number;
  song_id: number;
  imagery_id: number;
  category_id: number;
  song_title: string;
  song_album: string | null;
};

export async function getOccurrencesForImagery(
  imageryId: number,
): Promise<OccurrenceWithSong[]> {
  const supabase = getServiceClient();
  if (!supabase) return [];

  const occurrences = await fetchAll<Pick<ImageryOccurrence, "id" | "song_id" | "imagery_id" | "category_id">>(
    supabase,
    TABLES.IMAGERY_OCC,
    "id, song_id, imagery_id, category_id",
    (q) => q.eq("imagery_id", imageryId),
  );

  if (occurrences.length === 0) return [];

  const songIds = [...new Set(occurrences.map((o) => o.song_id))];
  const { data: songs } = await supabase
    .from(TABLES.MUSIC)
    .select("id, title, album")
    .in("id", songIds);

  const songMap = new Map<number, { title: string; album: string | null }>();
  if (songs) {
    for (const s of songs as Array<{ id: number; title: string; album: string | null }>) {
      songMap.set(s.id, { title: s.title, album: s.album });
    }
  }

  return occurrences.map((o) => ({
    id: o.id,
    song_id: o.song_id,
    imagery_id: o.imagery_id,
    category_id: o.category_id,
    song_title: songMap.get(o.song_id)?.title ?? `歌曲 #${o.song_id}`,
    song_album: songMap.get(o.song_id)?.album ?? null,
  }));
}

export async function updateOccurrenceCategory(
  occurrenceId: number,
  categoryId: number,
  accessToken: string,
): Promise<void> {
  const supabase = getUserClient(accessToken);
  if (!supabase) throw new Error("Supabase client unavailable");

  const { error } = await supabase
    .from(TABLES.IMAGERY_OCC)
    .update({ category_id: categoryId })
    .eq("id", occurrenceId);
  if (error) throw new Error(error.message);
}
