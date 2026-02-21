import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SongDetailClient from "@/components/detail/SongDetailClient";
import { getSongById } from "@/lib/service-songs";

type PageProps = {
  params: Promise<{ id: string }>;
};

// 动态生成每首歌的 SEO 元数据
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const songId = parseInt(id);
  if (isNaN(songId)) return {};

  const song = await getSongById(songId);
  if (!song) return {};

  // 构建描述信息
  const parts: string[] = [];
  if (song.album) parts.push(`专辑：${song.album}`);
  if (song.artist?.length) parts.push(`演唱：${song.artist.join("、")}`);
  if (song.lyricist?.length) parts.push(`作词：${song.lyricist.join("、")}`);
  if (song.composer?.length) parts.push(`作曲：${song.composer.join("、")}`);
  if (song.year) parts.push(`${song.year}年`);
  const description = parts.length
    ? `${song.title} — ${parts.join("｜")}`
    : `${song.title} — 河图音乐作品详情`;

  // OG 封面走代理路径，确保爬虫可以访问
  const coverFilename =
    song.hascover === true
      ? `${song.id}.jpg`
      : song.hascover === false
        ? "proto.jpg"
        : "default.jpg";

  return {
    title: `${song.title} — 河图作品勘鉴`,
    description,
    openGraph: {
      title: `${song.title} — 河图作品勘鉴`,
      description,
      type: "music.song",
      images: [{ url: `/og-cover/${coverFilename}` }],
    },
  };
}
export default async function SongDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const songId = parseInt(id);
  if (isNaN(songId)) {
    console.warn("Invalid song ID:", id);
    notFound();
  }

  let song;
  try {
    song = await getSongById(songId);
  } catch (error) {
    console.error("Error in SongDetailPage:", error);
    notFound();
  }

  if (!song) {
    notFound();
  }

  return <SongDetailClient song={song} />;
}

// 生成静态参数
export async function generateStaticParams() {
  return [];
}

// 配置 ISR
export const revalidate = 7200;
