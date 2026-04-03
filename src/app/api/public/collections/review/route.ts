import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthenticatedUser } from "@/lib/server-auth";
import { createSupabaseServerClient } from "@/lib/supabase-auth";

const TABLE = "collections";

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
      .limit(1)
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

    const { data: existing, error: findError } = await supabase
      .from(TABLE)
      .select("song_id")
      .eq("user_id", user.id)
      .eq("song_id", songId)
      .limit(1)
      .maybeSingle();

    if (findError) {
      console.error("Error finding existing collection:", findError);
      return NextResponse.json(
        { error: "Failed to update review" },
        { status: 500 },
      );
    }

    if (existing) {
      const { error: updateError } = await supabase
        .from(TABLE)
        .update({ review: review || null, has_review: !!review })
        .eq("user_id", user.id)
        .eq("song_id", songId);
      if (updateError) {
        console.error("Error updating review:", updateError);
        return NextResponse.json(
          { error: "Failed to update review" },
          { status: 500 },
        );
      }
    } else {
      const { error: insertError } = await supabase
        .from(TABLE)
        .insert({ user_id: user.id, song_id: songId, review: review || null, has_review: !!review });
      if (insertError) {
        console.error("Error inserting review:", insertError);
        return NextResponse.json(
          { error: "Failed to insert review" },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({ success: true, review });
  },
  { requireCSRF: true },
);
