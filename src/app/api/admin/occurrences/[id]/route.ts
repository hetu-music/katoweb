import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthenticatedUser } from "@/lib/server-auth";
import { updateOccurrence, deleteOccurrence } from "@/lib/service-imagery";
import { createSupabaseServerClient } from "@/lib/supabase-auth";
import { z } from "zod";

const UpdateOccurrenceSchema = z.object({
  imagery_id: z.number().int().positive().optional(),
  category_id: z.number().int().positive().optional(),
  meaning_id: z.number().int().positive().nullable().optional(),
  lyric_timetag: z.array(z.record(z.string(), z.unknown())).optional(),
});

function getIdFromUrl(request: NextRequest): number | null {
  const segments = request.nextUrl.pathname.split("/");
  const id = parseInt(segments[segments.length - 1], 10);
  return isNaN(id) || id < 1 ? null : id;
}

export const PUT = withAuth(
  async (request: NextRequest, _user: AuthenticatedUser) => {
    const id = getIdFromUrl(request);
    if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    try {
      const body = await request.json();
      const parsed = UpdateOccurrenceSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: "Invalid input", details: parsed.error.issues }, { status: 400 });
      const supabase = await createSupabaseServerClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      const updated = await updateOccurrence(id, parsed.data, session.access_token);
      return NextResponse.json(updated);
    } catch (e) {
      console.error("[PUT /api/admin/occurrences/[id]]", e);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  },
  { requireCSRF: true, requireAdmin: true },
);

export const DELETE = withAuth(
  async (request: NextRequest, _user: AuthenticatedUser) => {
    const id = getIdFromUrl(request);
    if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    try {
      const supabase = await createSupabaseServerClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      await deleteOccurrence(id, session.access_token);
      return NextResponse.json({ success: true });
    } catch (e) {
      console.error("[DELETE /api/admin/occurrences/[id]]", e);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  },
  { requireCSRF: true, requireAdmin: true },
);
