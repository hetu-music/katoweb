"use client";

import { useFavorites } from "@/context/FavoritesContext";
import { getCoverUrl } from "@/lib/utils-song";
import PlayButton from "@/components/shared/PlayButton";
import EnqueueButton from "@/components/shared/EnqueueButton";
import { Heart, Loader2, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

export default function FavoritesTabContent() {
  const router = useRouter();
  const {
    favoriteSongs,
    toggleFavorite,
    clearFavorites,
    loaded: favoritesLoaded,
  } = useFavorites();

  const [expandedReviews, setExpandedReviews] = useState<Map<number, boolean>>(new Map());
  // Lazy-loaded review texts: songId -> review text (or "loading")
  const [reviewTexts, setReviewTexts] = useState<Map<number, string | null>>(new Map());

  const toggleReview = useCallback(
    async (id: number, e: React.MouseEvent) => {
      e.stopPropagation();
      setExpandedReviews((prev) => {
        const next = new Map(prev);
        const isExpanding = !next.get(id);
        next.set(id, isExpanding);

        if (isExpanding && !reviewTexts.has(id)) {
          // Lazy-load review text on first expand
          fetch(`/api/public/collections/review?songId=${id}`)
            .then((res) => res.json())
            .then((data) => {
              setReviewTexts((rt) => {
                const nextRt = new Map(rt);
                nextRt.set(id, data.review || "");
                return nextRt;
              });
            })
            .catch(() => {
              setReviewTexts((rt) => {
                const nextRt = new Map(rt);
                nextRt.set(id, null);
                return nextRt;
              });
            });
        }
        return next;
      });
    },
    [reviewTexts],
  );

  if (!favoritesLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-320px)]">
        <Loader2 size={32} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (favoriteSongs.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[calc(100vh-320px)] bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-200/50 dark:border-slate-800/50 p-8 text-center shadow-xs">
        <Heart size={40} className="text-slate-200 dark:text-slate-800 mb-4" />
        <p className="text-slate-455 text-sm">还没有收藏任何曲目</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 flex flex-col">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-705 dark:text-slate-295">
            已收藏 {favoriteSongs.length} 首作品
          </span>
        </div>
        <button
          onClick={clearFavorites}
          className="text-xs font-bold text-rose-500 hover:text-rose-600 px-3 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors flex items-center gap-1.5"
        >
          <Trash2 size={12} />
          全部清除
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 pb-8">
        {favoriteSongs.map((song) => (
          <div
            key={song.id}
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden transition-all hover:border-blue-500/30 dark:hover:border-blue-500/30 group"
          >
            <div
              onClick={() => {
                const d = parseInt(sessionStorage.getItem("__katoweb_nav_depth") || "0", 10);
                sessionStorage.setItem("__katoweb_nav_depth", String(d + 1));
                router.push(`/song/${song.id}`);
              }}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 cursor-pointer"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 shadow-xs">
                  <Image
                    src={getCoverUrl(song)}
                    alt={song.title}
                    width={56}
                    height={56}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>

                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {song.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                    {song.collectionInfo?.created_at && (
                      <span>
                        收藏于{" "}
                        {new Date(song.collectionInfo.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 sm:pt-0 border-t border-slate-100 dark:border-slate-800/40 sm:border-0">
                {!!song.collectionInfo?.review && (
                  <button
                    onClick={(e) => toggleReview(song.id, e)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    {expandedReviews.get(song.id) ? "隐藏评论" : "查看评论"}
                  </button>
                )}
                <div className="flex items-center gap-1.5">
                  <PlayButton
                    songId={song.id}
                    title={song.title}
                    artist={song.artist?.join(" / ")}
                    coverUrl={getCoverUrl(song)}
                    hasAudio={song.has_audio}
                  />
                  <EnqueueButton
                    songId={song.id}
                    title={song.title}
                    artist={song.artist?.join(" / ")}
                    coverUrl={getCoverUrl(song)}
                    hasAudio={song.has_audio}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(song.id);
                    }}
                    className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                    title="取消收藏"
                  >
                    <Heart size={16} className="fill-current" />
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded Review — lazy-loaded */}
            {!!song.collectionInfo?.review && expandedReviews.get(song.id) && (
              <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-855">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/30">
                  {!reviewTexts.has(song.id) ? (
                    <p className="text-xs text-slate-400 animate-pulse">加载评论中...</p>
                  ) : (
                    <p className="text-xs font-medium text-slate-705 dark:text-slate-295 whitespace-pre-line leading-relaxed">
                      {reviewTexts.get(song.id) || song.collectionInfo.review || "暂无内容"}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
