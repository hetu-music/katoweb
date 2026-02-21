import type { Metadata } from "next";
import { Suspense } from "react";
import MusicLibraryClient from "@/components/library/MusicLibraryClient";
import { getSongs } from "@/lib/service-songs";
import { Song } from "@/lib/types";
import Loading from "@/components/shared/Loading";
import ErrorState from "@/components/shared/Error";

export const metadata: Metadata = {
  title: "河图作品勘鉴 — 河图音乐作品收录与鉴赏",
  description:
    "收录河图音乐作品，提供歌曲信息、歌词、专辑等详细资料的查阅与筛选。",
  openGraph: {
    title: "河图作品勘鉴",
    description:
      "收录河图音乐作品，提供歌曲信息、歌词、专辑等详细资料的查阅与筛选。",
    type: "website",
  },
};

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
