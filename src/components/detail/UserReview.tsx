"use client";

import React, { useState, useEffect } from "react";
import { FileText } from "lucide-react";
import { useUserContext } from "@/context/UserContext";
import { useFavorites } from "@/context/FavoritesContext";

interface UserReviewProps {
  songId: number;
}

const UserReview: React.FC<UserReviewProps> = ({ songId }) => {
  const { user } = useUserContext();
  const { isFavorite, refreshFavorites } = useFavorites();
  const [review, setReview] = useState("");
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [isSavingReview, setIsSavingReview] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/public/collections/review?songId=${songId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch review");
        return res.json();
      })
      .then((data) => {
        if (data.review) setReview(data.review);
      })
      .catch((err) => console.error(err));
  }, [user, songId]);

  const handleSaveReview = async () => {
    setIsSavingReview(true);
    try {
      const csrfRes = await fetch("/api/public/csrf-token");
      const csrfData = await csrfRes.json();
      const csrf = csrfData.csrfToken;

      // 确保收藏行存在（唯一约束保证不会重复，23505 冲突视为成功）
      if (!isFavorite(songId)) {
        await fetch("/api/public/collections", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": csrf,
          },
          body: JSON.stringify({ songId }),
        });
      }

      // 保存评论（upsert：基于唯一约束原子更新）
      const res = await fetch("/api/public/collections/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrf,
        },
        body: JSON.stringify({ songId, review }),
      });
      if (!res.ok) throw new Error("Failed to save review");
      setIsEditingReview(false);

      // Refresh context so other pages pick up updated data
      refreshFavorites();
    } catch (err) {
      console.error(err);
      alert("保存评论失败，请稍后重试");
    } finally {
      setIsSavingReview(false);
    }
  };

  if (!user) return null;

  return (
    <div
      id="my-review"
      className="p-6 rounded-2xl bg-slate-100/70 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-800"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-slate-400">
          <FileText size={16} />
          <h2 className="text-xs font-bold uppercase tracking-wider">
            My Review
          </h2>
        </div>
        <div>
          {!isEditingReview ? (
            <button
              onClick={() => setIsEditingReview(true)}
              className="text-xs font-medium text-blue-500 hover:text-blue-600 transition-colors"
            >
              {review ? "编辑" : "添加评论"}
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsEditingReview(false);
                  // 重新获取一下恢复原来的评论或者不处理
                }}
                className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveReview}
                disabled={isSavingReview}
                className="text-xs font-medium text-blue-500 hover:text-blue-600 transition-colors disabled:opacity-50"
              >
                {isSavingReview ? "保存中..." : "保存"}
              </button>
            </div>
          )}
        </div>
      </div>

      {isEditingReview ? (
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="写下你对这首歌的想法..."
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-y min-h-[100px]"
        />
      ) : (
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm whitespace-pre-line">
          {review || <span className="text-slate-400 italic">暂无评论</span>}
        </p>
      )}
    </div>
  );
};

export default UserReview;
