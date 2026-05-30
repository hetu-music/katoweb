import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

/**
 * 📝 Supabase 客户端文件说明：
 *
 * - `supabase-auth.ts` (本文件) - 用于**认证和会话管理**的服务端客户端
 *   - 处理用户登录、会话、cookies
 *   - 使用 @supabase/ssr 包
 *   - 使用 NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * - `supabase-server.ts` - 用于**数据访问**的服务端客户端
 *   - 查询数据库表（songs, users 等）
 *   - 可以使用高权限密钥（SUPABASE_SECRET_API）访问主表
 *   - 仅在服务端使用，包含运行时检查
 */

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
          cookieStore.set(name, value, {
            ...options,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
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
          response.cookies.set(name, value, {
            ...options,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
          });
        });
      },
    },
  });
}
