import { Suspense } from "react";
import MusicLibraryClient from "@/components/library/MusicLibraryClient";
import { getSongs } from "@/lib/supabase";
import { Song } from "@/lib/types";
import Loading from "@/components/shared/Loading";
import ErrorState from "@/components/shared/Error";

// 服务端组件 - 使用 ISR
export default async function MusicLibraryPage() {
  let songsData: Song[] = [];
  let error: Error | null = null;

  try {
    // forListView = true 只获取列表展示需要的字段，排除歌词等大字段
    songsData = await getSongs(undefined, undefined, true);
  } catch (err) {
    console.error("Error fetching songs:", err);
    error = err instanceof Error ? err : new Error("未知错误");
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <Suspense fallback={<Loading />}>
      <MusicLibraryClient initialSongsData={songsData} />
    </Suspense>
  );
}

// 启用 ISR - 每2小时重新生成页面，减少服务器负载
export const revalidate = 7200;
