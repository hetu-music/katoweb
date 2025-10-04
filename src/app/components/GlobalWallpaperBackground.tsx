"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useWallpaper } from '../context/WallpaperContext';

const GlobalWallpaperBackground: React.FC = () => {
  const { wallpaper, wallpaperEnabled, isHydrated } = useWallpaper();
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [currentWallpaper, setCurrentWallpaper] = useState<string | null>(null);
  const [showWallpaper, setShowWallpaper] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  // 当壁纸URL变化时，重置加载状态
  useEffect(() => {
    if (wallpaper?.url !== currentWallpaper) {
      setIsImageLoaded(false);
      setShowWallpaper(false);
      setCurrentWallpaper(wallpaper?.url || null);
    }
  }, [wallpaper?.url, currentWallpaper]);

  // 预加载图片
  useEffect(() => {
    if (wallpaper?.url && wallpaperEnabled) {
      const img = new window.Image();
      img.onload = () => {
        setIsImageLoaded(true);
      };
      img.onerror = () => {
        setIsImageLoaded(false);
      };
      img.src = wallpaper.url;
    }
  }, [wallpaper?.url, wallpaperEnabled]);

  // 当图片加载完成且壁纸启用时，延迟显示以确保平滑过渡
  useEffect(() => {
    if (isImageLoaded && wallpaperEnabled && wallpaper?.url) {
      // 短暂延迟确保图片完全准备好
      const timer = setTimeout(() => {
        setShowWallpaper(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setShowWallpaper(false);
    }
  }, [isImageLoaded, wallpaperEnabled, wallpaper?.url]);

  // 如果还没有hydrated，不渲染任何内容，避免闪动
  if (!isHydrated) {
    return null;
  }

  return (
    <>
      {/* 壁纸背景 - 仅在启用且有壁纸时显示 */}
      {wallpaperEnabled && wallpaper?.url && (
        <div className={`fixed inset-0 z-0 wallpaper-background-image transition-opacity duration-700 ease-out ${showWallpaper ? 'opacity-100' : 'opacity-0'}`}>
          <Image
            ref={imageRef}
            src={wallpaper.url}
            alt="背景壁纸"
            fill
            className="wallpaper-image"
            style={{ objectFit: 'cover' }}
            priority
            quality={95}
            unoptimized={false}
            onLoad={() => {
              setIsImageLoaded(true);
            }}
            onError={() => {
              setIsImageLoaded(false);
              setShowWallpaper(false);
            }}
          />
          {/* 轻微的深色遮罩层，确保内容可读性 */}
          <div className="wallpaper-overlay" />
        </div>
      )}
    </>
  );
};

export default GlobalWallpaperBackground;