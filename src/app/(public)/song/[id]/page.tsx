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

  // 构建描述信息 — 使用自然语言句式，减少 Google 忽略 meta description 的概率
  const descParts: string[] = [];
  if (song.artist?.length) descParts.push(`演唱：${song.artist.join("、")}`);
  if (song.lyricist?.length) descParts.push(`作词：${song.lyricist.join("、")}`);
  if (song.composer?.length) descParts.push(`作曲：${song.composer.join("、")}`);
  if (song.arranger?.length) descParts.push(`编曲：${song.arranger.join("、")}`);

  let description = `《${song.title}》`;
  if (song.album) description += `收录于专辑《${song.album}》`;
  if (song.year) description += `（${song.year}年）`;
  description += "。";
  if (descParts.length) description += descParts.join("，") + "。";
  description += "河图作品勘鉴收录。";

  // OG 封面走代理路径，确保爬虫可以访问
  const coverFilename =
    song.hascover === true
      ? `${song.id}.jpg`
      : song.hascover === false
        ? "proto.jpg"
        : "default.jpg";

  return {
    title: song.title,
    description,
    openGraph: {
      title: `${song.title} - 河图作品勘鉴`,
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
