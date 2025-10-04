"use client";

import React from 'react';
import { ArrowUp } from 'lucide-react';

interface ScrollToTopButtonProps {
  showScrollTop: boolean;
  onScrollToTop: () => void;
}

const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({
  showScrollTop,
  onScrollToTop,
}) => {
  return (
    <button
      onClick={onScrollToTop}
      className={`fixed bottom-8 right-8 z-40 p-3 rounded-full bg-gradient-to-br from-purple-700 via-blue-700 to-indigo-700 text-white shadow-lg border border-white/20 backdrop-blur-md hover:scale-110 transition-all duration-300 ${
        showScrollTop
          ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
          : "opacity-0 scale-75 translate-y-2 pointer-events-none"
      }`}
      aria-label="返回顶部"
    >
      <ArrowUp size={24} />
    </button>
  );
};

export default ScrollToTopButton;