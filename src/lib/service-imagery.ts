import { getServiceClient, getUserClient, fetchAll, TABLES } from "./supabase-server";
import type {
  ImageryCategory,
  ImageryItem,
  ImageryMeaning,
  ImageryOccurrence,
  SongRef,
} from "./types";

// Suppress unused import warnings — these types are re-exported or used transitively
void (undefined as unknown as ImageryOccurrence);
void (undefined as unknown as SongRef);

export type OccurrenceWithSong = {
  id: number;
  song_id: number;
  imagery_id: number;
  category_id: number;
  meaning_id: number | null;
  lyric_timetag: Record<string, unknown>[];
  song_title: string;
  song_album: string | null;
  imagery_name?: string;
  category_name?: string;
  meaning_label?: string | null;
};

// ─── helper ───────────────────────────────────────────────────────────────────

function mapOccurrenceRow(row: Record<string, unknown>): OccurrenceWithSong {
  const music = row.music as { title?: string; album?: string } | null;
  const imagery = row.imagery as { name?: string } | null;
  const imageryCategories = row.imagery_categories as { name?: string } | null;
  const imageryMeanings = row.imagery_meanings as { label?: string } | null;
  return {
    id: row.id as number,
    song_id: row.song_id as number,
    imagery_id: row.imagery_id as number,
    category_id: row.category_id as number,
    meaning_id: (row.meaning_id as number | null) ?? null,
    lyric_timetag: (row.lyric_timetag as Record<string, unknown>[]) ?? [],
    song_title: music?.title ?? "",
    song_album: music?.album ?? null,
    imagery_name: imagery?.name,
    category_name: imageryCategories?.name,
    meaning_label: imageryMeanings?.label ?? null,
  };
}

// ─── read functions ───────────────────────────────────────────────────────────

export async function getImageryCategories(): Promise<ImageryCategory[]> {
  const supabase = getServiceClient();
  if (!supabase) return [];
  return fetchAll(supabase, TABLES.IMAGERY_CAT, "id,name,parent_id,level,description") as Promise<ImageryCategory[]>;
}

export async function getImageryWithCounts(): Promise<ImageryItem[]> {
  const supabase = getServiceClient();
  if (!supabase) return [];
  try {
    const [imageryRows, occurrenceRows] = await Promise.all([
      fetchAll(supabase, TABLES.IMAGERY, "id,name") as Promise<{ id: number; name: string }[]>,
      fetchAll(supabase, TABLES.IMAGERY_OCC, "id,imagery_id,category_id") as Promise<{ id: number; imagery_id: number; category_id: number }[]>,
    ]);

    return imageryRows.map((item) => {
      const occs = occurrenceRows.filter((o) => o.imagery_id === item.id);
      const categoryIds = [...new Set(occs.map((o) => o.category_id).filter(Boolean))];
      return {
        id: item.id,
        name: item.name,
        count: occs.length,
        categoryIds,
        meaningCount: 0,
      };
    });
  } catch (e) {
    console.error("[getImageryWithCounts]", e);
    return [];
  }
}

export async function getImageryMeanings(): Promise<ImageryMeaning[]> {
  const supabase = getServiceClient();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from(TABLES.IMAGERY_MEANINGS)
      .select("id,label,description")
      .order("label", { ascending: true });
    if (error) { console.error("[getImageryMeanings]", error); return []; }
    return (data ?? []) as ImageryMeaning[];
  } catch (e) {
    console.error("[getImageryMeanings]", e);
    return [];
  }
}

export async function getMeaningsForImagery(_imageryId: number): Promise<ImageryMeaning[]> {
  return getImageryMeanings();
}

export async function getOccurrencesForImagery(imageryId: number): Promise<OccurrenceWithSong[]> {
  const supabase = getServiceClient();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("imagery_occurrences")
      .select("*, music(title, album), imagery(name), imagery_categories(name), imagery_meanings(label)")
      .eq("imagery_id", imageryId);
    if (error) { console.error("[getOccurrencesForImagery]", error); return []; }
    return ((data ?? []) as Record<string, unknown>[]).map(mapOccurrenceRow);
  } catch (e) {
    console.error("[getOccurrencesForImagery]", e);
    return [];
  }
}

export async function getOccurrencesForSong(songId: number): Promise<OccurrenceWithSong[]> {
  const supabase = getServiceClient();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("imagery_occurrences")
      .select("*, music(title, album), imagery(name), imagery_categories(name), imagery_meanings(label)")
      .eq("song_id", songId);
    if (error) { console.error("[getOccurrencesForSong]", error); return []; }
    return ((data ?? []) as Record<string, unknown>[]).map(mapOccurrenceRow);
  } catch (e) {
    console.error("[getOccurrencesForSong]", e);
    return [];
  }
}

// ─── write functions: imagery ─────────────────────────────────────────────────

export async function createImagery(name: string, accessToken: string) {
  const supabase = getUserClient(accessToken);
  if (!supabase) throw new Error("Supabase client unavailable");
  const { data, error } = await supabase.from(TABLES.IMAGERY).insert({ name }).select().single();
  if (error) throw error;
  return data;
}

export async function updateImagery(id: number, name: string, accessToken: string) {
  const supabase = getUserClient(accessToken);
  if (!supabase) throw new Error("Supabase client unavailable");
  const { data, error } = await supabase.from(TABLES.IMAGERY).update({ name }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteImagery(id: number, accessToken: string) {
  const supabase = getUserClient(accessToken);
  if (!supabase) throw new Error("Supabase client unavailable");
  const { error } = await supabase.from(TABLES.IMAGERY).delete().eq("id", id);
  if (error) throw error;
}

// ─── write functions: imagery categories ─────────────────────────────────────

export async function createImageryCategory(
  data: { name: string; parent_id?: number | null; level?: number | null; description?: string | null },
  accessToken: string,
) {
  const supabase = getUserClient(accessToken);
  if (!supabase) throw new Error("Supabase client unavailable");
  const { data: created, error } = await supabase.from(TABLES.IMAGERY_CAT).insert(data).select().single();
  if (error) throw error;
  return created;
}

export async function updateImageryCategory(
  id: number,
  data: { name?: string; parent_id?: number | null; level?: number | null; description?: string | null },
  accessToken: string,
) {
  const supabase = getUserClient(accessToken);
  if (!supabase) throw new Error("Supabase client unavailable");
  const { data: updated, error } = await supabase.from(TABLES.IMAGERY_CAT).update(data).eq("id", id).select().single();
  if (error) throw error;
  return updated;
}

export async function deleteImageryCategory(id: number, accessToken: string) {
  const supabase = getUserClient(accessToken);
  if (!supabase) throw new Error("Supabase client unavailable");
  const { error } = await supabase.from(TABLES.IMAGERY_CAT).delete().eq("id", id);
  if (error) throw error;
}

// ─── write functions: meanings ────────────────────────────────────────────────

async function getOccurrenceWithRelationsById(
  id: number,
  accessToken: string,
) {
  const supabase = getUserClient(accessToken);
  if (!supabase) throw new Error("Supabase client unavailable");
  const { data, error } = await supabase
    .from(TABLES.IMAGERY_OCC)
    .select("*, music(title, album), imagery(name), imagery_categories(name), imagery_meanings(label)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return mapOccurrenceRow(data as Record<string, unknown>);
}

export async function createImageryMeaning(
  label: string,
  description: string | null,
  accessToken: string,
) {
  const supabase = getUserClient(accessToken);
  if (!supabase) throw new Error("Supabase client unavailable");
  const { data, error } = await supabase
    .from(TABLES.IMAGERY_MEANINGS)
    .insert({ label, description })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createMeaning(
  _imageryId: number,
  label: string,
  description: string | null,
  accessToken: string,
) {
  return createImageryMeaning(label, description, accessToken);
}

export async function updateMeaning(
  id: number,
  label: string,
  description: string | null,
  accessToken: string,
) {
  const supabase = getUserClient(accessToken);
  if (!supabase) throw new Error("Supabase client unavailable");
  const { data, error } = await supabase
    .from(TABLES.IMAGERY_MEANINGS)
    .update({ label, description })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMeaning(id: number, accessToken: string) {
  const supabase = getUserClient(accessToken);
  if (!supabase) throw new Error("Supabase client unavailable");
  const { error } = await supabase.from(TABLES.IMAGERY_MEANINGS).delete().eq("id", id);
  if (error) throw error;
}

// ─── write functions: occurrences ─────────────────────────────────────────────

export async function createOccurrence(
  data: { song_id: number; imagery_id: number; category_id: number; meaning_id?: number | null; lyric_timetag: Record<string, unknown>[] },
  accessToken: string,
) {
  const supabase = getUserClient(accessToken);
  if (!supabase) throw new Error("Supabase client unavailable");
  const { data: created, error } = await supabase
    .from(TABLES.IMAGERY_OCC)
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return getOccurrenceWithRelationsById((created as { id: number }).id, accessToken);
}

export async function updateOccurrence(
  id: number,
  data: { imagery_id?: number; category_id?: number; meaning_id?: number | null; lyric_timetag?: Record<string, unknown>[] },
  accessToken: string,
) {
  const supabase = getUserClient(accessToken);
  if (!supabase) throw new Error("Supabase client unavailable");
  const { error } = await supabase
    .from(TABLES.IMAGERY_OCC)
    .update(data)
    .eq("id", id)
    .select("id")
    .single();
  if (error) throw error;
  return getOccurrenceWithRelationsById(id, accessToken);
}

export async function deleteOccurrence(id: number, accessToken: string) {
  const supabase = getUserClient(accessToken);
  if (!supabase) throw new Error("Supabase client unavailable");
  const { error } = await supabase.from(TABLES.IMAGERY_OCC).delete().eq("id", id);
  if (error) throw error;
}

// ─── public read functions ─────────────────────────────────────────────────────

export async function getSongsForImagery(imageryId: number): Promise<SongRef[]> {
  const supabase = getServiceClient();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from(TABLES.IMAGERY_OCC)
      .select("song_id, music(id, title, album, lyricist)")
      .eq("imagery_id", imageryId);
    if (error) { console.error("[getSongsForImagery]", error); return []; }
    const seen = new Set<number>();
    const results: SongRef[] = [];
    for (const row of (data ?? []) as Record<string, unknown>[]) {
      const m = row.music as { id?: number; title?: string; album?: string | null; lyricist?: string[] | null } | null;
      if (m?.id && !seen.has(m.id)) {
        seen.add(m.id);
        results.push({ id: m.id, title: m.title ?? "", album: m.album ?? null, lyricist: m.lyricist ?? null });
      }
    }
    return results;
  } catch (e) {
    console.error("[getSongsForImagery]", e);
    return [];
  }
}
