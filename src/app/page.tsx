"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Search, Play, Filter, Grid, List } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Supabase 配置（请替换为你的 Supabase URL 和 匿名 key）
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
};

const MusicLibrary = () => {
  // const songsData = [...] // 移除本地数据
  const [songsData, setSongsData] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('全部');
  const [selectedYear, setSelectedYear] = useState('全部');
  const [viewMode, setViewMode] = useState('grid');
  const [hoveredSong, setHoveredSong] = useState<string | null>(null);

  useEffect(() => {
    const fetchSongs = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('music')
        .select('*');
      if (!error && data) {
        // Map DB data to UI data
        const mapped = data.map((song: any) => ({
          id: song.id,
          title: song.title,
          album: song.album,
          year: song.date ? new Date(song.date).getFullYear() : null,
          genre: song.genre,
          lyricist: song.lyricist,
          composer: song.composer,
          artist: song.artist,
          length: song.length,
          cover: song.cover || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&crop=center',
        }));
        setSongsData(mapped);
      }
      setLoading(false);
    };
    fetchSongs();
  }, []);

  // 获取所有类型和年份
  const allGenres = ['全部', ...new Set(songsData.flatMap(song => song.genre ? song.genre : []))];
  const allYears = ['全部', ...Array.from(new Set(songsData.map(song => song.year).filter(Boolean))).sort((a, b) => (b as number) - (a as number))];

  // 过滤歌曲
  const filteredSongs = useMemo(() => {
    return songsData.filter(song => {
      const matchesSearch = song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (song.album && song.album.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (song.lyricist && song.lyricist.join(',').toLowerCase().includes(searchTerm.toLowerCase())) ||
        (song.composer && song.composer.join(',').toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesGenre = selectedGenre === '全部' || (song.genre && song.genre.includes(selectedGenre));
      const matchesYear = selectedYear === '全部' || (song.year && song.year.toString() === selectedYear);
      return matchesSearch && matchesGenre && matchesYear;
    });
  }, [searchTerm, selectedGenre, selectedYear, songsData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* 主容器 */}
      <div className="container mx-auto px-6 py-8">
        {/* 头部区域 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">周杰伦</h1>
              <p className="text-gray-300 text-lg">共 {songsData.length} 首歌曲</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all duration-200"
              >
                {viewMode === 'grid' ? <List size={20} /> : <Grid size={20} />}
              </button>
            </div>
          </div>

          {/* 搜索和筛选区域 */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* 搜索框 */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="搜索歌曲、专辑或作词作曲..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* 筛选器 */}
            <div className="flex gap-3">
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none cursor-pointer"
              >
                {allGenres.map(genre => (
                  <option key={genre} value={genre} className="bg-gray-800">{genre}</option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none cursor-pointer"
              >
                {allYears.map(year => (
                  <option key={year} value={year === null ? '' : year} className="bg-gray-800">{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 歌曲列表 */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">加载中...</div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {filteredSongs.map((song) => (
              <div
                key={song.id}
                className="group cursor-pointer"
                onMouseEnter={() => setHoveredSong(song.id.toString())}
                onMouseLeave={() => setHoveredSong(null)}
              >
                <div className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4 transition-all duration-300 hover:bg-white/10 hover:scale-105 hover:shadow-2xl">
                  {/* 专辑封面 */}
                  <div className="relative mb-4">
                    <img
                      src={song.cover || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&crop=center'}
                      alt={song.album || song.title}
                      className="w-full aspect-square object-cover rounded-xl"
                    />
                    {/* 播放按钮覆盖层 */}
                    <div className={`absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl transition-opacity duration-200 ${hoveredSong === song.id.toString() ? 'opacity-100' : 'opacity-0'}`}>
                      <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg transform transition-transform duration-200 hover:scale-110">
                        <Play className="text-black ml-1" size={16} fill="currentColor" />
                      </button>
                    </div>
                  </div>

                  {/* 歌曲信息 */}
                  <div className="space-y-1">
                    <h3 className="font-semibold text-white text-lg truncate">{song.title}</h3>
                    <p className="text-gray-300 text-sm truncate">{song.album || '-'}</p>
                    <p className="text-gray-400 text-xs">{song.year || '-'} • {song.length ? `${Math.floor(song.length / 60)}:${(song.length % 60).toString().padStart(2, '0')}` : '-'}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(song.genre || []).map((g: string) => (
                        <span key={g} className="px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded-full">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredSongs.map((song, index) => (
              <div
                key={song.id}
                className="group flex items-center p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredSong(song.id.toString())}
                onMouseLeave={() => setHoveredSong(null)}
              >
                {/* 序号 */}
                <div className="w-8 text-center text-gray-400 text-sm">
                  {hoveredSong === song.id.toString() ? (
                    <Play size={16} className="text-white" fill="currentColor" />
                  ) : (
                    index + 1
                  )}
                </div>

                {/* 专辑封面 */}
                <img
                  src={song.cover || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&crop=center'}
                  alt={song.album || song.title}
                  className="w-12 h-12 rounded-lg ml-4"
                />

                {/* 歌曲信息 */}
                <div className="flex-1 ml-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-medium">{song.title}</h3>
                      <p className="text-gray-400 text-sm">{song.album || '-'} • {song.year || '-'}</p>
                    </div>
                    <div className="flex items-center space-x-6 text-gray-400 text-sm">
                      <span>作词: {(song.lyricist && song.lyricist.length > 0) ? song.lyricist[0] : '-'}</span>
                      <span>作曲: {(song.composer && song.composer.length > 0) ? song.composer[0] : '-'}</span>
                      <span>{song.length ? `${Math.floor(song.length / 60)}:${(song.length % 60).toString().padStart(2, '0')}` : '-'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 无结果提示 */}
        {filteredSongs.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 text-lg mb-2">没有找到匹配的歌曲</div>
            <div className="text-gray-500 text-sm">尝试调整搜索条件或筛选器</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MusicLibrary;