import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/server-utils";
import { createSupabaseServerClient } from "@/lib/supabase-auth";
import { withAuth, type AuthenticatedUser } from "@/lib/server-auth";

export const POST = withAuth(
  async (_request: NextRequest, _user: AuthenticatedUser) => {
    try {
      const supabase = await createSupabaseServerClient();

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Supabase signOut error:", error);
        return NextResponse.json({ error: "Logout failed" }, { status: 500 });
      }

      // 清理认证相关的 cookies
      await clearAuthCookies();

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Logout error:", error);
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 },
      );
    }
  },
  { requireCSRF: true },
);
