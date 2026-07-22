import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthenticatedUser } from "@/lib/server/server-auth";
import { createSupabaseServerClient } from "@/lib/db/supabase-auth";

const comparisonFields = "id,left_song_id,right_song_id,outcome,created_at";
const ratingFields = "song_id,rating,uncertainty,comparisons,updated_at";

export const GET = withAuth(
  async (_request: NextRequest, user: AuthenticatedUser) => {
    const supabase = await createSupabaseServerClient();
    const [ratingsResult, comparisonsResult] = await Promise.all([
      supabase
        .from("music_preference_ratings")
        .select(ratingFields)
        .eq("user_id", user.id)
        .order("rating", { ascending: false }),
      supabase
        .from("music_preference_comparisons")
        .select(comparisonFields)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10000),
    ]);

    if (ratingsResult.error || comparisonsResult.error) {
      console.error(
        "GET music preferences error:",
        ratingsResult.error ?? comparisonsResult.error,
      );
      return NextResponse.json(
        { error: "偏好排序数据尚未初始化，请先应用 Supabase migration" },
        { status: 503 },
      );
    }

    return NextResponse.json({
      ratings: ratingsResult.data ?? [],
      comparisons: comparisonsResult.data ?? [],
    });
  },
);

export const POST = withAuth(
  async (request: NextRequest, _user: AuthenticatedUser) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
    }

    const input = body as {
      leftSongId?: unknown;
      rightSongId?: unknown;
      outcome?: unknown;
    };
    const leftSongId = Number(input.leftSongId);
    const rightSongId = Number(input.rightSongId);
    const outcome = Number(input.outcome);
    if (
      !Number.isInteger(leftSongId) ||
      !Number.isInteger(rightSongId) ||
      leftSongId < 1 ||
      rightSongId < 1 ||
      leftSongId === rightSongId ||
      ![-1, 0, 1].includes(outcome)
    ) {
      return NextResponse.json({ error: "无效的偏好选择" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("record_music_preference", {
      p_left_song_id: leftSongId,
      p_right_song_id: rightSongId,
      p_outcome: outcome,
    });

    if (error) {
      console.error("POST music preference error:", error);
      const status =
        error.code === "PGRST202" || error.code === "42883" ? 503 : 400;
      return NextResponse.json(
        {
          error:
            status === 503
              ? "偏好排序功能尚未部署数据库 migration"
              : "无法记录此次选择",
        },
        { status },
      );
    }

    return NextResponse.json({ success: true });
  },
  { requireCSRF: true },
);
