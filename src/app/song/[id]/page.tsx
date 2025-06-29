import React from 'react';
import { notFound } from 'next/navigation';
import SongDetailClient from './SongDetailClient';
import { getSongById } from '../../lib/supabase';

// 服务端组件
export default async function SongDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const songId = parseInt(id);
    if (isNaN(songId)) {
      console.log('Invalid song ID:', id);
      notFound();
    }
    const song = await getSongById(songId);
    if (!song) {
      notFound();
    }
    return <SongDetailClient song={song} />;
  } catch (error) {
    console.error('Error in SongDetailPage:', error);
    notFound();
  }
}

// 生成静态参数
export async function generateStaticParams() {
  return [];
}

// 配置 ISR
export const revalidate = 86400;