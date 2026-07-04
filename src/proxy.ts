import createIntlMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createSupabaseMiddlewareClient } from "@/lib/db/supabase-auth";
import { routing } from "@/i18n/routing";

// next-intl 中间件：处理 locale 探测和重定向
const intlMiddleware = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  // Generate a random nonce for CSP
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  // Development environment check
  const isDev = process.env.NODE_ENV === "development";
  const pathname = request.nextUrl.pathname;

  // 跳过 next-intl 不需要处理的路径（API、静态资源等由 matcher 过滤）
  // 对所有页面路由先走 next-intl，再做 CSP 和 Auth 处理

  // Determine the route type based on the new structure
  // (admin) group: Starts with /admin or is /login or /zh-TW/admin etc. -> Strict CSP
  // (public) group: /, /song/*, /zh-TW/* etc. -> Relaxed CSP (Static/ISR)
  const strippedPathname = pathname
    .replace(/^\/(zh-TW)/, "")
    .replace(/^\/(zh-CN)/, "");
  const isStrictRoute =
    strippedPathname.startsWith("/admin") ||
    strippedPathname === "/login" ||
    strippedPathname === "/register";

  // Only use Nonce in Production on Strict routes
  const useNonce = isStrictRoute && !isDev;

  let cspHeader = "";

  if (useNonce) {
    cspHeader = `
      default-src 'self';
      script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'sha256-n46vPwSWuMC0W703pBofImv82Z26xo4LXymv0E9caPk=' https://challenges.cloudflare.com https://static.cloudflareinsights.com;
      worker-src 'self' blob:;
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: https://cover.hetu-music.com;
      font-src 'self';
      media-src 'self' https://qb.hetu-music.com;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      frame-src 'self' https://challenges.cloudflare.com;
      block-all-mixed-content;
      upgrade-insecure-requests;
    `
      .replace(/\s{2,}/g, " ")
      .trim();
  } else {
    cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://static.cloudflareinsights.com;
      worker-src 'self' blob:;
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: https://cover.hetu-music.com;
      font-src 'self';
      media-src 'self' https://qb.hetu-music.com;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      frame-src 'self' https://challenges.cloudflare.com;
      block-all-mixed-content;
      upgrade-insecure-requests;
    `
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  // 先运行 next-intl 中间件（处理 locale 路由）
  const intlResponse = intlMiddleware(request);

  // 如果 next-intl 要做重定向（如 locale 探测），直接返回并附上 CSP
  if (intlResponse.status !== 200) {
    intlResponse.headers.set("Content-Security-Policy", cspHeader);
    return intlResponse;
  }

  // Create request headers（在 intl 处理之后）
  const requestHeaders = new Headers(request.headers);
  if (useNonce) {
    requestHeaders.set("x-nonce", nonce);
  }
  requestHeaders.set("Content-Security-Policy", cspHeader);

  // Check if next-intl middleware wants to rewrite the path (needed for default locale zh-CN without prefix)
  const rewriteUrl = intlResponse.headers.get("x-middleware-rewrite");
  let response: NextResponse;
  if (rewriteUrl) {
    response = NextResponse.rewrite(new URL(rewriteUrl, request.url), {
      request: {
        headers: requestHeaders,
      },
    });
  } else {
    response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Copy all other headers from next-intl response (cookies, x-next-intl-locale, etc.)
  intlResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "x-middleware-rewrite") {
      response.headers.set(key, value);
    }
  });

  // Apply Security Headers to Response
  response.headers.set("Content-Security-Policy", cspHeader);

  // Always refresh the Supabase session
  try {
    const supabase = createSupabaseMiddlewareClient(request, response);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // Admin-only: redirect to login if not authenticated or not admin
    // 兼容 locale 前缀：/admin 和 /zh-TW/admin 都要保护
    if (strippedPathname.startsWith("/admin")) {
      if (error || !user) {
        console.warn("Auth middleware: User not authenticated", error?.message);
        // 重定向到带 locale 前缀的 /login
        const loginPath = pathname.startsWith("/zh-TW")
          ? "/zh-TW/login"
          : "/login";
        const redirectResponse = NextResponse.redirect(
          new URL(loginPath, request.url),
        );
        redirectResponse.headers.set("Content-Security-Policy", cspHeader);
        return redirectResponse;
      }

      const isAdmin = user.app_metadata?.is_admin === true;

      if (!isAdmin) {
        console.warn("Auth middleware: User is not admin", user.id);
        const homePath = pathname.startsWith("/zh-TW") ? "/zh-TW" : "/";
        const redirectResponse = NextResponse.redirect(
          new URL(homePath, request.url),
        );
        redirectResponse.headers.set("Content-Security-Policy", cspHeader);
        return redirectResponse;
      }
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    if (strippedPathname.startsWith("/admin")) {
      const loginPath = pathname.startsWith("/zh-TW")
        ? "/zh-TW/login"
        : "/login";
      const redirectResponse = NextResponse.redirect(
        new URL(loginPath, request.url),
      );
      redirectResponse.headers.set("Content-Security-Policy", cspHeader);
      return redirectResponse;
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
