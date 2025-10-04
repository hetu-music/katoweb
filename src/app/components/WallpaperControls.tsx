"use client";

import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, Image, ImageOff, Settings } from 'lucide-react';

interface WallpaperControlsProps {
  enabled: boolean;
  isLoading: boolean;
  onToggle: () => void;
  onRefresh: () => void;
  isHydrated?: boolean;
}

const WallpaperControls: React.FC<WallpaperControlsProps> = ({
  enabled,
  isLoading,
  onToggle,
  onRefresh,
  isHydrated = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 检测屏幕尺寸
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 640); // sm breakpoint
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 点击外部区域关闭面板
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // 清除延迟定时器
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (isLargeScreen) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsExpanded(true);
    }
  };

  const handleMouseLeave = () => {
    if (isLargeScreen) {
      // 延迟 800ms 后消失
      timeoutRef.current = setTimeout(() => {
        setIsExpanded(false);
      }, 500);
    }
  };

  const handleClick = () => {
    if (!isLargeScreen) {
      // 小屏幕使用点击切换
      setIsExpanded(!isExpanded);
    }
  };

  // 在 hydration 完成之前不渲染，避免 hydration 错误
  if (!isHydrated) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 主触发按钮 - 与视图切换按钮样式一致 */}
      <button
        onClick={handleClick}
        className="p-2 rounded-full bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-all duration-200"
        aria-label="壁纸设置"
        title="壁纸设置"
      >
        <Settings size={20} />
      </button>

      {/* 展开的控制面板 */}
      <div 
        className={`absolute top-12 right-0 flex flex-row gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 shadow-lg transition-all duration-300 z-50 ${isExpanded
          ? 'opacity-100 scale-100 pointer-events-auto'
          : 'opacity-0 scale-95 pointer-events-none'
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* 刷新壁纸按钮 */}
        <button
          onClick={onRefresh}
          disabled={isLoading || !enabled}
          className={`w-10 h-10 flex items-center justify-center rounded-lg shadow-md border border-white/20 backdrop-blur-md hover:scale-105 transition-all duration-200 ${enabled
            ? 'bg-gradient-to-br from-rose-500 to-pink-600 text-white'
            : 'bg-white/10 text-white/50'
            } ${isLoading ? 'opacity-60 cursor-not-allowed' : ''
            }`}
          aria-label="刷新壁纸"
          title="刷新壁纸"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>

        {/* 壁纸开关按钮 */}
        <button
          onClick={onToggle}
          className={`w-10 h-10 flex items-center justify-center rounded-lg shadow-md border border-white/20 backdrop-blur-md hover:scale-105 transition-all duration-200 ${enabled
            ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white'
            : 'bg-white/20 text-white/70'
            }`}
          aria-label={enabled ? "关闭壁纸" : "开启壁纸"}
          title={enabled ? "关闭壁纸" : "开启壁纸"}
        >
          {enabled ? <Image className="w-5 h-5" aria-hidden="true" /> : <ImageOff className="w-5 h-5" aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
};

export default WallpaperControls;