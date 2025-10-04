"use client";

import React from 'react';
import Image from 'next/image';

interface WallpaperBackgroundProps {
  wallpaperUrl: string | null;
  enabled: boolean;
  children: React.ReactNode;
}

const WallpaperBackground: React.FC<WallpaperBackgroundProps> = ({
  wallpaperUrl,
  enabled,
  children,
}) => {
  return (
    <div className="relative min-h-screen">
      {/* 壁纸背景 - 仅在启用且有壁纸时显示 */}
      {enabled && wallpaperUrl && (
        <div className="fixed inset-0 z-0">
          <Image
            src={wallpaperUrl}
            alt="背景壁纸"
            fill
            className="wallpaper-image"
            style={{ objectFit: 'cover' }}
            priority
            quality={95}
            unoptimized={false}
          />
          {/* 轻微的深色遮罩层，确保内容可读性 */}
          <div className="wallpaper-overlay" />
        </div>
      )}

      {/* 渐变背景 - 作为备用背景或在未启用壁纸时显示 */}
      {(!enabled || !wallpaperUrl) && (
        <div className="fixed inset-0 z-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900" />
      )}

      {/* 内容区域 */}
      <div className="relative z-10 min-h-screen">
        {children}
      </div>
    </div>
  );
};

export default WallpaperBackground;