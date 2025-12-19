import React from "react";
import { notFound } from "next/navigation";
import SongDetailClient from "@/components/detail/SongDetailClient";
import { getSongById } from "@/lib/supabase";

// 服务端组件
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
