import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthenticatedUser } from "@/lib/server-auth";
import { createSupabaseServerClient } from "@/lib/supabase-auth";
import { TABLES } from "@/lib/supabase-server";

export const GET = withAuth(
  async (_request: NextRequest, user: AuthenticatedUser) => {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select("name, display, intro, is_admin, sort_order, navid_id, navid_pw, endpoint")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: data?.name ?? "未设置用户名",
      display: data?.display ?? false,
      intro: data?.intro ?? null,
      isAdmin: data?.is_admin ?? false,
      sortOrder: data?.sort_order ?? null,
      navidId: data?.navid_id ?? null,
      navidPw: data?.navid_pw ?? null,
      endpointText: data?.endpoint ?? null,
    });
  },
);
