"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { flushSync } from "react-dom";
import { ArrowLeft, Moon, Sun, Share2, Music, FileText, Info, Download, Disc, User, Mic2, PenTool, LayoutTemplate, ExternalLink } from "lucide-react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { SongDetailClientProps } from "@/lib/types";
import { getCoverUrl, calculateSongInfo, getNmnUrl } from "@/lib/utils";
import { getTypeTagStyle, getGenreTagStyle } from "@/lib/constants";
import ImageModal from "@/components/public/ImageModal";
import FloatingActionButtons from "@/components/public/FloatingActionButtons";

// 简易 classNames 工具
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

const SongDetailClient: React.FC<SongDetailClientProps> = ({ song }) => {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [showScrollTop, setShowScrollTop] = useState(false);
  const [lyricsType, setLyricsType] = useState<"normal" | "lrc">("normal");
  const [imageModal, setImageModal] = useState<{
    isOpen: boolean;
    src: string;
    alt: string;
    title: string;
  }>({
    isOpen: false,
    src: "",
    alt: "",
    title: "",
  });
  const [coverImageLoaded, setCoverImageLoaded] = useState(true);
  const [scoreImageLoaded, setScoreImageLoaded] = useState(true);
  const [animationReady, setAnimationReady] = useState(false);

  // songInfo 计算逻辑
  const songInfo = useMemo(() => {
    return calculateSongInfo(song);
  }, [song]);

  // 在组件挂载后立即启动动画
  useEffect(() => {
    // 使用 requestAnimationFrame 确保在下一帧启动动画
    requestAnimationFrame(() => {
      setAnimationReady(true);
    });
  }, []);

  // 滚动监听
  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 切换主题动画
  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    // @ts-ignore
    if (!document.startViewTransition) {
      setTheme(theme === 'dark' ? 'light' : 'dark');
      return;
    }

    const x = e.clientX;
    const y = e.clientY;
    const endRadius = Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y)
    );

    document.documentElement.classList.add('no-transitions');

    // @ts-ignore
    const transition = document.startViewTransition(() => {
      flushSync(() => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
      });
    });

    transition.finished.then(() => {
      document.documentElement.classList.remove('no-transitions');
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];

      document.documentElement.animate(
        {
          clipPath: clipPath,
        },
        {
          duration: 500,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
  };

  // scrollToTop 函数
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // 分享歌曲
  const handleShare = useCallback(async () => {
    const shareData = {
      title: `${song.title} - 歌曲详情`,
      text: `来听听河图的这首歌：${song.title}${song.artist ? ` - ${song.artist}` : ""}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        console.warn("分享取消或失败");
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert("链接已复制到剪贴板");
      } catch {
        console.warn("复制失败");
      }
    }
  }, [song.title, song.artist]);

  // 打开/关闭图片模态框
  const openImageModal = useCallback((src: string, alt: string, title: string) => {
    setImageModal({ isOpen: true, src, alt, title });
  }, []);

  const closeImageModal = useCallback(() => {
    setImageModal({ isOpen: false, src: "", alt: "", title: "" });
  }, []);

  const handleCoverImageError = useCallback(() => setCoverImageLoaded(false), []);
  const handleScoreImageError = useCallback(() => setScoreImageLoaded(false), []);

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0B0F19] transition-colors duration-500 font-sans">

      {/* 顶部导航 - 与 MusicLibraryClient 保持一致 */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#FAFAFA]/80 dark:bg-[#0B0F19]/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400 group"
              title="返回"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="text-xl font-serif font-bold text-slate-900 dark:text-white tracking-tight hidden sm:block">
              {song.title}
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
          >
            {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
      </nav>

      <main className="pt-32 pb-20 max-w-7xl mx-auto px-6">

        {/* 主要内容网格 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

          {/* 左侧：封面与元信息 (Col-4) */}
          <div className={cn(
            "lg:col-span-4 space-y-8 lg:sticky lg:top-32 transition-all",
            animationReady
              ? "animate-in fade-in slide-in-from-bottom-8 duration-700"
              : "opacity-0"
          )}>
            {/* 封面卡片 */}
            <div
              className="group relative aspect-square w-full rounded-2xl overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-black/40 ring-1 ring-slate-900/5 dark:ring-white/10 cursor-pointer"
              onClick={() => coverImageLoaded && openImageModal(getCoverUrl(song), song.album || song.title, `${song.title} - 封面`)}
            >
              {coverImageLoaded ? (
                <>
                  <Image
                    src={getCoverUrl(song)}
                    alt={song.title}
                    width={500}
                    height={500}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    priority
                    onError={handleCoverImageError}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="text-white text-sm font-medium bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                      查看封面
                    </span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400">
                  <Disc size={48} className="mb-2 opacity-50" />
                  <span className="text-sm">暂无封面</span>
                </div>
              )}
            </div>

            {/* 标签云 */}
            <div className="flex flex-wrap gap-2">
              {(song.type && song.type.length > 0 ? song.type : ["原创"]).map((t) => (
                <span
                  key={t}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-full border tracking-wide uppercase",
                    getTypeTagStyle(t)
                  )}
                >
                  {t}
                </span>
              ))}
              {(song.genre || []).map((g) => (
                <span
                  key={g}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-full border",
                    getGenreTagStyle(g)
                  )}
                >
                  {g}
                </span>
              ))}
            </div>

            {/* 外部链接 */}
            {(song.kugolink || song.qmlink || song.nelink) && (
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Listen On</h3>
                <div className="grid grid-cols-1 gap-2">
                  {song.nelink && (
                    <a href={song.nelink} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-between px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-red-500/50 hover:shadow-sm transition-all group">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-red-500">网易云音乐</span>
                      <ExternalLink size={14} className="text-slate-400 group-hover:text-red-400" />
                    </a>
                  )}
                  {song.qmlink && (
                    <a href={song.qmlink} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-between px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-green-500/50 hover:shadow-sm transition-all group">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-green-500">QQ音乐</span>
                      <ExternalLink size={14} className="text-slate-400 group-hover:text-green-400" />
                    </a>
                  )}
                  {song.kugolink && (
                    <a href={song.kugolink} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-between px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500/50 hover:shadow-sm transition-all group">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-blue-500">酷狗音乐</span>
                      <ExternalLink size={14} className="text-slate-400 group-hover:text-blue-400" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 右侧：详细内容 (Col-8) */}
          <div className={cn(
            "lg:col-span-8 space-y-12 transition-all",
            animationReady
              ? "animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100"
              : "opacity-0"
          )}>

            {/* 标题 & 基础信息 */}
            <section className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-slate-900 dark:text-slate-50 leading-tight">
                {song.title}
              </h1>

              {/* 信息卡片网格 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-2 mb-4 text-blue-600 dark:text-blue-400">
                    <User size={18} />
                    <h3 className="text-sm font-bold uppercase tracking-wider">Creative Info</h3>
                  </div>
                  <div className="space-y-3">
                    {songInfo?.creativeInfo.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm border-b border-slate-50 dark:border-slate-800/50 last:border-0 pb-2 last:pb-0">
                        <span className="text-slate-500 dark:text-slate-400">{item.label}</span>
                        <span className="font-medium text-slate-900 dark:text-slate-200 text-right">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-2 mb-4 text-purple-600 dark:text-purple-400">
                    <Info size={18} />
                    <h3 className="text-sm font-bold uppercase tracking-wider">Basic Info</h3>
                  </div>
                  <div className="space-y-3">
                    {songInfo?.basicInfo.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm border-b border-slate-50 dark:border-slate-800/50 last:border-0 pb-2 last:pb-0">
                        <span className="text-slate-500 dark:text-slate-400">{item.label}</span>
                        <span className="font-medium text-slate-900 dark:text-slate-200 text-right">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 备注 */}
              {song.comment && (
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-3 text-slate-400">
                    <PenTool size={16} />
                    <h3 className="text-xs font-bold uppercase tracking-wider">Remarks</h3>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm whitespace-pre-line">
                    {song.comment}
                  </p>
                </div>
              )}
            </section>

            {/* 歌词部分 */}
            <section className="border-t border-slate-200 dark:border-slate-800 pt-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <Mic2 size={24} />
                  <h2 className="text-2xl font-serif font-bold">Lyrics</h2>
                </div>

                {/* 歌词切换 */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                  <button
                    onClick={() => setLyricsType("normal")}
                    className={cn(
                      "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                      lyricsType === "normal"
                        ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                  >
                    普通
                  </button>
                  <button
                    onClick={() => setLyricsType("lrc")}
                    className={cn(
                      "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                      lyricsType === "lrc"
                        ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    )}
                  >
                    LRC
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900/50 rounded-3xl p-8 md:p-12 border border-slate-100 dark:border-slate-800 shadow-sm min-h-[400px]">
                {song.lyrics ? (
                  <div className={cn(
                    "whitespace-pre-line leading-loose text-lg text-slate-700 dark:text-slate-300 font-light",
                    lyricsType === "normal" ? "text-center" : "text-left font-mono text-base"
                  )}>
                    {lyricsType === "normal" ? (song.normalLyrics || song.lyrics) : song.lyrics}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-50">
                    <FileText size={48} className="mb-4" />
                    <p>暂无歌词</p>
                  </div>
                )}
              </div>
            </section>

            {/* 乐谱部分 */}
            {song.nmn_status && (
              <section className="border-t border-slate-200 dark:border-slate-800 pt-10 pb-10">
                <div className="flex items-center gap-2 mb-8 text-slate-900 dark:text-white">
                  <LayoutTemplate size={24} />
                  <h2 className="text-2xl font-serif font-bold">Score</h2>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 overflow-hidden">
                  {scoreImageLoaded ? (
                    <div
                      className="relative group cursor-pointer rounded-lg overflow-hidden"
                      onClick={() => openImageModal(getNmnUrl(song), `${song.title} - 乐谱`, "乐谱")}
                    >
                      <Image
                        src={getNmnUrl(song)}
                        alt="Score"
                        width={800}
                        height={600}
                        className="w-full h-auto"
                        onError={handleScoreImageError}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="bg-white/90 text-slate-900 px-4 py-2 rounded-full shadow-lg font-medium text-sm">点击放大</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <p>乐谱加载失败</p>
                    </div>
                  )}
                </div>
              </section>
            )}

          </div>
        </div>
      </main>

      <FloatingActionButtons
        showScrollTop={showScrollTop}
        onScrollToTop={scrollToTop}
        onShare={handleShare}
      />

      <ImageModal
        isOpen={imageModal.isOpen}
        onClose={closeImageModal}
        src={imageModal.src}
        alt={imageModal.alt}
        title={imageModal.title}
      />
    </div>
  );
};

export default SongDetailClient;
