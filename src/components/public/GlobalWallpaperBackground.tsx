"use client";

import React, { useState, useEffect } from "react";
import { useWallpaper } from "@/context/WallpaperContext";

const GlobalWallpaperBackground: React.FC = () => {
  const { wallpaper, wallpaperEnabled, isHydrated } = useWallpaper();
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [currentWallpaper, setCurrentWallpaper] = useState<string | null>(null);
  const [showWallpaper, setShowWallpaper] = useState(false);

  // 当壁纸URL变化时，重置加载状态
  useEffect(() => {
    if (wallpaper?.url !== currentWallpaper) {
      const resetWallpaperState = () => {
        setIsImageLoaded(false);
        setShowWallpaper(false);
        setCurrentWallpaper(wallpaper?.url || null);
      };
      resetWallpaperState();
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
      const updateWallpaperVisibility = () => {
        setShowWallpaper(false);
      };
      updateWallpaperVisibility();
    }
  }, [isImageLoaded, wallpaperEnabled, wallpaper?.url]);

  // 使用伪元素设置壁纸背景
  useEffect(() => {
    if (wallpaperEnabled && wallpaper?.url && showWallpaper) {
      document.documentElement.style.setProperty(
        "--wallpaper-url",
        `url("${wallpaper.url}")`,
      );
      document.documentElement.classList.add("wallpaper-active");
    } else {
      document.documentElement.style.removeProperty("--wallpaper-url");
      document.documentElement.classList.remove("wallpaper-active");
    }

    // 清理函数
    return () => {
      document.documentElement.style.removeProperty("--wallpaper-url");
      document.documentElement.classList.remove("wallpaper-active");
    };
  }, [wallpaperEnabled, wallpaper?.url, showWallpaper]);

  // 如果还没有hydrated，不渲染任何内容，避免闪动
  if (!isHydrated) {
    return null;
  }

  return null; // 使用伪元素，不需要渲染DOM元素
};

export default GlobalWallpaperBackground;
