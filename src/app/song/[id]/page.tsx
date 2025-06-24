"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';

function formatTime(seconds: number | null) {
  if (!seconds || isNaN(seconds)) return '未知';
  const min = Math.floor(seconds / 60);
  const sec = (seconds % 60).toString().padStart(2, '0');
  return `${min}:${sec}`;
}

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
  type?: string[] | null;
};

// 缓存数据
const CACHE_KEY_PREFIX = 'song_detail_';
const CACHE_DURATION = 30 * 60 * 1000; // 30分钟

const getCachedSong = (id: string): { data: Song | null; timestamp: number } => {
  if (typeof window === 'undefined') return { data: null, timestamp: 0 };

  try {
    const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${id}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        data: parsed.data,
        timestamp: parsed.timestamp
      };
    }
  } catch (error) {
    console.error('Failed to parse cached song data:', error);
  }
  return { data: null, timestamp: 0 };
};

const setCachedSong = (id: string, data: Song) => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(`${CACHE_KEY_PREFIX}${id}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Failed to cache song data:', error);
  }
};

const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_DURATION;
};

const SongDetail = () => {
  const params = useParams();
  const id = params.id as string;
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [lyricsExpanded, setLyricsExpanded] = useState(true);
  const router = useRouter();

  // 用 useRef 替代闭包变量
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastId = useRef<string | null>(null);

  const fetchSong = useCallback(
    async (forceRefresh = false) => {
      if (!id) return;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(async () => {
        if (lastId.current === id && !forceRefresh) return;
        lastId.current = id;
        setLoading(true);
        setError(null);
        // 检查缓存（除非强制刷新）
        if (!forceRefresh) {
          const { data: cachedData, timestamp } = getCachedSong(id);
          if (cachedData && isCacheValid(timestamp)) {
            setSong(cachedData);
            setLoading(false);
            return;
          }
        }
        try {
          const response = await fetch(`/api/songs/${id}`);

          if (!response.ok) {
            if (response.status === 404) {
              throw new Error('未找到该歌曲');
            }
            throw new Error('加载歌曲失败');
          }

          const data = await response.json();

          const processedSong = {
            ...data,
            cover: data.cover && data.cover.trim() !== '' ? data.cover : 'https://cover.hetu-music.com/default.jpg',
            year: data.date ? new Date(data.date).getFullYear() : null,
          };
          setSong(processedSong);
          setCachedSong(id, processedSong);
        } catch (err) {
          console.error('Error fetching song:', err);
          setError(err instanceof Error ? err.message : '加载歌曲失败');
        } finally {
          setLoading(false);
        }
      }, 300);
    },
    [id, setLoading, setError, setSong]
  );

  // 滚动到顶部
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // 初始化数据获取
  useEffect(() => {
    if (id) {
      fetchSong();
    }
  }, [id, fetchSong]);

  // 滚动监听
  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // 使用 useMemo 优化渲染性能
  const songInfo = useMemo(() => {
    if (!song) return null;

    return {
      creativeInfo: [
        { label: '作词', value: (song.lyricist && song.lyricist.length > 0) ? song.lyricist.join(', ') : '未知' },
        { label: '作曲', value: (song.composer && song.composer.length > 0) ? song.composer.join(', ') : '未知' },
        { label: '编曲', value: (song.arranger && song.arranger.length > 0) ? song.arranger.join(', ') : '未知' },
        { label: '演唱', value: (song.artist && song.artist.length > 0) ? song.artist.join(', ') : '未知' },
      ],
      basicInfo: [
        { label: '专辑', value: song.album || '未知' },
        { label: '专辑艺人', value: (song.albumartist && song.albumartist.length > 0) ? song.albumartist.join(', ') : '未知' },
        { label: '发行日期', value: song.date || '未知' },
        { label: '时长', value: formatTime(song.length) },
        { label: '曲号', value: `${song.track || '未知'}/${song.tracktotal || '未知'}` },
        { label: '碟号', value: `${song.discnumber || '未知'}/${song.disctotal || '未知'}` },
        { label: '流派', value: (song.genre && song.genre.length > 0) ? song.genre.join(', ') : '未知' },
        { label: '类型', value: (song.type && song.type.length > 0) ? song.type.join(', ') : '原创' },
      ]
    };
  }, [song]);

  // 加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <div className="text-lg">加载中...</div>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-lg mb-4">❌ {error}</div>
          <div className="space-x-4">
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200"
            >
              返回主页
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-lg">未找到该歌曲</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        {/* 顶部操作栏 */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200 shadow-sm"
          >
            <ArrowLeft size={18} />
            返回主页面
          </button>
        </div>

        {/* 主信息区 */}
        <div className="flex flex-col md:flex-row gap-8 items-start bg-white/10 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20 mb-8">
          {/* 封面 */}
          <div className="w-full md:w-48 flex-shrink-0 flex justify-center md:justify-start">
            <Image
              src={song.cover || 'https://cover.hetu-music.com/default.jpg'}
              alt={song.album || song.title}
              width={192}
              height={192}
              className="w-48 h-48 object-cover rounded-2xl shadow-lg"
              style={{ objectFit: 'cover' }}
              priority
            />
          </div>

          {/* 歌曲主信息 */}
          <div className="flex-1 text-white space-y-4 w-full">
            <div>
              <h1 className="text-3xl font-bold mb-3 break-words">{song.title}</h1>
              <div className="flex flex-wrap gap-2">
                {(song.genre || []).map((g: string) => (
                  <span key={g} className="px-3 py-1 text-xs bg-blue-500/20 text-blue-300 rounded-full border border-blue-400/30">
                    {g}
                  </span>
                ))}
                {(song.type && song.type.length > 0 ? song.type : ['原创']).map((t: string) => (
                  <span key={t} className="px-3 py-1 text-xs bg-green-500/20 text-green-300 rounded-full border border-green-400/30">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* 创作信息 */}
            <div>
              <h3 className="font-semibold text-lg text-white/90 mb-3">创作信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                {songInfo?.creativeInfo.map((item, index) => (
                  <div key={index} className="flex flex-col">
                    <span className="font-semibold text-blue-300 text-base md:text-lg min-w-[4rem] mb-1">{item.label}：</span>
                    <span className="text-white/90 break-words">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 基本信息 */}
            <div>
              <h3 className="font-semibold text-lg text-white/90 mb-3">基本信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                {songInfo?.basicInfo.map((item, index) => (
                  <div key={index} className="flex flex-col">
                    <span className="font-semibold text-blue-300 text-base md:text-lg min-w-[6rem] mb-1">{item.label}：</span>
                    <span className="text-white/90 break-words">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 备注区块 */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 text-white/90 border border-white/10 mb-8 shadow-lg">
          <h3 className="font-semibold mb-3 text-lg text-white flex items-center gap-2">
            备注
          </h3>
          <div className="whitespace-pre-line leading-relaxed">
            {song.comment ? (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                {song.comment}
              </div>
            ) : (
              <div className="text-gray-400 italic text-center py-4">暂无备注</div>
            )}
          </div>
        </div>

        {/* 歌词区块 */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 text-white/90 border border-white/10 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg text-white flex items-center gap-2">
              歌词
            </h3>
            {song.lyrics && song.lyrics.length > 500 && (
              <button
                onClick={() => setLyricsExpanded(!lyricsExpanded)}
                className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 transition-all duration-200 text-sm"
              >
                {lyricsExpanded ? <EyeOff size={16} /> : <Eye size={16} />}
                {lyricsExpanded ? '收起' : '展开'}
              </button>
            )}
          </div>

          <div className="whitespace-pre-line leading-relaxed">
            {song.lyrics ? (
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className={`${!lyricsExpanded && song.lyrics.length > 500 ? 'max-h-64 overflow-hidden' : ''} transition-all duration-300`}>
                  {song.lyrics}
                </div>
                {!lyricsExpanded && song.lyrics.length > 500 && (
                  <div className="mt-2 text-center">
                    <button
                      onClick={() => setLyricsExpanded(true)}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      点击展开完整歌词
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-400 italic text-center py-8">暂无歌词</div>
            )}
          </div>
        </div>
      </div>

      {/* 返回顶部按钮 */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-40 p-3 rounded-full bg-gradient-to-br from-purple-700 via-blue-700 to-indigo-700 text-white shadow-lg border border-white/20 backdrop-blur-md hover:scale-110 transition-all duration-200"
          aria-label="返回顶部"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default SongDetail;