import { NextRequest, NextResponse } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase-auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin";

  if (code) {
    // 用 response 来承载 cookie，确保 Set-Cookie header 正确写入
    const redirectUrl = new URL(next, request.url);
    const response = NextResponse.redirect(redirectUrl);

    const supabase = createSupabaseMiddlewareClient(request, response);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return response;
    }
    console.error("Auth callback error:", error?.message);
  }

  return NextResponse.redirect(
    new URL("/login?error=auth_callback_failed", request.url),
  );
}
