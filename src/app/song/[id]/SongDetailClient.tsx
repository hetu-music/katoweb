"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import { SongDetailClientProps } from '../../lib/types';
import { getCoverUrl, typeColorMap, genreColorMap, calculateSongInfo } from '../../lib/utils';

const SongDetailClient: React.FC<SongDetailClientProps> = ({ song }) => {
  // 移除加载和错误状态，因为数据已经在服务端获取
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [lyricsExpanded, setLyricsExpanded] = useState(true);
  const router = useRouter();

  // scrollToTop 函数
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // 滚动监听
  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // songInfo 计算逻辑
  const songInfo = useMemo(() => {
    return calculateSongInfo(song);
  }, [song]);

  // 渲染逻辑
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        {/* 顶部操作栏 */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => {
              // 返回主页时带上原有的查询参数
              const search = typeof window !== 'undefined' ? window.location.search : '';
              router.push('/' + search);
            }}
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
              src={getCoverUrl(song)}
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
                  <span key={g} className={`px-3 py-1 text-xs rounded-full border ${genreColorMap[g] || 'bg-blue-500/20 text-blue-300 border-blue-400/30'}`}>
                    {g}
                  </span>
                ))}
                {(song.type && song.type.length > 0 ? song.type : ['原创']).map((t: string) => (
                  <span
                    key={t}
                    className={`px-3 py-1 text-xs rounded-full border ${typeColorMap[t] || 'bg-gray-500/20 text-gray-300 border-gray-400/30'}`}
                  >
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
                  <div key={index} className="flex items-start">
                    <span className="font-semibold text-blue-300 text-base min-w-[4rem]">{item.label}：</span>
                    <span className="text-white/90 break-words text-base">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 基本信息 */}
            <div>
              <h3 className="font-semibold text-lg text-white/90 mb-3">基本信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                {songInfo?.basicInfo.map((item, index) => (
                  <div key={index} className="flex items-start">
                    <span className="font-semibold text-blue-300 text-base min-w-[6rem]">{item.label}：</span>
                    <span className="text-white/90 break-words text-base">{item.value}</span>
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

      {/* 返回顶部按钮  */}
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

export default SongDetailClient;