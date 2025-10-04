"use client";

import React from 'react';

interface WallpaperBackgroundProps {
  wallpaperUrl?: string | null; // 保持兼容性，但不再使用
  enabled?: boolean; // 保持兼容性，但不再使用
  children: React.ReactNode;
}

const WallpaperBackground: React.FC<WallpaperBackgroundProps> = ({
  children,
}) => {
  // 现在只是一个简单的容器，背景由全局组件处理
  return (
    <div className="relative min-h-screen">
      {children}
    </div>
  );
};

export default WallpaperBackground;