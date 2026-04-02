import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthenticatedUser } from "@/lib/server-auth";
import { createSupabaseServerClient } from "@/lib/supabase-auth";

export const GET = withAuth(
  async (_request: NextRequest, user: AuthenticatedUser) => {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("users")
      .select("name, display, intro, is_admin")
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
    });
  },
);
