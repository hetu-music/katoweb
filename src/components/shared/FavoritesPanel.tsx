"use client";

import React, { useEffect, useRef } from "react";
import { X, Heart, Trash2, ExternalLink } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useFavorites } from "@/hooks/useFavorites";
import { getCoverUrl } from "@/lib/utils-song";
import type { Song } from "@/lib/types";

interface FavoritesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  allSongs: Song[];
}

const FavoritesPanel: React.FC<FavoritesPanelProps> = ({
  isOpen,
  onClose,
  allSongs,
}) => {
  const { favorites, isFavorite, toggleFavorite, clearFavorites } =
    useFavorites();
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);

  const favoritedSongs = allSongs.filter((s) => favorites.includes(s.id));

  // 点击遮罩关闭
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose]);

  // ESC 关闭
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  return (
    <>
      {/* 遮罩 */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* 侧边面板 */}
      <div
        ref={panelRef}
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-white dark:bg-slate-900 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Heart size={18} className="text-rose-500 fill-current" />
            <span className="font-medium text-slate-800 dark:text-slate-100">
              我的收藏
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {favoritedSongs.length} 首
            </span>
          </div>
          <div className="flex items-center gap-2">
            {favoritedSongs.length > 0 && (
              <button
                onClick={clearFavorites}
                title="清空收藏"
                aria-label="清空收藏"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              title="关闭"
              aria-label="关闭"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto">
          {favoritedSongs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 dark:text-slate-500">
              <Heart size={40} className="opacity-30" />
              <p className="text-sm">还没有收藏任何歌曲</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-50 dark:divide-slate-800">
              {favoritedSongs.map((song) => (
                <li
                  key={song.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                >
                  {/* 封面 */}
                  <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 ring-1 ring-slate-900/5 dark:ring-white/10">
                    <Image
                      src={getCoverUrl(song)}
                      alt={song.title}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* 信息 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                      {song.title}
                    </p>
                    {song.artist && song.artist.length > 0 && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                        {song.artist.join(" / ")}
                      </p>
                    )}
                  </div>

                  {/* 操作 */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        onClose();
                        router.push(`/song/${song.id}`);
                      }}
                      title="查看详情"
                      aria-label="查看详情"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      <ExternalLink size={14} />
                    </button>
                    <button
                      onClick={() => toggleFavorite(song.id)}
                      title="取消收藏"
                      aria-label="取消收藏"
                      className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                    >
                      <Heart size={14} className="fill-current" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
};

export default FavoritesPanel;
