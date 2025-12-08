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
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
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
  
  // 创建一个唯一的 key 前缀，当 visiblePages 变化时强制重新渲染所有按钮
  const keyPrefix = visiblePages.filter(p => typeof p === 'number').join('-');

  return (
    <div
      className={`flex items-center justify-center gap-1 sm:gap-2 ${className} overflow-x-auto px-4 sm:px-0`}
    >
      {/* 上一页按钮 */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shrink-0"
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
              className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 text-white/60 shrink-0"
            >
              <MoreHorizontal size={14} className="sm:w-4 sm:h-4" />
            </div>
          );
        }

        const pageNum = page as number;
        const isActive = pageNum === currentPage;

        return (
          <button
            key={`${keyPrefix}-page-${pageNum}-${index}`}
            onClick={() => onPageChange(pageNum)}
            style={{
              background: isActive 
                ? 'linear-gradient(to right, rgba(59, 130, 246, 0.8), rgba(168, 85, 247, 0.8))'
                : 'rgba(255, 255, 255, 0.1)',
              borderColor: isActive ? 'rgba(96, 165, 250, 0.6)' : 'rgba(255, 255, 255, 0.2)',
              boxShadow: isActive ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' : 'none',
            }}
            className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl border font-medium text-xs sm:text-sm shrink-0 text-white backdrop-blur-sm hover:bg-white/20 transition-colors duration-200"
          >
            {pageNum}
          </button>
        );
      })}

      {/* 下一页按钮 */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shrink-0"
        title="下一页"
      >
        <ChevronRight size={14} className="sm:w-4 sm:h-4" />
      </button>
    </div>
  );
};

export default Pagination;
