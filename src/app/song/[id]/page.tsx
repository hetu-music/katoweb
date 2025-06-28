import React from 'react';
import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import SongDetailClient from './SongDetailClient';

// Song 类型定义
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
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  // 如果是构建时的占位符，返回空数组
  if (!supabaseUrl || !supabaseAnonKey ||
    supabaseUrl === 'placeholder' || supabaseAnonKey === 'placeholder') {
    console.log('Using placeholder environment variables, returning empty data');
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data, error } = await supabase
    .from('music')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Supabase error:', error);
    return null;
  }

  // 处理数据
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

// 生成静态参数
export async function generateStaticParams() {
  return [];
}

// 配置 ISR
export const revalidate = 3600; // 1小时后重新验证