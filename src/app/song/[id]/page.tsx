"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Play, ArrowLeft } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

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
  cover?: string | null;
  date?: string | null;
  albumartist?: string[] | null;
  arranger?: string[] | null;
  comment?: string | null;
  discnumber?: number | null;
  disctotal?: number | null;
  lyrics?: string | null;
  track?: number | null;
  tracktotal?: number | null;
  type?: string | null;
};

function formatTime(seconds: number | null) {
  if (!seconds || isNaN(seconds)) return '-';
  const min = Math.floor(seconds / 60);
  const sec = (seconds % 60).toString().padStart(2, '0');
  return `${min}:${sec}`;
}

const SongDetail = () => {
  const params = useParams();
  const { id } = params;
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchSong = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('music')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) {
        setSong({
          ...data,
          cover: data.cover && data.cover.trim() !== '' ? data.cover : 'https://opynrrdphngyveihxpdt.supabase.co/storage/v1/object/sign/cover/0a1.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV83Y2I4MjAxMS1mZjhmLTQwZWEtYmU2Ni1iOTdlNzhhNWY5ZWUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjb3Zlci8wYTEuanBnIiwiaWF0IjoxNzUwNDMxODI2LCJleHAiOjE3ODE5Njc4MjZ9.e-EQnIn7tWFt4T_pTDzUbXRs8l6feunUzRiwilhq9QA',
        });
      }
      setLoading(false);
    };
    if (id) fetchSong();
  }, [id]);

  if (loading) {
    return <div className="text-center py-16 text-gray-400">加载中...</div>;
  }
  if (!song) {
    return <div className="text-center py-16 text-gray-400">未找到该歌曲</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex justify-center py-8 px-2">
      <div className="w-full max-w-5xl mx-auto">
        {/* 返回按钮 */}
        <button
          onClick={() => router.push('/')}
          className="mb-6 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200 shadow-sm"
        >
          <ArrowLeft size={18} />
          返回主页面
        </button>
        {/* 主信息区 */}
        <div className="flex flex-col md:flex-row gap-8 items-center bg-white/10 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20 mb-8">
          {/* 封面 */}
          <div className="relative w-48 h-48 flex-shrink-0">
            <img
              src={song.cover || 'https://opynrrdphngyveihxpdt.supabase.co/storage/v1/object/sign/cover/0a1.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV83Y2I4MjAxMS1mZjhmLTQwZWEtYmU2Ni1iOTdlNzhhNWY5ZWUiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJjb3Zlci8wYTEuanBnIiwiaWF0IjoxNzUwNDMxODI2LCJleHAiOjE3ODE5Njc4MjZ9.e-EQnIn7tWFt4T_pTDzUbXRs8l6feunUzRiwilhq9QA'}
              alt={song.album || song.title}
              className="w-full h-full object-cover rounded-2xl shadow-lg"
            />
            <button className="absolute bottom-4 right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
              <Play className="text-black ml-1" size={20} fill="currentColor" />
            </button>
          </div>
          {/* 歌曲主信息 */}
          <div className="flex-1 text-white space-y-2 w-full">
            <h2 className="text-3xl font-bold mb-2 break-words">{song.title}</h2>
            <div className="flex flex-wrap gap-2 mb-2">
              {(song.genre || []).map((g: string) => (
                <span key={g} className="px-3 py-1 text-xs bg-blue-500/20 text-blue-300 rounded-full">
                  {g}
                </span>
              ))}
              <span className="px-3 py-1 text-xs bg-green-500/20 text-green-300 rounded-full">
                {song.type || '原创'}
              </span>
            </div>
            {/* 主要创作信息 */}
            <div className="mb-4">
              <div className="font-semibold text-base text-white/80 mb-1">创作信息</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 p-4 rounded-xl bg-white/5 border border-white/10">
                <div><span className="font-semibold">作词：</span>{(song.lyricist && song.lyricist.length > 0) ? song.lyricist.join(', ') : '-'}</div>
                <div><span className="font-semibold">作曲：</span>{(song.composer && song.composer.length > 0) ? song.composer.join(', ') : '-'}</div>
                <div><span className="font-semibold">编曲：</span>{(song.arranger && song.arranger.length > 0) ? song.arranger.join(', ') : '-'}</div>
                <div><span className="font-semibold">演唱：</span>{(song.artist && song.artist.length > 0) ? song.artist.join(', ') : '-'}</div>
              </div>
            </div>
            {/* 其余主要信息 */}
            <div className="mb-4">
              <div className="font-semibold text-base text-white/80 mb-1">基本信息</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 p-4 rounded-xl bg-white/5 border border-white/10">
                <div><span className="font-semibold">专辑：</span>{song.album || '-'}</div>
                <div><span className="font-semibold">专辑艺人：</span>{(song.albumartist && song.albumartist.length > 0) ? song.albumartist.join(', ') : '-'}</div>
                <div><span className="font-semibold">发行日期：</span>{song.date || '-'}</div>
                <div><span className="font-semibold">时长：</span>{formatTime(song.length)}</div>
                <div><span className="font-semibold">曲号：</span>{song.track || '-'}/{song.tracktotal || '-'}</div>
                <div><span className="font-semibold">碟号：</span>{song.discnumber || '-'}/{song.disctotal || '-'}</div>
                <div><span className="font-semibold">流派：</span>{(song.genre && song.genre.length > 0) ? song.genre.join(', ') : '-'}</div>
                <div><span className="font-semibold">类型：</span>{song.type || '原创'}</div>
              </div>
            </div>
          </div>
        </div>
        {/* 评论区块 */}
        <div className="bg-white/5 rounded-xl p-6 text-white/90 text-base whitespace-pre-line border border-white/10 mb-8 w-full">
          <div className="font-semibold mb-2 text-lg text-white">备注</div>
          <div>{song.comment ? song.comment : <span className="text-gray-400">暂无备注</span>}</div>
        </div>
        {/* 歌词区块 */}
        <div className="bg-white/5 rounded-xl p-6 text-white/90 text-base whitespace-pre-line border border-white/10 w-full">
          <div className="font-semibold mb-2 text-lg text-white">歌词</div>
          <div>{song.lyrics ? song.lyrics : <span className="text-gray-400">暂无歌词</span>}</div>
        </div>
      </div>
    </div>
  );
};

export default SongDetail; 