import { NextResponse } from "next/server";
import { createSupabaseDataClient } from "@/lib/supabase-server";
import { processLyricsForSearch } from "@/lib/utils-song";
import { TABLE_NAMES } from "@/lib/constants";

// 歌词索引 API - 仅返回 id 和处理后的纯文本歌词
// 供前端异步拉取，用于本地歌词全文搜索
export const GET = async () => {
  const table = TABLE_NAMES.MAIN;
  const supabase = createSupabaseDataClient(table);
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not available" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from(table)
    .select("id,lyrics")
    .not("lyrics", "is", null);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch lyrics" }, { status: 500 });
  }

  // 处理 LRC 歌词为纯文本
  const index = (data ?? [])
    .map((row: { id: number; lyrics: string | null }) => ({
      id: row.id,
      l: processLyricsForSearch(row.lyrics),
    }))
    .filter((entry) => entry.l.length > 0);

  return NextResponse.json(index, {
    headers: {
      // CDN 缓存 6 小时，客户端缓存 30 分钟
      "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=1800",
    },
  });
};

// ISR - 每 2 小时重新生成
export const revalidate = 7200;
