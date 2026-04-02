import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthenticatedUser } from "@/lib/server-auth";
import { createSupabaseServerClient } from "@/lib/supabase-auth";

const TABLE = "collections";

// GET /api/public/collections — 获取当前用户的收藏 song_id 列表
export const GET = withAuth(
  async (_request: NextRequest, user: AuthenticatedUser) => {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select("song_id")
      .eq("user_id", user.id);

    if (error) {
      console.error("GET collections error:", error);
      return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }

    return NextResponse.json({ songIds: data.map((r) => r.song_id) });
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
