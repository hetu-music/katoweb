"use client";

import React from "react";
import { ArrowUp, Share2 } from "lucide-react";

interface FloatingActionButtonsProps {
  showScrollTop: boolean;
  onScrollToTop: () => void;
  onShare?: () => void;
  className?: string; // Add className prop for flexibility
}

const FloatingActionButtons: React.FC<FloatingActionButtonsProps> = ({
  showScrollTop,
  onScrollToTop,
  onShare,
  className,
}) => {
  const buttonClass =
    "p-3 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 shadow-lg shadow-slate-200/50 dark:shadow-black/50 ring-1 ring-slate-900/5 dark:ring-white/10 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center";

  return (
    <div
      className={`fixed bottom-8 right-8 z-50 flex flex-col gap-4 ${className || ""}`}
    >
      {/* 分享按钮 */}
      {onShare && (
        <button
          onClick={onShare}
          className={`${buttonClass} animate-in fade-in slide-in-from-bottom-4 duration-500`}
          title="Share"
          aria-label="Share"
        >
          <Share2 size={20} />
        </button>
      )}

      {/* 返回顶部按钮 */}
      <button
        onClick={onScrollToTop}
        className={`${buttonClass} ${
          showScrollTop
            ? "translate-y-0 opacity-100"
            : "translate-y-8 opacity-0 pointer-events-none"
        }`}
        title="Scroll to Top"
        aria-label="Scroll to Top"
      >
        <ArrowUp size={20} />
      </button>
    </div>
  );
};

export default FloatingActionButtons;
