import { getServiceClient, TABLES } from "./supabase-server";
import { type TimelineEvent } from "@/components/story/qjtx/types";

/** 数据库中 story_qjtx 表的行结构（平铺） */
interface StoryQjtxRow {
  id: number;
  year: string | null;
  month: string | null;
  content: string[] | null;
  important: boolean;
  detail_title: string | null;
  detail_quote: string | null;
  detail_body: string[] | null;
  detail_closing: string | null;
}

/** 将数据库平铺行映射为前端使用的嵌套 TimelineEvent 结构 */
function mapRowToEvent(row: StoryQjtxRow): TimelineEvent {
  const hasDetail = !!row.detail_title;
  return {
    id: String(row.id),
    year: row.year ?? "",
    month: row.month ?? undefined,
    content: row.content ?? [],
    important: row.important,
    detail: hasDetail
      ? {
          title: row.detail_title!,
          quote: row.detail_quote ?? undefined,
          body: row.detail_body ?? [],
          closing: row.detail_closing ?? undefined,
        }
      : undefined,
  };
}

/**
 * 获取《倾尽天下》故事编年史数据
 *
 * 使用 Service Role Key 的高权限客户端（公开只读），
 * 按 id 升序返回所有节点。
 */
export async function getQjtxTimeline(): Promise<TimelineEvent[]> {
  const supabase = getServiceClient();
  if (!supabase) {
    console.warn("[getQjtxTimeline] Service client unavailable, returning empty data");
    return [];
  }

  const { data, error } = await supabase
    .from(TABLES.STORY_QJTX)
    .select("id, year, month, content, important, detail_title, detail_quote, detail_body, detail_closing")
    .order("id", { ascending: true });

  if (error) {
    console.error("[getQjtxTimeline] Supabase error:", error);
    return [];
  }

  return (data as StoryQjtxRow[]).map(mapRowToEvent);
}
