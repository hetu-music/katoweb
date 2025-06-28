import React from 'react';
import { notFound } from 'next/navigation';
import SongDetailClient from './SongDetailClient';
import { getSongById } from '../../lib/supabase';

// 服务端组件
export default async function SongDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const song = await getSongById(parseInt(id));

  if (!song) {
    notFound();
  }

  // 将数据传递给客户端组件
  return <SongDetailClient song={song} />;
}

// 生成静态参数
export async function generateStaticParams() {
  return [];
}

// 配置 ISR
export const revalidate = 3600;