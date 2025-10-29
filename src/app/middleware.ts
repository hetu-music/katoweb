import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "../lib/supabase-server";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const supabase = createSupabaseMiddlewareClient(request, response);

  // 用 getUser 校验 session 的有效性和过期
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (
    !user &&
    request.nextUrl.pathname.startsWith("/admin") &&
    request.nextUrl.pathname !== "/admin/login"
  ) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
