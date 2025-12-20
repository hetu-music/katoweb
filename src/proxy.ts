import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseMiddlewareClient } from "./lib/supabase-server";

export async function proxy(request: NextRequest) {
  // Generate a random nonce for CSP
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  // Development environment check
  const isDev = process.env.NODE_ENV === "development";
  const pathname = request.nextUrl.pathname;

  // Determine if the page is ISR (Static/SSG)
  // Main page "/" and Song Detail pages "/song/*" are ISR
  const isISR = pathname === "/" || pathname.startsWith("/song/");

  let cspHeader = "";
  const useNonce = !isISR && !isDev; // Only use Nonce in Production and Non-ISR pages

  if (!useNonce) {
    // Relaxed CSP for ISR/Static pages OR Development
    // Removes 'nonce' and 'strict-dynamic' to allow static scripts and HMR
    cspHeader = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com;
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
    // Strict CSP for Admin and Dynamic pages in Production
    // Uses Nonce and strict-dynamic for maximum security
    cspHeader = `
      default-src 'self';
      script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'sha256-n46vPwSWuMC0W703pBofImv82Z26xo4LXymv0E9caPk=' https://challenges.cloudflare.com;
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
      require-trusted-types-for 'script';
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

  // Auth Logic for Admin Routes
  if (request.nextUrl.pathname.startsWith("/admin")) {
    // Login page does not need auth
    if (request.nextUrl.pathname === "/admin/login") {
      return response;
    }

    try {
      const supabase = createSupabaseMiddlewareClient(request, response);

      // Verify session via getUser
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      // Redirect to login if error or no user
      if (error || !user) {
        console.warn("Auth middleware: User not authenticated", error?.message);

        // Ensure redirect response also has security headers
        const redirectUrl = new URL("/admin/login", request.url);
        const redirectResponse = NextResponse.redirect(redirectUrl);
        // Copy security headers to redirect response
        redirectResponse.headers.set("Content-Security-Policy", cspHeader);

        return redirectResponse;
      }
    } catch (error) {
      console.error("Auth middleware error:", error);
      const redirectResponse = NextResponse.redirect(
        new URL("/admin/login", request.url)
      );
      // Copy security headers to redirect response
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
