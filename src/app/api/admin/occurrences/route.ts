import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthenticatedUser } from "@/lib/server-auth";
import { getOccurrencesForImagery, getOccurrencesForSong, createOccurrence } from "@/lib/service-imagery";
import { createSupabaseServerClient } from "@/lib/supabase-auth";
import { z } from "zod";

const CreateOccurrenceSchema = z.object({
  song_id: z.number().int().positive(),
  imagery_id: z.number().int().positive(),
  category_id: z.number().int().positive(),
  meaning_id: z.number().int().positive().nullable().optional(),
  lyric_timetag: z.array(z.record(z.string(), z.unknown())).default([]),
});

export const GET = withAuth(
  async (request: NextRequest, _user: AuthenticatedUser) => {
    const { searchParams } = request.nextUrl;
    const imageryIdStr = searchParams.get("imagery_id");
    const songIdStr = searchParams.get("song_id");
    try {
      if (imageryIdStr) {
        const imageryId = parseInt(imageryIdStr, 10);
        if (isNaN(imageryId) || imageryId < 1) return NextResponse.json({ error: "Invalid imagery_id" }, { status: 400 });
        const occurrences = await getOccurrencesForImagery(imageryId);
        return NextResponse.json(occurrences);
      } else if (songIdStr) {
        const songId = parseInt(songIdStr, 10);
        if (isNaN(songId) || songId < 1) return NextResponse.json({ error: "Invalid song_id" }, { status: 400 });
        const occurrences = await getOccurrencesForSong(songId);
        return NextResponse.json(occurrences);
      } else {
        return NextResponse.json({ error: "Missing imagery_id or song_id query param" }, { status: 400 });
      }
    } catch (e) {
      console.error("[GET /api/admin/occurrences]", e);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  },
  { requireAdmin: true },
);

export const POST = withAuth(
  async (request: NextRequest, _user: AuthenticatedUser) => {
    try {
      const body = await request.json();
      const parsed = CreateOccurrenceSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.issues }, { status: 400 });
      const supabase = await createSupabaseServerClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const created = await createOccurrence(parsed.data, session.access_token);
      return NextResponse.json(created);
    } catch (e) {
      console.error("[POST /api/admin/occurrences]", e);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  },
  { requireCSRF: true, requireAdmin: true },
);
