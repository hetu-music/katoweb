import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "./lib/supabase-server";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 只对 admin 路由进行验证
  if (request.nextUrl.pathname.startsWith("/admin")) {
    // 登录页面不需要验证
    if (request.nextUrl.pathname === "/admin/login") {
      return response;
    }

    const supabase = createSupabaseMiddlewareClient(request, response);

    // 用 getUser 校验 session 的有效性和过期
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
