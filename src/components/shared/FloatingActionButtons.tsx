"use client";

import IOSInstallPrompt from "@/components/pwa/IOSInstallPrompt";
import { usePWAInstall } from "@/components/pwa/PWARegistration";
import { usePlayerStore } from "@/store/player-store";
import { cn } from "@/lib/utils/utils";
import {
  ArrowUp,
  ArrowDown,
  Disc3,
  Download,
  Plus,
  Share2,
} from "lucide-react";
import React, { useState } from "react";

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
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 播放器开关
  const { currentTrack, isPlaying, playerVisible, setPlayerVisible } =
    usePlayerStore();
  const hasPlayer = !!currentTrack;

  const showInstallButton = isInstallable || (isIOS && !isStandalone);
  const hasSecondaryActions =
    Boolean(children) || showInstallButton || Boolean(onShare);

  const handleInstallClick = () => {
    if (isIOS) setShowIOSPrompt(true);
    else install();
    setIsMenuOpen(false);
  };

  const handleShareClick = () => {
    onShare?.();
    setIsMenuOpen(false);
  };

  const buttonClass =
    "p-3 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 shadow-lg shadow-slate-200/50 dark:shadow-black/50 ring-1 ring-slate-900/5 dark:ring-white/10 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center";

  return (
    <>
      <IOSInstallPrompt
        isOpen={showIOSPrompt}
        onClose={() => setShowIOSPrompt(false)}
      />

      <div
        className={cn(
          "fixed right-6 z-50 flex flex-col gap-3 items-center transition-all duration-300",
          hasPlayer ? "bottom-[112px] sm:bottom-8" : "bottom-8",
          className,
        )}
      >
        {/* 1. 二级菜单 (移到最顶部：当点击展开时，向上弹出的子菜单会飘入空旷区域，绝不遮挡其他按钮) */}
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

            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
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

        {/* 2. 播放器开关按钮：有播放曲目时显示 (放在中间) */}
        {hasPlayer && (
          <button
            onClick={() => setPlayerVisible(!playerVisible)}
            className={cn(
              buttonClass,
              playerVisible &&
                "bg-blue-500 dark:bg-blue-500 text-white dark:text-white hover:bg-blue-600 dark:hover:bg-blue-600 ring-blue-500/30",
            )}
            title={playerVisible ? "收起播放器" : "展开播放器"}
            aria-label={playerVisible ? "收起播放器" : "展开播放器"}
          >
            <Disc3
              size={20}
              className={cn(
                "transition-transform",
                isPlaying && "animate-spin animation-duration-[3s]",
              )}
            />
          </button>
        )}

        {/* 3. 返回顶部 / 一键到底 */}
        <div className="relative w-11 h-11 shrink-0">
          {/* 返回顶部 */}
          <button
            onClick={onScrollToTop}
            className={cn(
              buttonClass,
              "absolute inset-0 transition-all duration-300 transform",
              showScrollTop
                ? "scale-100 opacity-100 rotate-0"
                : "scale-50 opacity-0 pointer-events-none rotate-90",
            )}
            title="返回顶部"
            aria-label="返回顶部"
          >
            <ArrowUp size={20} />
          </button>

          {/* 一键到底 */}
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                window.scrollTo({
                  top: document.documentElement.scrollHeight,
                  behavior: "smooth",
                });
              }
            }}
            className={cn(
              buttonClass,
              "absolute inset-0 transition-all duration-300 transform",
              !showScrollTop
                ? "scale-100 opacity-100 rotate-0"
                : "scale-50 opacity-0 pointer-events-none -rotate-90",
            )}
            title="一键到底"
            aria-label="一键到底"
          >
            <ArrowDown size={20} />
          </button>
        </div>
      </div>
    </>
  );
};

export default FloatingActionButtons;
