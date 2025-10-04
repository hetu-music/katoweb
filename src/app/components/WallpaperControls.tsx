"use client";

import React, { useState } from 'react';
import { RefreshCw, Image, ImageOff, ChevronLeft, ChevronRight } from 'lucide-react';

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

  // 在 hydration 完成之前不渲染，避免 hydration 错误
  if (!isHydrated) {
    return null;
  }

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40">
      {/* 触发区域 */}
      <div
        className="relative"
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* 展开的按钮容器 */}
        <div className={`absolute right-5 top-1/2 -translate-y-1/2 flex flex-col gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-l-2xl p-3 shadow-lg transition-all duration-300 ${isExpanded
          ? 'translate-x-0 opacity-100 pointer-events-auto'
          : 'translate-x-full opacity-0 pointer-events-none'
          }`}>
          {/* 壁纸开关按钮 */}
          <button
            onClick={onToggle}
            className={`w-10 h-10 flex items-center justify-center rounded-xl shadow-lg border border-white/20 backdrop-blur-md hover:scale-110 transition-all duration-200 ${enabled
              ? 'bg-gradient-to-br from-cyan-600 via-sky-600 to-blue-600 text-white'
              : 'bg-gradient-to-br from-purple-500/30 via-blue-500/30 to-indigo-500/30 text-white/70'
              }`}
            aria-label={enabled ? "关闭壁纸" : "开启壁纸"}
            title={enabled ? "关闭壁纸" : "开启壁纸"}
          >
            {enabled ? <Image className="w-5 h-5" /> : <ImageOff className="w-5 h-5" />}
          </button>

          {/* 刷新壁纸按钮 */}
          <button
            onClick={onRefresh}
            disabled={isLoading || !enabled}
            className={`w-10 h-10 flex items-center justify-center rounded-xl shadow-lg border border-white/20 backdrop-blur-md hover:scale-110 transition-all duration-200 bg-gradient-to-br from-rose-600 via-pink-600 to-fuchsia-600 text-white ${enabled
              ? 'opacity-100 scale-100 pointer-events-auto'
              : 'opacity-50 pointer-events-none'
              } ${isLoading ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            aria-label="刷新壁纸"
            title="刷新壁纸"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* 触发标签 - 贴边设计，小屏幕可点击 */}
        <button
          onClick={handleToggleExpand}
          className={`w-5 h-16 bg-white/10 backdrop-blur-md border-l border-t border-b border-white/20 rounded-l-xl flex items-center justify-center shadow-lg cursor-pointer transition-all duration-300 sm:pointer-events-none ${isExpanded ? 'bg-white/20' : 'hover:bg-white/15 active:bg-white/25'
            }`}
          aria-label={isExpanded ? "收起壁纸控制" : "展开壁纸控制"}
        >
          <div className="transition-transform duration-300">
            {isExpanded ? (
              <ChevronRight className="w-3 h-3 text-white/80" />
            ) : (
              <ChevronLeft className="w-3 h-3 text-white/80" />
            )}
          </div>
        </button>
      </div>
    </div>
  );
};

export default WallpaperControls;