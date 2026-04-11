import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthenticatedUser } from "@/lib/server-auth";
import {
  getImageryCategories,
  createImageryCategory,
} from "@/lib/service-imagery";
import { createSupabaseServerClient } from "@/lib/supabase-auth";
import { z } from "zod";

const CreateCategorySchema = z.object({
  name: z.string().min(1).max(50),
  parent_id: z.number().int().positive().nullable().optional(),
  level: z.number().int().min(0).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
});

export const GET = withAuth(
  async (_request: NextRequest, _user: AuthenticatedUser) => {
    try {
      const categories = await getImageryCategories();
      return NextResponse.json(categories);
    } catch (e) {
      console.error("[GET /api/admin/imagery/categories]", e);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
  { requireAdmin: true },
);

export const POST = withAuth(
  async (request: NextRequest, _user: AuthenticatedUser) => {
    try {
      const body = await request.json();
      const parsed = CreateCategorySchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid input", details: parsed.error.issues },
          { status: 400 },
        );
      }

      const supabase = await createSupabaseServerClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const created = await createImageryCategory(
        parsed.data,
        session.access_token,
      );
      return NextResponse.json(created);
    } catch (e) {
      console.error("[POST /api/admin/imagery/categories]", e);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  },
  { requireCSRF: true, requireAdmin: true },
);
