"use client";

import React, { useState, useEffect } from "react";
import { useWallpaper } from "../context/WallpaperContext";

const GlobalWallpaperBackground: React.FC = () => {
  const { wallpaper, wallpaperEnabled, isHydrated } = useWallpaper();
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [currentWallpaper, setCurrentWallpaper] = useState<string | null>(null);
  const [showWallpaper, setShowWallpaper] = useState(false);

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

  // 动态设置视口高度，解决移动端地址栏变化问题
  useEffect(() => {
    const updateViewportHeight = () => {
      // 获取实际的视口高度
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);

      // 为不支持100dvh的浏览器设置动态高度
      if (!CSS.supports("height", "100dvh")) {
        document.documentElement.style.setProperty(
          "--dynamic-vh",
          `${window.innerHeight}px`,
        );
      }
    };

    // 初始设置
    updateViewportHeight();

    // 监听窗口大小变化和方向变化
    window.addEventListener("resize", updateViewportHeight);
    window.addEventListener("orientationchange", updateViewportHeight);

    // 监听视觉视口变化（处理虚拟键盘和地址栏）
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", updateViewportHeight);
    }

    return () => {
      window.removeEventListener("resize", updateViewportHeight);
      window.removeEventListener("orientationchange", updateViewportHeight);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener(
          "resize",
          updateViewportHeight,
        );
      }
    };
  }, []);

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
