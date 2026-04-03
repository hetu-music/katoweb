import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthenticatedUser } from "@/lib/server-auth";
import { createSupabaseServerClient } from "@/lib/supabase-auth";
import { getSongs } from "@/lib/service-songs";
import { TABLE_NAMES } from "@/lib/constants";

const TABLE = "collections";

// GET /api/public/collections — 获取当前用户的收藏，返回 songIds 和完整 songs 数据
export const GET = withAuth(
  async (_request: NextRequest, user: AuthenticatedUser) => {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select("song_id, created_at, review, has_review")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("GET collections error:", error);
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }

    // Deduplicate data by song_id since database might have duplicate entries
    const uniqueData = [];
    const seen = new Set();
    for (const row of data) {
      if (!seen.has(row.song_id)) {
        seen.add(row.song_id);
        uniqueData.push(row);
      }
    }

    const songIds: number[] = uniqueData.map((r) => r.song_id);

    if (songIds.length === 0) {
      return NextResponse.json({ songIds: [], songs: [] });
    }

    // 服务端直接查歌曲数据，避免客户端二次请求
    const allSongs = await getSongs(TABLE_NAMES.MAIN, undefined, true);

    // 从数据行转为映射
    const idToCol = Object.fromEntries(
      uniqueData.map((r) => [
        r.song_id,
        { created_at: r.created_at, review: r.review, has_review: !!r.has_review },
      ]),
    );

    const songs = songIds
      .map((id) => allSongs.find((s) => s.id === id))
      .filter((s): s is NonNullable<typeof s> => Boolean(s))
      .map((song) => ({
        ...song,
        collectionInfo: idToCol[song.id],
      }));

    return NextResponse.json({ songIds, songs });
  },
);

// POST /api/public/collections — 添加收藏
export const POST = withAuth(
  async (request: NextRequest, user: AuthenticatedUser) => {
    const body = await request.json();
    const songId = Number(body?.songId);
    if (!Number.isInteger(songId) || songId < 1) {
      return NextResponse.json({ error: "Invalid songId" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from(TABLE)
      .insert({ user_id: user.id, song_id: songId });

    if (error) {
      // 唯一约束冲突 — 已收藏，视为成功
      if (error.code === "23505") {
        return NextResponse.json({ success: true });
      }
      console.error("POST collections error:", error);
      return NextResponse.json({ error: "Failed to add" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  },
  { requireCSRF: true },
);

// DELETE /api/public/collections — 取消收藏
export const DELETE = withAuth(
  async (request: NextRequest, user: AuthenticatedUser) => {
    const body = await request.json();
    const songId = Number(body?.songId);
    if (!Number.isInteger(songId) || songId < 1) {
      return NextResponse.json({ error: "Invalid songId" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq("user_id", user.id)
      .eq("song_id", songId);

    if (error) {
      console.error("DELETE collections error:", error);
      return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  },
  { requireCSRF: true },
);
