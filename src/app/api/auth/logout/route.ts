import { NextRequest, NextResponse } from "next/server";
import { verifyCSRFToken, clearAuthCookies } from "@/lib/utils.server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  if (!(await verifyCSRFToken(request))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

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
}
