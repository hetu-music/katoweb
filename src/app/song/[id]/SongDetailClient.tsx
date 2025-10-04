"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { SongDetailClientProps } from "../../lib/types";
import { getCoverUrl, calculateSongInfo, getNmnUrl } from "../../lib/utils";
import { typeColorMap, genreColorMap } from "../../lib/constants";
import ImageModal from "../../components/ImageModal";
import WallpaperBackground from "../../components/WallpaperBackground";
import FloatingActionButtons from "../../components/FloatingActionButtons";
import { useWallpaper } from "../../context/WallpaperContext";

const SongDetailClient: React.FC<SongDetailClientProps> = ({ song }) => {
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
  const router = useRouter();

  // 壁纸功能
  const {
    wallpaper,
    isLoading: wallpaperLoading,
    error: wallpaperError,
    refreshWallpaper,
    wallpaperEnabled,
    toggleWallpaper,
    isHydrated,
  } = useWallpaper();

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
        console.log("分享取消或失败");
      }
    } else {
      // 备用方案：复制链接到剪贴板
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert("链接已复制到剪贴板");
      } catch {
        console.log("复制失败");
      }
    }
  }, [song.title, song.artist]);

  // 滚动监听
  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // songInfo 计算逻辑
  const songInfo = useMemo(() => {
    return calculateSongInfo(song);
  }, [song]);

  // 打开图片放大模态框
  const openImageModal = useCallback(
    (src: string, alt: string, title: string) => {
      setImageModal({
        isOpen: true,
        src,
        alt,
        title,
      });
    },
    [],
  );

  // 处理封面图片加载错误
  const handleCoverImageError = useCallback(() => {
    setCoverImageLoaded(false);
  }, []);

  // 处理乐谱图片加载错误
  const handleScoreImageError = useCallback(() => {
    setScoreImageLoaded(false);
  }, []);

  // 关闭图片放大模态框
  const closeImageModal = useCallback(() => {
    setImageModal({
      isOpen: false,
      src: "",
      alt: "",
      title: "",
    });
  }, []);

  // 渲染逻辑
  return (
    <WallpaperBackground>
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        {/* 顶部操作栏 */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={(e) => {
              // 返回主页时带上原有的查询参数
              const search =
                typeof window !== "undefined" ? window.location.search : "";

              if (
                typeof window !== "undefined" &&
                window.matchMedia("(hover: none) and (pointer: coarse)").matches
              ) {
                const target = e.currentTarget;

                // 立即添加按下效果
                target.classList.add("touch-active-pressed");

                // 短暂延迟后开始导航
                setTimeout(() => {
                  target.classList.remove("touch-active-pressed");
                  target.classList.add("touch-navigating");

                  // 立即开始导航，不等待动画完成
                  router.push("/" + search);
                }, 120);
              } else {
                router.push("/" + search);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200 shadow-sm touch-active"
          >
            <ArrowLeft size={18} />
            返回主页面
          </button>
        </div>

        {/* 主信息区 */}
        <div className="flex flex-col md:flex-row gap-8 items-start bg-white/10 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20 mb-8">
          {/* 封面 */}
          <div className="w-full md:w-48 flex-shrink-0 flex justify-center md:justify-start">
            {coverImageLoaded ? (
              <div
                className="cursor-pointer group relative w-48 h-48 rounded-2xl overflow-hidden shadow-lg"
                onClick={() =>
                  openImageModal(
                    getCoverUrl(song),
                    song.album || song.title,
                    `${song.title} - 封面`,
                  )
                }
              >
                <Image
                  src={getCoverUrl(song)}
                  alt={song.album || song.title}
                  width={192}
                  height={192}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  style={{ objectFit: "cover" }}
                  priority
                  onError={handleCoverImageError}
                />
                {/* 悬停提示 */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-full">
                    点击放大
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-48 px-4 py-6 rounded-2xl bg-gray-800/50 border border-gray-600/30 shadow-lg">
                <div className="text-gray-300 text-sm text-center">
                  封面暂时无法加载
                </div>
              </div>
            )}
          </div>

          {/* 歌曲主信息 */}
          <div className="flex-1 text-white space-y-4 w-full">
            <div>
              <h1 className="text-3xl font-bold mb-3 break-words">
                {song.title}
              </h1>
              <div className="flex flex-wrap gap-2">
                {(song.genre || []).map((g: string) => (
                  <span
                    key={g}
                    className={`px-3 py-1 text-xs rounded-full border ${genreColorMap[g] || "bg-blue-500/20 text-blue-300 border-blue-400/30"}`}
                  >
                    {g}
                  </span>
                ))}
                {(song.type && song.type.length > 0 ? song.type : ["原创"]).map(
                  (t: string) => (
                    <span
                      key={t}
                      className={`px-3 py-1 text-xs rounded-full border ${typeColorMap[t] || "bg-gray-500/20 text-gray-300 border-gray-400/30"}`}
                    >
                      {t}
                    </span>
                  ),
                )}
              </div>
            </div>

            {/* 创作信息 */}
            <div>
              <h3 className="block-panel-title mb-3">创作信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 block-panel-inner">
                {songInfo?.creativeInfo.map((item, index) => (
                  <div key={index} className="flex items-start">
                    <span className="font-semibold text-blue-300 text-base min-w-[4rem]">
                      {item.label}：
                    </span>
                    <span className="text-white/90 break-words text-base">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 基本信息 */}
            <div>
              <h3 className="block-panel-title mb-3">基本信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 block-panel-inner">
                {songInfo?.basicInfo.map((item, index) => (
                  <div key={index} className="flex items-start">
                    <span className="font-semibold text-blue-300 text-base min-w-[6rem]">
                      {item.label}：
                    </span>
                    <span className="text-white/90 break-words text-base">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 备注区块 */}
        <div className="block-panel mb-8">
          <h3 className="block-panel-title mb-3">备注</h3>
          <div className="whitespace-pre-line leading-relaxed">
            {song.comment ? (
              <div className="block-panel-inner">{song.comment}</div>
            ) : (
              <div className="text-gray-400 italic text-center py-4">
                暂无备注
              </div>
            )}
          </div>
        </div>

        {/* 音乐平台链接区块 */}
        {(song.kugolink || song.qmlink || song.nelink) && (
          <div className="block-panel mb-8">
            <h3 className="block-panel-title mb-3">收听平台</h3>
            <div className="block-panel-inner mb-2 text-center">
              <div className="flex flex-row flex-wrap sm:flex-row items-center justify-center gap-3 sm:gap-6">
                {song.kugolink && (
                  <a
                    href={song.kugolink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-[120px] flex justify-center items-center px-6 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-white/20 text-white font-semibold shadow-sm hover:from-blue-500/30 hover:to-purple-500/30 transition-all duration-200"
                  >
                    酷狗音乐
                  </a>
                )}
                {song.nelink && (
                  <a
                    href={song.nelink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-[120px] flex justify-center items-center px-6 py-2 rounded-full bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur-sm border border-white/20 text-white font-semibold shadow-sm hover:from-red-500/30 hover:to-pink-500/30 transition-all duration-200"
                  >
                    网易云音乐
                  </a>
                )}
                {song.qmlink && (
                  <a
                    href={song.qmlink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-[120px] flex justify-center items-center px-6 py-2 rounded-full bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-sm border border-white/20 text-white font-semibold shadow-sm hover:from-green-500/30 hover:to-blue-500/30 transition-all duration-200"
                  >
                    QQ音乐
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 歌词区块 */}
        <div className="block-panel mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="block-panel-title mb-0">歌词</h3>
            {/* 歌词类型切换胶囊 */}
            <div className="flex bg-white/10 rounded-full p-1 border border-white/20">
              <button
                onClick={() => setLyricsType("normal")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${lyricsType === "normal"
                  ? "bg-white/20 text-white shadow-sm"
                  : "text-white/70 hover:text-white/90"
                  }`}
              >
                普通歌词
              </button>
              <button
                onClick={() => setLyricsType("lrc")}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${lyricsType === "lrc"
                  ? "bg-white/20 text-white shadow-sm"
                  : "text-white/70 hover:text-white/90"
                  }`}
              >
                LRC歌词
              </button>
            </div>
          </div>

          <div className="whitespace-pre-line leading-relaxed">
            {song.lyrics ? (
              <div className="block-panel-inner">
                <div
                  className={`${lyricsType === "normal" ? "text-center" : "text-left"}`}
                >
                  {lyricsType === "normal"
                    ? song.normalLyrics || "暂无歌词"
                    : song.lyrics}
                </div>
              </div>
            ) : (
              <div className="text-gray-400 italic text-center py-8">
                暂无歌词
              </div>
            )}
          </div>
        </div>

        {/* 乐谱区块 */}
        {song.nmn_status === true && (
          <div className="block-panel">
            <h3 className="block-panel-title mb-3">乐谱</h3>
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 max-w-4xl mx-auto">
              {scoreImageLoaded ? (
                <div
                  className="cursor-pointer group relative rounded-lg overflow-hidden"
                  onClick={() =>
                    openImageModal(
                      getNmnUrl(song),
                      `${song.title} - 乐谱`,
                      `${song.title} - 乐谱`,
                    )
                  }
                >
                  <Image
                    src={getNmnUrl(song)}
                    alt={`${song.title} - 乐谱`}
                    width={800}
                    height={600}
                    className="w-full h-auto bg-white transition-transform duration-200 group-hover:scale-[1.02]"
                    style={{ objectFit: "contain" }}
                    onError={handleScoreImageError}
                  />
                  {/* 悬停提示 */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-full">
                      点击放大
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-gray-400 italic text-center py-8">
                  乐谱暂时无法加载
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 浮动操作按钮组 */}
      <FloatingActionButtons
        showScrollTop={showScrollTop}
        onScrollToTop={scrollToTop}
        onShare={handleShare}
        wallpaperEnabled={wallpaperEnabled}
        wallpaperLoading={wallpaperLoading}
        onWallpaperToggle={toggleWallpaper}
        onWallpaperRefresh={refreshWallpaper}
        isHydrated={isHydrated}
      />

      {/* 图片放大模态框 */}
      <ImageModal
        isOpen={imageModal.isOpen}
        onClose={closeImageModal}
        src={imageModal.src}
        alt={imageModal.alt}
        title={imageModal.title}
      />
    </WallpaperBackground>
  );
};

export default SongDetailClient;
