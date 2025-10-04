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
      {/* 壁纸开关按钮 */}
      <button
        onClick={onToggle}
        className={`wallpaper-control-button ${
          enabled
            ? 'bg-gradient-to-br from-cyan-600 via-sky-600 to-blue-600 text-white'
            : 'bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 text-gray-300'
        }`}
        aria-label={enabled ? "关闭壁纸" : "开启壁纸"}
        title={enabled ? "关闭壁纸" : "开启壁纸"}
      >
        {enabled ? <Image className="w-6 h-6" /> : <ImageOff className="w-6 h-6" />}
      </button>

      {/* 刷新壁纸按钮 - 仅在启用时显示 */}
      {enabled && (
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className={`wallpaper-control-button bg-gradient-to-br from-rose-600 via-pink-600 to-fuchsia-600 text-white ${
            isLoading ? 'opacity-60 cursor-not-allowed' : ''
          }`}
          aria-label="刷新壁纸"
          title="刷新壁纸"
        >
          <RefreshCw className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      )}
    </div>
  );
};

export default WallpaperControls;