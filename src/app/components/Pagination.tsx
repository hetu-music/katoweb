"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    // 移动端显示更少的页码
    const delta = isMobile ? 1 : 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className={`flex items-center justify-center gap-1 sm:gap-2 ${className} overflow-x-auto px-4 sm:px-0`}>
      {/* 上一页按钮 */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex-shrink-0"
        title="上一页"
      >
        <ChevronLeft size={14} className="sm:w-4 sm:h-4" />
      </button>

      {/* 页码按钮 */}
      {visiblePages.map((page, index) => {
        if (page === "...") {
          return (
            <div
              key={`dots-${index}`}
              className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 text-white/60 flex-shrink-0"
            >
              <MoreHorizontal size={14} className="sm:w-4 sm:h-4" />
            </div>
          );
        }

        const pageNum = page as number;
        const isActive = pageNum === currentPage;

        return (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl border transition-all duration-200 font-medium text-xs sm:text-sm flex-shrink-0 ${
              isActive
                ? "bg-gradient-to-r from-blue-500/80 to-purple-500/80 border-blue-400/60 text-white shadow-lg"
                : "bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
            }`}
          >
            {pageNum}
          </button>
        );
      })}

      {/* 下一页按钮 */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex-shrink-0"
        title="下一页"
      >
        <ChevronRight size={14} className="sm:w-4 sm:h-4" />
      </button>
    </div>
  );
};

export default Pagination;