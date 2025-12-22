import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { TABLE_NAMES } from "./constants";

// Server-side cache for Supabase clients
const clientCache = new Map<string, SupabaseClient>();

/**
 * 创建服务端数据访问 Supabase 客户端
 * 
 * ⚠️ 警告：此函数只能在服务端使用（服务端组件、API 路由等）
 * 
 * @param table - 表名，如果是 MAIN_TABLE 将使用高权限密钥
 * @param accessToken - 可选的访问令牌，用于非 MAIN_TABLE 的认证请求
 * @returns Supabase 客户端实例
 */
export function createSupabaseDataClient(table?: string, accessToken?: string) {
    // 运行时检查：确保只在服务端使用
    if (typeof window !== "undefined") {
        throw new Error(
            "createSupabaseDataClient can only be used on the server side. " +
            "This function may use service role keys and must never be exposed to the client.",
        );
    }

    let supabaseUrl: string | undefined;
    let supabaseKey: string | undefined;
    const options: { global?: { headers: { Authorization: string } } } = {};

    if (table === TABLE_NAMES.MAIN) {
        // 使用高权限 API 密钥访问主表
        supabaseUrl = process.env.SUPABASE_URL;
        supabaseKey = process.env.SUPABASE_SECRET_API;
        // 使用高权限API时不带token
    } else {
        // 使用普通 anon 密钥，配合可选的 access token
        supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (accessToken) {
            options.global = { headers: { Authorization: `Bearer ${accessToken}` } };
        }
    }

    if (
        !supabaseUrl ||
        !supabaseKey ||
        supabaseUrl === "placeholder" ||
        supabaseKey === "placeholder"
    ) {
        console.warn("Using placeholder environment variables");
        return null;
    }

    // 创建缓存键
    const cacheKey = `${supabaseUrl}-${supabaseKey}-${accessToken || "no-token"}`;

    // 检查缓存
    if (clientCache.has(cacheKey)) {
        return clientCache.get(cacheKey);
    }

    // 创建新客户端并缓存
    const client = createClient(supabaseUrl, supabaseKey, options);
    clientCache.set(cacheKey, client);

    // 限制缓存大小，防止内存泄漏
    if (clientCache.size > 10) {
        const firstKey = clientCache.keys().next().value;
        if (firstKey) {
            clientCache.delete(firstKey);
        }
    }

    return client;
}
