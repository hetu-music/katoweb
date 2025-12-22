import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Client-side cache for Supabase clients
const clientCache = new Map<string, SupabaseClient>();

// 环境变量定义的表名
const MAIN_TABLE = process.env.MAIN_TABLE || "music";

// 创建Supabase客户端，根据表名和可选 accessToken 选择不同的密钥
export function createSupabaseClient(table?: string, accessToken?: string) {
    let supabaseUrl: string | undefined;
    let supabaseKey: string | undefined;
    const options: { global?: { headers: { Authorization: string } } } = {};

    if (table === MAIN_TABLE) {
        supabaseUrl = process.env.SUPABASE_URL;
        supabaseKey = process.env.SUPABASE_SECRET_API;
        // 使用高权限API时不带token
    } else {
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
