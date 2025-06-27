"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Search, Grid, List, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

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
  type?: string[] | null;
};

// 缓存数据
const CACHE_KEY = 'music_library_data';
const CACHE_DURATION = 30 * 60 * 1000; // 30分钟

const getCachedData = (): { data: Song[] | null; timestamp: number } => {
  if (typeof window === 'undefined') return { data: null, timestamp: 0 };

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        data: parsed.data,
        timestamp: parsed.timestamp
      };
    }
  } catch (error) {
    console.error('Failed to parse cached data:', error);
  }
  return { data: null, timestamp: 0 };
};

const setCachedData = (data: Song[]) => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Failed to cache data:', error);
  }
};

const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_DURATION;
};

// 获取封面url
function getCoverUrl(song: Song): string {
  if (song.hascover === true) {
    return `https://cover.hetu-music.com/${song.id}.jpg`;
  } else if (song.hascover === false) {
    return 'https://cover.hetu-music.com/proto.jpg';
  } else {
    return 'https://cover.hetu-music.com/default.jpg';
  }
}

// type 标签颜色映射
const typeColorMap: Record<string, string> = {
  '翻唱': 'bg-green-500/20 text-green-300',
  '合作': 'bg-yellow-500/20 text-yellow-300',
  '原创': 'bg-purple-500/20 text-purple-300',
  '商业': 'bg-orange-500/20 text-orange-300',
};

const MusicLibrary = () => {
  const router = useRouter();
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;

  // 1. 初始化状态从URL参数读取
  const [searchTerm, setSearchTerm] = useState(() => searchParams?.get('q') || '');
  const [selectedType, setSelectedType] = useState(() => searchParams?.get('type') || '全部');
  const [selectedYear, setSelectedYear] = useState(() => searchParams?.get('year') || '全部');
  const [selectedLyricist, setSelectedLyricist] = useState(() => searchParams?.get('lyricist') || '全部');
  const [selectedComposer, setSelectedComposer] = useState(() => searchParams?.get('composer') || '全部');
  const [viewMode, setViewMode] = useState(() => searchParams?.get('view') || 'grid');
  const [songsData, setSongsData] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const hasRestoredScroll = useRef(false);
  const [restoringScroll, setRestoringScroll] = useState(true);

  // 2. 状态变化时同步到URL参数
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (searchTerm) params.set('q', searchTerm); else params.delete('q');
    if (selectedType && selectedType !== '全部') params.set('type', selectedType); else params.delete('type');
    if (selectedYear && selectedYear !== '全部') params.set('year', selectedYear); else params.delete('year');
    if (selectedLyricist && selectedLyricist !== '全部') params.set('lyricist', selectedLyricist); else params.delete('lyricist');
    if (selectedComposer && selectedComposer !== '全部') params.set('composer', selectedComposer); else params.delete('composer');
    if (viewMode && viewMode !== 'grid') params.set('view', viewMode); else params.delete('view');
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    if (newUrl !== window.location.pathname + window.location.search) {
      window.history.replaceState(null, '', newUrl);
    }
  }, [searchTerm, selectedType, selectedYear, selectedLyricist, selectedComposer, viewMode]);

  // 3. 滚动位置保存与恢复
  useEffect(() => {
    if (!loading && !hasRestoredScroll.current) {
      const scrollY = sessionStorage.getItem('music_scrollY');
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY, 10));
        sessionStorage.removeItem('music_scrollY');
        hasRestoredScroll.current = true;
      }
      // 等待一帧再显示内容，确保滚动已生效
      requestAnimationFrame(() => setRestoringScroll(false));
    } else if (!loading && hasRestoredScroll.current === false) {
      setRestoringScroll(false);
    }
  }, [loading]);

  const fetchSongs = useCallback(async (forceRefresh = false) => {
    setLoading(true);

    // 检查缓存
    if (!forceRefresh) {
      const { data: cachedData, timestamp } = getCachedData();
      if (cachedData && isCacheValid(timestamp)) {
        setSongsData(cachedData);
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch('/api/songs');

      if (!response.ok) {
        throw new Error('Failed to fetch songs');
      }

      const data = await response.json();

      const mapped = data.map((song: Song) => ({
        id: song.id,
        title: song.title,
        album: song.album,
        year: song.date ? new Date(song.date).getFullYear() : null,
        genre: song.genre,
        lyricist: song.lyricist,
        composer: song.composer,
        artist: song.artist,
        length: song.length,
        hascover: song.hascover,
        date: song.date,
        type: song.type,
      }));

      // 排序：有日期的按日期从新到旧，无日期的排在后面并保持原顺序
      const sorted = mapped.slice().sort((a: Song, b: Song) => {
        if (a.date && b.date) {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        } else if (a.date && !b.date) {
          return -1;
        } else if (!a.date && b.date) {
          return 1;
        } else {
          // 都没有日期，按原顺序
          return 0;
        }
      });

      setSongsData(sorted);
      setCachedData(sorted); // 缓存数据
    } catch (error) {
      console.error('Error fetching songs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 使用 useMemo 优化筛选选项计算
  const filterOptions = useMemo(() => {
    // 处理类型
    const typeSet = new Set<string>();
    let hasUnknownType = false;
    songsData.forEach(song => {
      if (!song.type || song.type.length === 0) {
        hasUnknownType = true;
      } else {
        song.type.forEach(t => typeSet.add(t));
      }
    });
    const allTypes = ['全部', ...Array.from(typeSet)];
    if (hasUnknownType) allTypes.push('未知');

    // 处理年份
    const yearSet = new Set<number>();
    let hasUnknownYear = false;
    songsData.forEach(song => {
      if (!song.year) {
        hasUnknownYear = true;
      } else {
        yearSet.add(song.year);
      }
    });
    const allYears = ['全部', ...Array.from(yearSet).sort((a, b) => (b as number) - (a as number))];
    if (hasUnknownYear) allYears.push('未知');

    // 处理作词
    const lyricistSet = new Set<string>();
    let hasUnknownLyricist = false;
    songsData.forEach(song => {
      if (!song.lyricist || song.lyricist.length === 0) {
        hasUnknownLyricist = true;
      } else {
        song.lyricist.forEach(l => lyricistSet.add(l));
      }
    });
    const allLyricists = ['全部', ...Array.from(lyricistSet)];
    if (hasUnknownLyricist) allLyricists.push('未知');

    // 处理作曲
    const composerSet = new Set<string>();
    let hasUnknownComposer = false;
    songsData.forEach(song => {
      if (!song.composer || song.composer.length === 0) {
        hasUnknownComposer = true;
      } else {
        song.composer.forEach(c => composerSet.add(c));
      }
    });
    const allComposers = ['全部', ...Array.from(composerSet)];
    if (hasUnknownComposer) allComposers.push('未知');

    return { allTypes, allYears, allLyricists, allComposers };
  }, [songsData]);

  // 防抖搜索
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 过滤歌曲 - 使用防抖后的搜索词
  const filteredSongs = useMemo(() => {
    return songsData.filter(song => {
      const matchesSearch = !debouncedSearchTerm ||
        song.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (song.album && song.album.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
        (song.lyricist && song.lyricist.join(',').toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
        (song.composer && song.composer.join(',').toLowerCase().includes(debouncedSearchTerm.toLowerCase()));

      // type 筛选
      const matchesType = selectedType === '全部' ||
        (selectedType === '未知' ? (!song.type || song.type.length === 0) : (song.type && song.type.includes(selectedType)));
      const matchesYear = selectedYear === '全部' ||
        (selectedYear === '未知' ? (!song.year) : (song.year && song.year.toString() === selectedYear));
      const matchesLyricist = selectedLyricist === '全部' ||
        (selectedLyricist === '未知' ? (!song.lyricist || song.lyricist.length === 0) : (song.lyricist && song.lyricist.includes(selectedLyricist)));
      const matchesComposer = selectedComposer === '全部' ||
        (selectedComposer === '未知' ? (!song.composer || song.composer.length === 0) : (song.composer && song.composer.includes(selectedComposer)));

      return matchesSearch && matchesType && matchesYear && matchesLyricist && matchesComposer;
    });
  }, [debouncedSearchTerm, selectedType, selectedYear, songsData, selectedLyricist, selectedComposer]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div style={{ opacity: restoringScroll ? 0 : 1, transition: 'opacity 0.2s' }}>
        {/* 关于弹窗 */}
        {aboutOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-purple-800 via-blue-900 to-indigo-900 border border-white/20 rounded-2xl shadow-2xl p-8 max-w-lg w-full relative text-white">
              <button
                className="absolute top-4 right-4 text-gray-300 hover:text-white text-xl font-bold"
                onClick={() => setAboutOpen(false)}
                aria-label="关闭"
              >
                ×
              </button>
              <h2 className="text-2xl font-bold mb-4">关于</h2>
              <div className="text-base leading-relaxed space-y-2">
                <p>本项目为河图作品勘鉴，收录了河图的主要音乐作品资料，支持筛选与搜索。</p>
                <p>数据由本人整理，来源为创作者微博及各大音乐平台，如有误漏请至 Github 提交反馈。</p>
                <p>Github: <a href="https://github.com/hetu-music/data" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">https://github.com/hetu-music/data</a></p>
              </div>
            </div>
          </div>
        )}

        {/* 主容器 */}
        <div className="container mx-auto px-6 py-8">
          {/* 头部区域 */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <h1 className="text-4xl font-bold text-white mb-2">河图作品勘鉴</h1>
                <button
                  className="ml-2 px-4 py-1 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200 text-sm font-medium shadow"
                  onClick={() => setAboutOpen(true)}
                >
                  关于
                </button>
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

            {/* 搜索和筛选区域 - 上下布局，保证两端对齐 */}
            <div className="w-full flex flex-col gap-3">
              {/* 搜索框 */}
              <div className="w-full flex items-center relative">
                <div className="h-[48px] flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/20 border-r-0 text-white rounded-l-2xl select-none min-w-[60px] max-w-[60px] w-[60px]">
                  <Search size={20} />
                </div>
                <input
                  type="text"
                  placeholder="搜索歌曲、作词、作曲、专辑..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-[48px] w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent focus:bg-white/15 transition-all duration-200 rounded-r-2xl border-l-0 min-w-0 pr-10"
                  style={{ marginLeft: '-1px' }}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full text-gray-300 hover:text-white focus:outline-none bg-transparent active:bg-white/10 transition-all"
                    aria-label="清空搜索"
                  >
                    <XCircle size={24} />
                  </button>
                )}
              </div>
              {/* 筛选框 */}
              <div className="w-full flex flex-col sm:flex-row gap-3">
                {/* 类型筛选 */}
                <div className="flex items-center flex-1 min-w-0">
                  <span className="h-[48px] flex sm:hidden lg:flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/20 border-r-0 text-blue-200 text-base font-semibold rounded-l-2xl select-none tracking-wide w-[120px] min-w-[120px] max-w-[140px]">类型</span>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="h-[48px] w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none cursor-pointer rounded-r-2xl border-l-0 ml-[-1px] sm:rounded-l-2xl sm:border-l sm:ml-0 lg:rounded-l-none lg:border-l-0 lg:ml-[-1px]"
                  >
                    {filterOptions.allTypes.map(type => (
                      <option key={type} value={type} className="bg-gray-800 text-white">{type}</option>
                    ))}
                  </select>
                </div>
                {/* 发行日期筛选 */}
                <div className="flex items-center flex-1 min-w-0">
                  <span className="h-[48px] flex sm:hidden lg:flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/20 border-r-0 text-blue-200 text-base font-semibold rounded-l-2xl select-none tracking-wide w-[120px] min-w-[120px] max-w-[140px]">发行日期</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="h-[48px] w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none cursor-pointer rounded-r-2xl border-l-0 ml-[-1px] sm:rounded-l-2xl sm:border-l sm:ml-0 lg:rounded-l-none lg:border-l-0 lg:ml-[-1px]"
                  >
                    {filterOptions.allYears.map(year => (
                      <option key={year} value={year === null ? '' : year} className="bg-gray-800 text-white">{year}</option>
                    ))}
                  </select>
                </div>
                {/* 作词筛选 */}
                <div className="flex items-center flex-1 min-w-0">
                  <span className="h-[48px] flex sm:hidden lg:flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/20 border-r-0 text-blue-200 text-base font-semibold rounded-l-2xl select-none tracking-wide w-[120px] min-w-[120px] max-w-[140px]">作词</span>
                  <select
                    value={selectedLyricist}
                    onChange={(e) => setSelectedLyricist(e.target.value)}
                    className="h-[48px] w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none cursor-pointer rounded-r-2xl border-l-0 ml-[-1px] sm:rounded-l-2xl sm:border-l sm:ml-0 lg:rounded-l-none lg:border-l-0 lg:ml-[-1px]"
                  >
                    {filterOptions.allLyricists.map(lyricist => (
                      <option key={lyricist} value={lyricist} className="bg-gray-800 text-white">{lyricist}</option>
                    ))}
                  </select>
                </div>
                {/* 作曲筛选 */}
                <div className="flex items-center flex-1 min-w-0">
                  <span className="h-[48px] flex sm:hidden lg:flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/20 border-r-0 text-blue-200 text-base font-semibold rounded-l-2xl select-none tracking-wide w-[120px] min-w-[120px] max-w-[140px]">作曲</span>
                  <select
                    value={selectedComposer}
                    onChange={(e) => setSelectedComposer(e.target.value)}
                    className="h-[48px] w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none cursor-pointer rounded-r-2xl border-l-0 ml-[-1px] sm:rounded-l-2xl sm:border-l sm:ml-0 lg:rounded-l-none lg:border-l-0 lg:ml-[-1px]"
                  >
                    {filterOptions.allComposers.map(composer => (
                      <option key={composer} value={composer} className="bg-gray-800 text-white">{composer}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 歌曲列表 */}
          {loading ? (
            <div className="text-center py-16 text-gray-400">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              加载中...
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6">
              {filteredSongs.map((song) => (
                <div
                  key={song.id}
                  className="group cursor-pointer touch-active"
                  onClick={e => {
                    sessionStorage.setItem('music_scrollY', String(window.scrollY));

                    if (typeof window !== 'undefined' && window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
                      const target = e.currentTarget;

                      // 立即添加按下效果
                      target.classList.add('touch-active-pressed');

                      // 短暂延迟后开始导航
                      setTimeout(() => {
                        target.classList.remove('touch-active-pressed');
                        target.classList.add('touch-navigating');

                        // 立即开始导航，不等待动画完成
                        router.push(`/song/${song.id}${window.location.search}`);
                      }, 120); // 减少到150ms，让用户感受到点击反馈但不会觉得卡顿
                    } else {
                      router.push(`/song/${song.id}${window.location.search}`);
                    }
                  }}
                >
                  <div className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4 transition-all duration-300 hover:bg-white/10 hover:scale-105 hover:shadow-2xl">
                    {/* 专辑封面 */}
                    <div className="relative mb-4">
                      <Image
                        src={getCoverUrl(song)}
                        alt={song.album || song.title}
                        width={400}
                        height={400}
                        className="w-full aspect-square object-cover rounded-xl"
                        style={{ objectFit: 'cover' }}
                      />
                    </div>

                    {/* 歌曲信息 */}
                    <div className="space-y-1">
                      <h3 className="font-semibold text-white text-lg truncate">{song.title}</h3>
                      <p className="text-gray-300 text-sm truncate">{song.album || '未知'}</p>
                      <p className="text-gray-400 text-xs">{song.year || '未知'} • {song.length ? `${Math.floor(song.length / 60)}:${(song.length % 60).toString().padStart(2, '0')}` : '未知'}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(song.type || []).map((t: string) => (
                          <span
                            key={t}
                            className={`px-2 py-1 text-xs rounded-full ${typeColorMap[t] || 'bg-gray-500/20 text-gray-300'}`}
                          >
                            {t}
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
                  className="group flex items-center p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-200 cursor-pointer touch-active"
                  onClick={e => {
                    sessionStorage.setItem('music_scrollY', String(window.scrollY));

                    if (typeof window !== 'undefined' && window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
                      const target = e.currentTarget;

                      // 立即添加按下效果
                      target.classList.add('touch-active-pressed');

                      // 短暂延迟后开始导航
                      setTimeout(() => {
                        target.classList.remove('touch-active-pressed');
                        target.classList.add('touch-navigating');

                        // 立即开始导航
                        router.push(`/song/${song.id}${window.location.search}`);
                      }, 120);
                    } else {
                      router.push(`/song/${song.id}${window.location.search}`);
                    }
                  }}
                >
                  {/* 序号 */}
                  <div className="w-8 text-center text-gray-400 text-sm">
                    {index + 1}
                  </div>

                  {/* 专辑封面 */}
                  <Image
                    src={getCoverUrl(song)}
                    alt={song.album || song.title}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-lg ml-4"
                    style={{ objectFit: 'cover' }}
                  />

                  {/* 歌曲信息 */}
                  <div className="flex-1 ml-4">
                    {/* 小屏：精简显示 */}
                    <div className="flex flex-col gap-1 md:hidden">
                      <h3 className="text-white font-medium truncate">{song.title}</h3>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {song.lyricist && song.lyricist.length > 0 && (
                          <span className="text-gray-300 text-sm truncate">{song.lyricist[0]}</span>
                        )}
                        {song.composer && song.composer.length > 0 && (
                          <span className="text-gray-300 text-sm truncate">{song.composer[0]}</span>
                        )}
                        {(song.type || []).map((t: string) => (
                          <span
                            key={t}
                            className={`px-2 py-1 text-xs rounded-full ${typeColorMap[t] || 'bg-gray-500/20 text-gray-300'}`}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    {/* 大屏：原有详细显示 */}
                    <div className="hidden md:flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-medium">{song.title}</h3>
                        <p className="text-gray-400 text-sm">{song.album || '未知'} • {song.year || '未知'}</p>
                      </div>
                      <div className="flex items-center space-x-6 text-gray-400 text-sm">
                        <span>作词: {(song.lyricist && song.lyricist.length > 0) ? song.lyricist[0] : '未知'}</span>
                        <span>作曲: {(song.composer && song.composer.length > 0) ? song.composer[0] : '未知'}</span>
                        <span>{song.length ? `${Math.floor(song.length / 60)}:${(song.length % 60).toString().padStart(2, '0')}` : '未知'}</span>
                        {(song.type || []).map((t: string) => (
                          <span
                            key={t}
                            className={`px-2 py-1 text-xs rounded-full ${typeColorMap[t] || 'bg-gray-500/20 text-gray-300'}`}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 无结果提示 */}
          {filteredSongs.length === 0 && !loading && (
            <div className="text-center py-16">
              <div className="text-gray-400 text-lg mb-2">没有找到匹配的歌曲</div>
              <div className="text-gray-500 text-sm">尝试调整搜索条件或筛选器</div>
            </div>
          )}
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
    </div>
  );
};

export default MusicLibrary;