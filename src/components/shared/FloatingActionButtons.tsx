"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Download,
  ListMusic,
  Loader2,
  Music,
  Pause,
  Play,
  Plus,
  Share2,
  SkipBack,
  SkipForward,
  Trash2,
  X,
} from "lucide-react";
import { usePWAInstall } from "@/components/pwa/PWARegistration";
import IOSInstallPrompt from "@/components/pwa/IOSInstallPrompt";
import { cn } from "@/lib/utils";
import { usePlayer } from "@/context/PlayerContext";

interface FloatingActionButtonsProps {
  showScrollTop: boolean;
  onScrollToTop: () => void;
  onShare?: () => void;
  className?: string;
  children?: React.ReactNode;
}

const FloatingActionButtons: React.FC<FloatingActionButtonsProps> = ({
  showScrollTop,
  onScrollToTop,
  onShare,
  className,
  children,
}) => {
  const { isInstallable, install, isIOS, isStandalone } = usePWAInstall();
  const [showIOSPrompt, setShowIOSPrompt] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showQueue, setShowQueue] = useState(false);

  // 播放器状态
  const { state, controls } = usePlayer();
  const {
    currentTrack,
    queue,
    currentIndex,
    isPlaying,
    isLoading,
  } = state;
  const hasPlayer = !!currentTrack;

  const showInstallButton = isInstallable || (isIOS && !isStandalone);
  const hasSecondaryActions =
    Boolean(children) || showInstallButton || Boolean(onShare) || hasPlayer;

  const handleInstallClick = () => {
    if (isIOS) {
      setShowIOSPrompt(true);
    } else {
      install();
    }
    setIsMenuOpen(false);
  };

  const handleShareClick = () => {
    onShare?.();
    setIsMenuOpen(false);
  };

  // 关闭菜单时同时关闭播放列表
  const handleMenuToggle = () => {
    setIsMenuOpen((prev) => {
      if (prev) setShowQueue(false);
      return !prev;
    });
  };

  // 点击外部关闭播放列表
  const queuePanelRef = useRef<HTMLDivElement>(null);
  const fabContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showQueue) return;
    const handler = (e: MouseEvent) => {
      if (
        queuePanelRef.current &&
        !queuePanelRef.current.contains(e.target as Node) &&
        fabContainerRef.current &&
        !fabContainerRef.current.contains(e.target as Node)
      ) {
        setShowQueue(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showQueue]);

  const buttonClass =
    "p-3 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 shadow-lg shadow-slate-200/50 dark:shadow-black/50 ring-1 ring-slate-900/5 dark:ring-white/10 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center";

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < queue.length - 1;

  return (
    <>
      <IOSInstallPrompt
        isOpen={showIOSPrompt}
        onClose={() => setShowIOSPrompt(false)}
      />

      {/* 播放列表面板：紧贴 FAB 容器左侧弹出 */}
      {showQueue && hasPlayer && (
        <div
          ref={queuePanelRef}
          className={cn(
            "fixed z-[60] w-72",
            "bottom-8 right-24",
            "animate-in slide-in-from-right-4 fade-in duration-200",
          )}
        >
          <div
            className={cn(
              "rounded-2xl overflow-hidden",
              "bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl",
              "border border-slate-200/60 dark:border-slate-700/50",
              "shadow-2xl shadow-slate-300/30 dark:shadow-black/50",
            )}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ListMusic size={15} className="text-blue-500" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  播放列表
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {queue.length} 首
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => controls.clearQueue()}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-500 transition-colors px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10"
                >
                  <Trash2 size={12} />
                  清空
                </button>
                <button
                  onClick={() => setShowQueue(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto overscroll-contain">
              {queue.map((track, i) => (
                <div
                  key={`${track.songId}-${i}`}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors group",
                    i === currentIndex
                      ? "bg-blue-50 dark:bg-blue-500/10"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                  )}
                  onClick={() => controls.jumpTo(i)}
                >
                  <div className="w-5 shrink-0 flex items-center justify-center">
                    {i === currentIndex ? (
                      isPlaying ? (
                        <span className="flex gap-0.5 items-end h-3">
                          <span
                            className="w-0.5 bg-blue-500 rounded-full"
                            style={{
                              height: "60%",
                              animation: "fabBounce 0.8s ease-in-out infinite",
                            }}
                          />
                          <span
                            className="w-0.5 bg-blue-500 rounded-full"
                            style={{
                              height: "100%",
                              animation:
                                "fabBounce 0.8s ease-in-out 0.2s infinite",
                            }}
                          />
                          <span
                            className="w-0.5 bg-blue-500 rounded-full"
                            style={{
                              height: "40%",
                              animation:
                                "fabBounce 0.8s ease-in-out 0.4s infinite",
                            }}
                          />
                        </span>
                      ) : (
                        <Music size={12} className="text-blue-500" />
                      )
                    ) : (
                      <>
                        <span className="text-[11px] text-slate-400 group-hover:hidden">
                          {i + 1}
                        </span>
                        <Play
                          size={11}
                          className="text-slate-400 hidden group-hover:block fill-current"
                        />
                      </>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm truncate",
                        i === currentIndex
                          ? "font-bold text-blue-600 dark:text-blue-400"
                          : "font-medium text-slate-700 dark:text-slate-200",
                      )}
                    >
                      {track.title}
                    </p>
                    {track.artist && (
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {track.artist}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      controls.removeFromQueue(i);
                    }}
                    className="shrink-0 p-1 rounded-md text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FAB 容器 */}
      <div
        ref={fabContainerRef}
        className={cn(
          "fixed bottom-8 right-8 z-50 flex flex-col gap-3 items-center",
          className,
        )}
      >
        {/* 二级菜单展开项 */}
        {hasSecondaryActions && (
          <div className="relative flex flex-col items-center gap-3">
            <div
              className={cn(
                "flex flex-col gap-3 absolute bottom-full mb-3 transition-all duration-300 origin-bottom right-0 items-center overflow-visible",
                isMenuOpen
                  ? "scale-100 opacity-100 pointer-events-auto translate-y-0"
                  : "scale-50 opacity-0 pointer-events-none translate-y-8",
              )}
            >
              {/* 播放控制组（有播放曲目时显示） */}
              {hasPlayer && (
                <div className="flex flex-col items-center gap-3">
                  {/* 播放列表按钮 */}
                  <button
                    onClick={() => setShowQueue((v) => !v)}
                    className={cn(
                      buttonClass,
                      showQueue &&
                        "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
                    )}
                    title="播放列表"
                    aria-label="播放列表"
                  >
                    <ListMusic size={20} />
                  </button>

                  {/* 上一首 */}
                  <button
                    onClick={controls.prev}
                    disabled={!hasPrev}
                    className={cn(
                      buttonClass,
                      !hasPrev && "opacity-40 cursor-not-allowed",
                    )}
                    title="上一首"
                    aria-label="上一首"
                  >
                    <SkipBack size={20} className="fill-current" />
                  </button>

                  {/* 播放/暂停 */}
                  <button
                    onClick={controls.toggle}
                    disabled={isLoading}
                    className={cn(
                      buttonClass,
                      isLoading && "opacity-60 cursor-not-allowed",
                    )}
                    title={isPlaying ? "暂停" : "播放"}
                    aria-label={isPlaying ? "暂停" : "播放"}
                  >
                    {isLoading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : isPlaying ? (
                      <Pause size={20} className="fill-current" />
                    ) : (
                      <Play size={20} className="fill-current translate-x-0.5" />
                    )}
                  </button>

                  {/* 下一首 */}
                  <button
                    onClick={controls.next}
                    disabled={!hasNext}
                    className={cn(
                      buttonClass,
                      !hasNext && "opacity-40 cursor-not-allowed",
                    )}
                    title="下一首"
                    aria-label="下一首"
                  >
                    <SkipForward size={20} className="fill-current" />
                  </button>
                </div>
              )}

              {/* 其他子按钮（收藏等） */}
              {children}

              {showInstallButton && (
                <button
                  onClick={handleInstallClick}
                  className={buttonClass}
                  title="安装为PWA应用"
                  aria-label="安装为PWA应用"
                >
                  <Download size={20} />
                </button>
              )}

              {onShare && (
                <button
                  onClick={handleShareClick}
                  className={buttonClass}
                  title="分享"
                  aria-label="分享"
                >
                  <Share2 size={20} />
                </button>
              )}
            </div>

            {/* 菜单触发按钮 */}
            <button
              onClick={handleMenuToggle}
              className={buttonClass}
              title="更多操作"
              aria-label="更多操作"
            >
              <Plus
                size={20}
                className={cn(
                  "transition-transform duration-300",
                  isMenuOpen && "rotate-45",
                )}
              />
            </button>
          </div>
        )}

        {/* 返回顶部按钮 */}
        <button
          onClick={onScrollToTop}
          className={cn(
            buttonClass,
            showScrollTop
              ? "translate-y-0 opacity-100"
              : "translate-y-8 opacity-0 pointer-events-none",
          )}
          title="返回顶部"
          aria-label="返回顶部"
        >
          <ArrowUp size={20} />
        </button>
      </div>

      <style>{`
        @keyframes fabBounce {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
      `}</style>
    </>
  );
};

export default FloatingActionButtons;
