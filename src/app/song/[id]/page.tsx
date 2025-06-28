import React from 'react';
import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import SongDetailClient from './SongDetailClient';

// formatTime 函数保持不变
function formatTime(seconds: number | null) {
  if (!seconds || isNaN(seconds)) return '未知';
  const min = Math.floor(seconds / 60);
  const sec = (seconds % 60).toString().padStart(2, '0');
  return `${min}:${sec}`;
}

// Song 类型定义保持不变
type Song = {
  id: number;
  title: string;
  album: string | null;
  year: number | null;
  genre: string[] | null;
  lyricist: string[] | null;
  composer: string[] | null;
  artist: string[] | null;
  length: number | null;
  hascover?: boolean | null;
  date?: string | null;
  albumartist?: string[] | null;
  arranger?: string[] | null;
  comment?: string | null;
  discnumber?: number | null;
  disctotal?: number | null;
  lyrics?: string | null;
  track?: number | null;
  tracktotal?: number | null;
  type?: string[] | null;
};

// 服务端数据获取函数
async function getSong(id: string): Promise<Song | null> {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from('music')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Supabase error:', error);
    return null;
  }

  // 处理数据，与原来的 processedSong 逻辑相同
  return {
    ...data,
    hascover: data.hascover,
    year: data.date ? new Date(data.date).getFullYear() : null,
  };
}

// 服务端组件
export default async function SongDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const song = await getSong(id);

  if (!song) {
    notFound();
  }

  // 将数据传递给客户端组件
  return <SongDetailClient song={song} />;
}

// 生成静态参数（可选，如果您有固定的歌曲ID列表）
export async function generateStaticParams() {
  // 如果您想为所有歌曲生成静态页面，可以在这里返回所有ID
  // 为了演示，这里返回空数组，表示按需生成
  return [];
}

// 配置 ISR
export const revalidate = 3600; // 1小时后重新验证