"use client";

import React, { useRef } from "react";
import { Heart } from "lucide-react";
import { useFavorites } from "@/context/FavoritesContext";

interface FavoriteButtonProps {
  songId: number;
  /** "icon" = 圆形浮动按钮风格，"inline" = 内联小按钮 */
  variant?: "icon" | "inline";
  className?: string;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  songId,
  variant = "icon",
  className = "",
}) => {
  const { isFavorite, toggleFavorite, loaded, isLoggedIn } = useFavorites();
  const isProcessing = useRef(false);

  // 未加载完成或未登录时不渲染
  if (!loaded || !isLoggedIn) return null;

  const active = isFavorite(songId);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // 防抖/节流：防止短时间内重复点击
    if (isProcessing.current) return;
    
    isProcessing.current = true;
    toggleFavorite(songId);
    
    setTimeout(() => {
      isProcessing.current = false;
    }, 500); // 500ms 冷却时间
  };

  if (variant === "inline") {
    return (
      <button
        onClick={handleClick}
        aria-label={active ? "取消收藏" : "收藏"}
        title={active ? "取消收藏" : "收藏"}
        className={`flex items-center justify-center transition-all duration-200 ${
          active
            ? "text-rose-500 dark:text-rose-400"
            : "text-slate-400 dark:text-slate-500 hover:text-rose-400 dark:hover:text-rose-400"
        } ${className}`}
      >
        <Heart size={16} className={active ? "fill-current" : ""} />
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      aria-label={active ? "取消收藏" : "收藏"}
      title={active ? "取消收藏" : "收藏"}
      className={`p-3 rounded-full bg-white dark:bg-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-black/50 ring-1 ring-slate-900/5 dark:ring-white/10 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center ${
        active
          ? "text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20"
          : "text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-500 dark:hover:text-rose-400"
      } ${className}`}
    >
      <Heart size={20} className={active ? "fill-current" : ""} />
    </button>
  );
};

export default FavoriteButton;
