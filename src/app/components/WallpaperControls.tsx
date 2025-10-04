"use client";

import React from 'react';
import { RefreshCw, Image, ImageOff } from 'lucide-react';

interface WallpaperControlsProps {
  enabled: boolean;
  isLoading: boolean;
  onToggle: () => void;
  onRefresh: () => void;
  isHydrated?: boolean;
}

const WallpaperControls: React.FC<WallpaperControlsProps> = ({
  enabled,
  isLoading,
  onToggle,
  onRefresh,
  isHydrated = true,
}) => {
  // 在 hydration 完成之前不渲染，避免 hydration 错误
  if (!isHydrated) {
    return null;
  }

  return (
    <div className="wallpaper-controls">
      {/* 壁纸开关按钮 - 固定位置 */}
      <button
        onClick={onToggle}
        className={`wallpaper-control-button ${
          enabled
            ? 'bg-gradient-to-br from-cyan-600 via-sky-600 to-blue-600 text-white'
            : 'bg-gradient-to-br from-purple-500/30 via-blue-500/30 to-indigo-500/30 text-white/70 border-white/30 backdrop-blur-md'
        }`}
        aria-label={enabled ? "关闭壁纸" : "开启壁纸"}
        title={enabled ? "关闭壁纸" : "开启壁纸"}
      >
        {enabled ? <Image className="w-6 h-6" /> : <ImageOff className="w-6 h-6" />}
      </button>

      {/* 刷新壁纸按钮 - 带动画的显示/隐藏 */}
      <button
        onClick={onRefresh}
        disabled={isLoading || !enabled}
        className={`wallpaper-control-button bg-gradient-to-br from-rose-600 via-pink-600 to-fuchsia-600 text-white transition-all duration-300 ${
          enabled
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-75 translate-y-2 pointer-events-none'
        } ${
          isLoading ? 'opacity-60 cursor-not-allowed' : ''
        }`}
        aria-label="刷新壁纸"
        title="刷新壁纸"
      >
        <RefreshCw className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
};

export default WallpaperControls;