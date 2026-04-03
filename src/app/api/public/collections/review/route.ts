import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthenticatedUser } from "@/lib/server-auth";
import { createSupabaseServerClient } from "@/lib/supabase-auth";

const TABLE = "collections";
const TARGET_TYPE_FAVORITE = 0;

// GET /api/public/collections/review — 获取指定歌曲的评论
export const GET = withAuth(
  async (request: NextRequest, user: AuthenticatedUser) => {
    const { searchParams } = new URL(request.url);
    const songId = Number(searchParams.get("songId"));

    if (!Number.isInteger(songId) || songId < 1) {
      return NextResponse.json({ error: "Invalid songId" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from(TABLE)
      .select("review")
      .eq("user_id", user.id)
      .eq("song_id", songId)
      .eq("target_type", TARGET_TYPE_FAVORITE)
      .maybeSingle();

    if (error) {
      console.error("GET collection review error:", error);
      return NextResponse.json(
        { error: "Failed to fetch review" },
        { status: 500 },
      );
    }

    return NextResponse.json({ review: data?.review || "" });
  },
);

// POST /api/public/collections/review — 保存评论
// 唯一约束 uk_only_one_song_collection (user_id, song_id) WHERE target_type=0
// 保证同一用户同一歌曲只有一行，update 安全不会产生重复
export const POST = withAuth(
  async (request: NextRequest, user: AuthenticatedUser) => {
    const body = await request.json();
    const songId = Number(body?.songId);
    const review =
      body?.review === undefined ? null : String(body.review).trim();

    if (!Number.isInteger(songId) || songId < 1) {
      return NextResponse.json({ error: "Invalid songId" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    // 先尝试 update 已有行
    const { data: updated, error: updateError } = await supabase
      .from(TABLE)
      .update({ review: review || null })
      .eq("user_id", user.id)
      .eq("song_id", songId)
      .eq("target_type", TARGET_TYPE_FAVORITE)
      .select("song_id");

    if (updateError) {
      console.error("Error updating review:", updateError);
      return NextResponse.json(
        { error: "Failed to save review" },
        { status: 500 },
      );
    }

    // 如果没有命中任何行，说明还没有收藏记录，插入新行
    if (!updated || updated.length === 0) {
      const { error: insertError } = await supabase
        .from(TABLE)
        .insert({
          user_id: user.id,
          song_id: songId,
          target_type: TARGET_TYPE_FAVORITE,
          review: review || null,
        });

      if (insertError) {
        // 唯一约束冲突说明并发插入，再次尝试 update
        if (insertError.code === "23505") {
          await supabase
            .from(TABLE)
            .update({ review: review || null })
            .eq("user_id", user.id)
            .eq("song_id", songId)
            .eq("target_type", TARGET_TYPE_FAVORITE);
        } else {
          console.error("Error inserting review:", insertError);
          return NextResponse.json(
            { error: "Failed to save review" },
            { status: 500 },
          );
        }
      }
    }

    return NextResponse.json({ success: true, review });
  },
  { requireCSRF: true },
);
