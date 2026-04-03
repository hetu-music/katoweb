import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "./lib/supabase-auth";

export async function proxy(request: NextRequest) {
  // Generate a random nonce for CSP
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  // Development environment check
  const isDev = process.env.NODE_ENV === "development";
  const pathname = request.nextUrl.pathname;

  // Determine the route type based on the new structure
  // (admin) group: Starts with /admin or is /login -> Strict CSP
  // (public) group: /, /song/*, etc. -> Relaxed CSP (Static/ISR)
  // Note: /api is excluded by the matcher below, so we don't need to check for it here.
  const isStrictRoute = pathname.startsWith("/admin") || pathname === "/login";

  // Only use Nonce in Production on Strict routes
  // We disable Nonce in Development to avoid HMR/Hydration errors
  const useNonce = isStrictRoute && !isDev;

  let cspHeader = "";

  if (useNonce) {
    // [STRICT POLICY] For Admin Routes
    // - Requires 'nonce' for all scripts
    // - valid for: /admin/*, /login
    cspHeader = `
      default-src 'self';
      script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'sha256-n46vPwSWuMC0W703pBofImv82Z26xo4LXymv0E9caPk=' https://challenges.cloudflare.com https://static.cloudflareinsights.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: https://cover.hetu-music.com;
      font-src 'self';
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
    // [RELAXED POLICY] For Public Static/ISR Pages & Development
    // - Allows unsafe-inline/eval for broad compatibility with static hydration
    // - valid for: /, /song/*, and all routes in 'pnpm dev'
    cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://static.cloudflareinsights.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: https://cover.hetu-music.com;
      font-src 'self';
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

  // Create request headers
  const requestHeaders = new Headers(request.headers);

  // Only set x-nonce if we are using it
  if (useNonce) {
    requestHeaders.set("x-nonce", nonce);
  }

  requestHeaders.set("Content-Security-Policy", cspHeader);

  // Initialize response with new headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Apply Security Headers to Response
  response.headers.set("Content-Security-Policy", cspHeader);

  // Always refresh the Supabase session so cookies stay valid on all routes
  // (including public pages that need to read auth state client-side)
  try {
    const supabase = createSupabaseMiddlewareClient(request, response);
    const { data: { user }, error } = await supabase.auth.getUser();

    // Admin-only: redirect to login if not authenticated or not admin
    if (request.nextUrl.pathname.startsWith("/admin")) {
      if (error || !user) {
        console.warn("Auth middleware: User not authenticated", error?.message);
        const redirectResponse = NextResponse.redirect(
          new URL("/login", request.url),
        );
        redirectResponse.headers.set("Content-Security-Policy", cspHeader);
        return redirectResponse;
      }

      // Check is_admin flag in the users table
      const { data: userData } = await supabase
        .from("users")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();

      if (!userData?.is_admin) {
        console.warn("Auth middleware: User is not admin", user.id);
        const redirectResponse = NextResponse.redirect(
          new URL("/", request.url),
        );
        redirectResponse.headers.set("Content-Security-Policy", cspHeader);
        return redirectResponse;
      }
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    if (request.nextUrl.pathname.startsWith("/admin")) {
      const redirectResponse = NextResponse.redirect(
        new URL("/login", request.url),
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
