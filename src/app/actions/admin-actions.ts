"use server";

import { locales } from "@/i18n/config";
import { createSupabaseServerClient } from "@/lib/db/supabase-auth";
import { assertAdmin } from "@/lib/server/server-auth";
import {
  purgeCloudflareCache,
  purgeEdgeOneCache,
} from "@/lib/server/server-utils";
import { revalidatePath, revalidateTag } from "next/cache";

/**
 * 后台歌曲审批同步操作 (Server Action)
 *
 * @param id 暂存表 (temp) 中对应的歌曲 ID
 */
export async function handleApprove(id: number) {
  try {
    // 验证当前用户是否为管理员
    await assertAdmin();

    const supabase = await createSupabaseServerClient();

    // 【第一步】通知数据库执行同步
    const { error } = await supabase.rpc("approve_music_sync", { temp_id: id });

    if (error) {
      console.error("同步失败:", error.message);
      return { success: false, error: error.message };
    }

    // 【第二步】同步成功，执行缓存刷新以实现实时数据更新
    revalidateTag("music", "max");

    // 收集需要刷新缓存的相对路径
    const pathsToPurge: string[] = [];

    // 首页与歌曲页（包含不同语言版本）
    for (const locale of locales) {
      pathsToPurge.push(`/${locale}`);
      pathsToPurge.push(`/${locale}/song/${id}`);
    }
    pathsToPurge.push("/");
    pathsToPurge.push(`/song/${id}`);

    // 站点地图与歌词 API 索引
    pathsToPurge.push("/sitemap.xml");
    pathsToPurge.push("/api/public/songs/lyrics-index");

    // 1. 刷新 Next.js 本地服务缓存
    for (const path of pathsToPurge) {
      revalidatePath(path);
    }

    // 2. 刷新 Cloudflare CDN 的边缘节点缓存
    await purgeCloudflareCache(pathsToPurge);

    // 3. 刷新腾讯云 EdgeOne CDN 的边缘节点缓存（如果是独立域名）
    await purgeEdgeOneCache(pathsToPurge);

    return { success: true };
  } catch (err: unknown) {
    console.error("handleApprove unexpected error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "未知错误",
    };
  }
}
