"use server";

import { locales } from "@/i18n/config";
import { createSupabaseServerClient } from "@/lib/db/supabase-auth";
import { assertAdmin } from "@/lib/server/server-auth";
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

    // 重新验证各个语言版本的受影响页面
    for (const locale of locales) {
      revalidatePath(`/${locale}`);
      revalidatePath(`/${locale}/song/${id}`);
    }
    revalidatePath("/");
    revalidatePath(`/song/${id}`);

    return { success: true };
  } catch (err: unknown) {
    console.error("handleApprove unexpected error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "未知错误",
    };
  }
}
