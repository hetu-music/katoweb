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
    <div className="relative min-h-screen wallpaper-background">
      {/* 壁纸背景 */}
      {enabled && wallpaperUrl && (
        <div className="fixed inset-0 z-0">
          <Image
            src={wallpaperUrl}
            alt="背景壁纸"
            fill
            className="object-cover transition-opacity duration-500"
            style={{ objectFit: 'cover' }}
            priority
            quality={85}
          />
          {/* 深色遮罩层，确保内容可读性 */}
          <div className="wallpaper-overlay" />
        </div>
      )}
      
      {/* 原有渐变背景（作为备用或叠加） */}
      <div 
        className={`transition-all duration-500 ${
          enabled && wallpaperUrl 
            ? 'absolute inset-0 bg-gradient-to-br from-purple-900/60 via-blue-900/60 to-indigo-900/60' 
            : 'min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900'
        }`}
      >
        {/* 内容区域 */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
};

export default WallpaperBackground;