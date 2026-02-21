import type { Metadata } from "next";
import { Suspense } from "react";
import MusicLibraryClient from "@/components/library/MusicLibraryClient";
import { getSongs } from "@/lib/service-songs";
import { Song } from "@/lib/types";
import Loading from "@/components/shared/Loading";
import ErrorState from "@/components/shared/Error";

// 动态生成首页 SEO 元数据
export async function generateMetadata(): Promise<Metadata> {
  let description =
    "收录河图音乐作品，提供歌曲信息、歌词、专辑等详细资料的查阅与筛选。";

  try {
    const songs = await getSongs(undefined, undefined, true);
    const count = songs.length;
    // 数据已按日期降序排列，取最新的几首
    const recentTitles = songs
      .slice(0, 5)
      .map((s) => s.title)
      .join("、");
    description = `共收录${count}首作品。最近收录：${recentTitles}。提供歌曲信息、歌词、专辑等详细资料的查阅与筛选。`;
  } catch {
    // 获取失败时使用默认描述
  }

  return {
    title: "河图作品勘鉴 — 河图音乐作品收录与鉴赏",
    description,
    openGraph: {
      title: "河图作品勘鉴",
      description,
      type: "website",
      images: [{ url: "/icons/source.png" }],
    },
  };
}

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
