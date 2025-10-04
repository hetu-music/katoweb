import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// 服务端 Supabase 客户端缓存
const serverClientCache = new Map<string, any>();

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

  // 对于服务端客户端，我们不能简单地缓存，因为每个请求的 cookies 都不同
  // 但我们可以缓存客户端配置
  const cacheKey = `${supabaseUrl}-${supabaseAnonKey}`;
  
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}

/**
 * 创建用于 middleware 的 Supabase 客户端
 */
export function createSupabaseMiddlewareClient(request: any, response: any) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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
            secure: true,
            sameSite: "strict",
          });
        });
      },
    },
  });
}