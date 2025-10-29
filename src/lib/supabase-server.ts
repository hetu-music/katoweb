import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

/**
 * 创建服务端 Supabase 客户端，用于处理认证和 cookies
 * 这个函数专门用于服务端组件和 API 路由中需要处理认证的场景
 */
export async function createSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          // 确保所有 Supabase cookie 都有安全设置，并设置为 session cookies
          cookieStore.set(name, value, {
            ...options,
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            path: "/",
            // 覆盖 maxAge 和 expires，让它们成为 session cookies
            maxAge: undefined,
            expires: undefined,
          });
        });
      },
    },
  });
}

/**
 * 创建用于 middleware 的 Supabase 客户端
 */
export function createSupabaseMiddlewareClient(
  request: NextRequest,
  response: NextResponse,
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          // 确保所有 Supabase cookie 都有安全设置，并设置为 session cookies
          response.cookies.set(name, value, {
            ...options,
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            path: "/",
            // 覆盖 maxAge 和 expires，让它们成为 session cookies
            maxAge: undefined,
            expires: undefined,
          });
        });
      },
    },
  });
}
