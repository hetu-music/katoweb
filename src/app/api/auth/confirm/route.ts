import { NextRequest, NextResponse } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/supabase-auth";

/**
 * 邮箱验证确认端点
 *
 * 邮件模板中的链接格式：
 *   {{ .RedirectTo }}/api/auth/confirm?token_hash={{ .TokenHash }}&type=email&next={{ .RedirectTo | urlquery }}
 *
 * 流程：
 *   1. 从 URL 参数获取 token_hash 和 type
 *   2. 调用 supabase.auth.verifyOtp() 验证令牌并建立会话
 *   3. 验证成功后重定向到 next 参数指定的页面（默认首页）
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as
    | "signup"
    | "email"
    | "magiclink"
    | "recovery"
    | "invite"
    | null;
  const next = searchParams.get("next") ?? "/";

  // 从 next 参数中提取路径（next 可能是完整 URL 如 https://zb.hetu-music.com）
  let redirectPath = "/";
  try {
    if (next.startsWith("http")) {
      const nextUrl = new URL(next);
      redirectPath = nextUrl.pathname || "/";
    } else if (next.startsWith("/")) {
      redirectPath = next;
    }
  } catch {
    redirectPath = "/";
  }

  if (!tokenHash || !type) {
    console.error("[Auth Confirm] Missing token_hash or type:", {
      tokenHash: !!tokenHash,
      type,
    });
    return NextResponse.redirect(
      new URL("/login?error=missing_params", request.url),
    );
  }

  // 构建重定向响应（先创建，以便 Supabase 客户端可以写入 Set-Cookie）
  const redirectUrl = new URL(redirectPath, request.url);
  const response = NextResponse.redirect(redirectUrl);

  const supabase = createSupabaseMiddlewareClient(request, response);

  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    console.error("[Auth Confirm] verifyOtp error:", error.message);
    return NextResponse.redirect(
      new URL(
        `/login?error=verification_failed&message=${encodeURIComponent(error.message)}`,
        request.url,
      ),
    );
  }

  // 验证成功，response 中已经包含了 Supabase 设置的 session cookies
  return response;
}
