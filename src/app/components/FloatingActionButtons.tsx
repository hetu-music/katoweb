"use client";

import React from "react";
import { Share } from "lucide-react";

interface FloatingActionButtonsProps {
  // 返回顶部相关
  showScrollTop: boolean;
  onScrollToTop: () => void;

  // 分享相关 - 可选
  onShare?: () => void;
}

const FloatingActionButtons: React.FC<FloatingActionButtonsProps> = ({
  showScrollTop,
  onScrollToTop,
  onShare,
}) => {
  return (
    <div className="floating-buttons-bottom">
      {/* 返回顶部按钮 - 带动画的显示/隐藏 */}
      <button
        onClick={onScrollToTop}
        className={`floating-action-button bg-gradient-to-br from-purple-700 via-blue-700 to-indigo-700 text-white ${
          showScrollTop
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-75 translate-y-2 pointer-events-none"
        }`}
        aria-label="返回顶部"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="floating-action-icon"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 15l7-7 7 7"
          />
        </svg>
      </button>

      {/* 分享按钮 - 仅在提供分享函数时显示 */}
      {onShare && (
        <button
          onClick={onShare}
          className="floating-action-button bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 text-white"
          aria-label="分享页面"
        >
          <Share className="floating-action-icon" />
        </button>
      )}
    </div>
  );
};

export default FloatingActionButtons;
