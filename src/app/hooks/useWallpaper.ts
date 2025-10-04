"use client";

import { useState, useEffect, useCallback } from 'react';

interface WallpaperData {
  url: string;
  copyright: string;
  title: string;
  source: 'bing' | 'picsum';
  timestamp: number; // 添加时间戳用于过期检查
}

interface UseWallpaperReturn {
  wallpaper: WallpaperData | null;
  isLoading: boolean;
  error: string | null;
  refreshWallpaper: () => void;
  wallpaperEnabled: boolean;
  toggleWallpaper: () => void;
  isHydrated: boolean;
}

// 壁纸过期时间：24小时（毫秒）
const WALLPAPER_EXPIRE_TIME = 24 * 60 * 60 * 1000;

export const useWallpaper = (): UseWallpaperReturn => {
  const [wallpaper, setWallpaper] = useState<WallpaperData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wallpaperEnabled, setWallpaperEnabled] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // 在客户端初始化时从 localStorage 读取数据
  useEffect(() => {
    setIsHydrated(true);

    const savedEnabled = localStorage.getItem('wallpaper-enabled');
    if (savedEnabled !== null) {
      setWallpaperEnabled(JSON.parse(savedEnabled));
    }

    const savedWallpaper = localStorage.getItem('current-wallpaper');
    if (savedWallpaper) {
      try {
        const wallpaperData = JSON.parse(savedWallpaper);
        // 检查壁纸是否过期
        const now = Date.now();
        if (wallpaperData.timestamp && (now - wallpaperData.timestamp < WALLPAPER_EXPIRE_TIME)) {
          setWallpaper(wallpaperData);
        } else {
          // 壁纸已过期，清除缓存
          localStorage.removeItem('current-wallpaper');
        }
      } catch (err) {
        console.error('Failed to parse saved wallpaper:', err);
        localStorage.removeItem('current-wallpaper');
      }
    }
  }, []);

  const fetchWallpaper = useCallback(async (forceRefresh = false) => {
    if (!isHydrated || !wallpaperEnabled) return;

    // 如果不是强制刷新且已有壁纸，则不重新获取
    if (!forceRefresh && wallpaper) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/wallpaper');
      if (!response.ok) {
        throw new Error('获取壁纸失败');
      }

      const data = await response.json();
      // 添加时间戳
      const wallpaperWithTimestamp = {
        ...data,
        timestamp: Date.now()
      };
      setWallpaper(wallpaperWithTimestamp);
      // 保存到 localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('current-wallpaper', JSON.stringify(wallpaperWithTimestamp));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
      console.error('壁纸加载失败:', err);
    } finally {
      setIsLoading(false);
    }
  }, [wallpaperEnabled, wallpaper, isHydrated]);

  const refreshWallpaper = useCallback(() => {
    if (!isHydrated) return; // 防止在 hydration 之前执行
    fetchWallpaper(true); // 强制刷新
  }, [fetchWallpaper, isHydrated]);

  const toggleWallpaper = useCallback(() => {
    if (!isHydrated) return; // 防止在 hydration 之前执行

    const newEnabled = !wallpaperEnabled;
    setWallpaperEnabled(newEnabled);
    localStorage.setItem('wallpaper-enabled', JSON.stringify(newEnabled));

    // 关闭壁纸时不清除壁纸数据，保留缓存供下次使用
    // 壁纸会在24小时后自动过期
  }, [wallpaperEnabled, isHydrated]);

  useEffect(() => {
    if (isHydrated && wallpaperEnabled && !wallpaper) {
      fetchWallpaper(false); // 仅在没有壁纸时获取
    }
  }, [wallpaperEnabled, wallpaper, fetchWallpaper, isHydrated]);

  return {
    wallpaper,
    isLoading,
    error,
    refreshWallpaper,
    wallpaperEnabled,
    toggleWallpaper,
    isHydrated,
  };
};