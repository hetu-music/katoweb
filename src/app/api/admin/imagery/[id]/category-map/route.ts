import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthenticatedUser } from "@/lib/server-auth";
import { getCategoryMapForImagery, setImageryCategories } from "@/lib/service-imagery";
import { createSupabaseServerClient } from "@/lib/supabase-auth";
import { z } from "zod";

const SetCategoriesSchema = z.object({
  categoryIds: z.array(z.number().int().positive()),
});

function getIdFromUrl(request: NextRequest): number | null {
  const segments = request.nextUrl.pathname.split("/");
  // path: /api/admin/imagery/[id]/category-map → id is at index -2
  const id = parseInt(segments[segments.length - 2], 10);
  return isNaN(id) || id < 1 ? null : id;
}

export const GET = withAuth(
  async (request: NextRequest, _user: AuthenticatedUser) => {
    const imageryId = getIdFromUrl(request);
    if (!imageryId) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    try {
      const categoryIds = await getCategoryMapForImagery(imageryId);
      return NextResponse.json(categoryIds);
    } catch (e) {
      console.error("[GET /api/admin/imagery/[id]/category-map]", e);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  },
  { requireAdmin: true },
);

export const PUT = withAuth(
  async (request: NextRequest, _user: AuthenticatedUser) => {
    const imageryId = getIdFromUrl(request);
    if (!imageryId) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    try {
      const body = await request.json();
      const parsed = SetCategoriesSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid input", details: parsed.error.issues }, { status: 400 });
      }

      const supabase = await createSupabaseServerClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      await setImageryCategories(imageryId, parsed.data.categoryIds, session.access_token);
      return NextResponse.json({ success: true });
    } catch (e) {
      console.error("[PUT /api/admin/imagery/[id]/category-map]", e);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  },
  { requireCSRF: true, requireAdmin: true },
);
