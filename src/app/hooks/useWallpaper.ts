"use client";

import { useState, useEffect, useCallback } from 'react';

interface WallpaperData {
  url: string;
  copyright: string;
  title: string;
  source: 'bing' | 'picsum';
}

interface UseWallpaperReturn {
  wallpaper: WallpaperData | null;
  isLoading: boolean;
  error: string | null;
  refreshWallpaper: () => void;
  wallpaperEnabled: boolean;
  toggleWallpaper: () => void;
}

export const useWallpaper = (): UseWallpaperReturn => {
  const [wallpaper, setWallpaper] = useState<WallpaperData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wallpaperEnabled, setWallpaperEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('wallpaper-enabled');
      return saved !== null ? JSON.parse(saved) : false;
    }
    return false;
  });

  const fetchWallpaper = useCallback(async () => {
    if (!wallpaperEnabled) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/wallpaper');
      if (!response.ok) {
        throw new Error('获取壁纸失败');
      }
      
      const data = await response.json();
      setWallpaper(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
      console.error('壁纸加载失败:', err);
    } finally {
      setIsLoading(false);
    }
  }, [wallpaperEnabled]);

  const refreshWallpaper = useCallback(() => {
    fetchWallpaper();
  }, [fetchWallpaper]);

  const toggleWallpaper = useCallback(() => {
    const newEnabled = !wallpaperEnabled;
    setWallpaperEnabled(newEnabled);
    localStorage.setItem('wallpaper-enabled', JSON.stringify(newEnabled));
    
    if (!newEnabled) {
      setWallpaper(null);
    }
  }, [wallpaperEnabled]);

  useEffect(() => {
    fetchWallpaper();
  }, [fetchWallpaper]);

  return {
    wallpaper,
    isLoading,
    error,
    refreshWallpaper,
    wallpaperEnabled,
    toggleWallpaper,
  };
};