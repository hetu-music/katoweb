"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface WallpaperData {
  url: string;
  copyright: string;
  title: string;
  source: 'bing' | 'picsum';
  timestamp: number;
}

interface WallpaperContextType {
  wallpaper: WallpaperData | null;
  isLoading: boolean;
  error: string | null;
  refreshWallpaper: () => void;
  wallpaperEnabled: boolean;
  toggleWallpaper: () => void;
  isHydrated: boolean;
}

const WallpaperContext = createContext<WallpaperContextType | undefined>(undefined);

// 壁纸过期时间：24小时（毫秒）
const WALLPAPER_EXPIRE_TIME = 24 * 60 * 60 * 1000;

export const WallpaperProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wallpaper, setWallpaper] = useState<WallpaperData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wallpaperEnabled, setWallpaperEnabled] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // 在客户端初始化时从 localStorage 读取数据
  useEffect(() => {
    // 同步读取所有数据，减少状态变化次数
    const savedEnabled = localStorage.getItem('wallpaper-enabled');
    const savedWallpaper = localStorage.getItem('current-wallpaper');
    
    let enabledValue = false;
    let wallpaperValue = null;

    if (savedEnabled !== null) {
      enabledValue = JSON.parse(savedEnabled);
    }

    if (savedWallpaper) {
      try {
        const wallpaperData = JSON.parse(savedWallpaper);
        // 检查壁纸是否过期
        const now = Date.now();
        if (wallpaperData.timestamp && (now - wallpaperData.timestamp < WALLPAPER_EXPIRE_TIME)) {
          wallpaperValue = wallpaperData;
        } else {
          // 壁纸已过期，清除缓存
          localStorage.removeItem('current-wallpaper');
        }
      } catch (err) {
        console.error('Failed to parse saved wallpaper:', err);
        localStorage.removeItem('current-wallpaper');
      }
    }

    // 批量更新状态，减少重渲染
    setWallpaperEnabled(enabledValue);
    setWallpaper(wallpaperValue);
    setIsHydrated(true);
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
    if (!isHydrated) return;
    fetchWallpaper(true);
  }, [fetchWallpaper, isHydrated]);

  const toggleWallpaper = useCallback(() => {
    if (!isHydrated) return;

    const newEnabled = !wallpaperEnabled;
    setWallpaperEnabled(newEnabled);
    localStorage.setItem('wallpaper-enabled', JSON.stringify(newEnabled));
  }, [wallpaperEnabled, isHydrated]);

  useEffect(() => {
    if (isHydrated && wallpaperEnabled && !wallpaper) {
      fetchWallpaper(false);
    }
  }, [wallpaperEnabled, wallpaper, fetchWallpaper, isHydrated]);

  return (
    <WallpaperContext.Provider
      value={{
        wallpaper,
        isLoading,
        error,
        refreshWallpaper,
        wallpaperEnabled,
        toggleWallpaper,
        isHydrated,
      }}
    >
      {children}
    </WallpaperContext.Provider>
  );
};

export const useWallpaper = (): WallpaperContextType => {
  const context = useContext(WallpaperContext);
  if (context === undefined) {
    throw new Error('useWallpaper must be used within a WallpaperProvider');
  }
  return context;
};