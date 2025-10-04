"use client";

import React from 'react';
import { Image as ImageIcon, RefreshCw, Eye, EyeOff } from 'lucide-react';

interface WallpaperControlsProps {
  enabled: boolean;
  isLoading: boolean;
  onToggle: () => void;
  onRefresh: () => void;
  wallpaperInfo?: {
    title: string;
    copyright: string;
    source: string;
  } | null;
}

const WallpaperControls: React.FC<WallpaperControlsProps> = ({
  enabled,
  isLoading,
  onToggle,
  onRefresh,
  wallpaperInfo,
}) => {
  return (
    <div className="wallpaper-controls">
      {/* 壁纸开关按钮 */}
      <button
        onClick={onToggle}
        className={`wallpaper-control-button ${
          enabled
            ? 'bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 text-white'
            : 'bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 text-gray-300'
        }`}
        aria-label={enabled ? "关闭壁纸" : "开启壁纸"}
        title={enabled ? "关闭壁纸" : "开启壁纸"}
      >
        {enabled ? <Eye className="w-6 h-6" /> : <EyeOff className="w-6 h-6" />}
      </button>

      {/* 刷新壁纸按钮 - 仅在启用时显示 */}
      {enabled && (
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className={`wallpaper-control-button bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-600 text-white ${
            isLoading ? 'opacity-60 cursor-not-allowed' : ''
          }`}
          aria-label="刷新壁纸"
          title="刷新壁纸"
        >
          <RefreshCw className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      )}

      {/* 壁纸信息按钮 - 仅在有壁纸信息时显示 */}
      {enabled && wallpaperInfo && (
        <button
          className="wallpaper-control-button bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white group relative"
          aria-label="壁纸信息"
          title={`${wallpaperInfo.title}\n${wallpaperInfo.copyright}`}
        >
          <ImageIcon className="w-6 h-6" />
          
          {/* 悬停显示的信息卡片 */}
          <div className="wallpaper-info-tooltip">
            <div className="wallpaper-info-card">
              <div className="font-medium mb-1">{wallpaperInfo.title}</div>
              <div className="text-gray-300 text-xs">{wallpaperInfo.copyright}</div>
              <div className="text-gray-400 text-xs mt-1">来源: {wallpaperInfo.source === 'bing' ? 'Bing' : 'Lorem Picsum'}</div>
            </div>
          </div>
        </button>
      )}
    </div>
  );
};

export default WallpaperControls;