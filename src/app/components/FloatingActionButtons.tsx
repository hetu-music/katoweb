"use client";

import React from 'react';
import { Share } from 'lucide-react';
import WallpaperControls from './WallpaperControls';

interface FloatingActionButtonsProps {
  // 返回顶部相关
  showScrollTop: boolean;
  onScrollToTop: () => void;
  
  // 分享相关
  onShare: () => void;
  
  // 壁纸相关
  wallpaperEnabled: boolean;
  wallpaperLoading: boolean;
  onWallpaperToggle: () => void;
  onWallpaperRefresh: () => void;
  isHydrated?: boolean;
}

const FloatingActionButtons: React.FC<FloatingActionButtonsProps> = ({
  showScrollTop,
  onScrollToTop,
  onShare,
  wallpaperEnabled,
  wallpaperLoading,
  onWallpaperToggle,
  onWallpaperRefresh,
  isHydrated = true,
}) => {
  return (
    <>
      {/* 壁纸控制按钮 - 右边中间 */}
      <div className="wallpaper-controls-middle">
        <WallpaperControls
          enabled={wallpaperEnabled}
          isLoading={wallpaperLoading}
          onToggle={onWallpaperToggle}
          onRefresh={onWallpaperRefresh}
          isHydrated={isHydrated}
        />
      </div>

      {/* 固定按钮组 - 右下角 */}
      <div className="fixed bottom-8 right-8 z-40 flex flex-col gap-3">
        {/* 返回顶部按钮 - 带动画的显示/隐藏 */}
        <button
          onClick={onScrollToTop}
          className={`p-3 rounded-full bg-gradient-to-br from-purple-700 via-blue-700 to-indigo-700 text-white shadow-lg border border-white/20 backdrop-blur-md hover:scale-110 transition-all duration-300 ${
            showScrollTop
              ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
              : "opacity-0 scale-75 translate-y-2 pointer-events-none"
          }`}
          aria-label="返回顶部"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 15l7-7 7 7"
            />
          </svg>
        </button>

        {/* 分享按钮 - 始终显示 */}
        <button
          onClick={onShare}
          className="p-3 rounded-full bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 text-white shadow-lg border border-white/20 backdrop-blur-md hover:scale-110 transition-all duration-200"
          aria-label="分享页面"
        >
          <Share className="w-6 h-6" />
        </button>
      </div>
    </>
  );
};

export default FloatingActionButtons;