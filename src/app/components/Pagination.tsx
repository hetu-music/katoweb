"use client";

import React from "react";
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
  if (totalPages <= 1) return null;

  const getVisiblePages = () => {
    const delta = 2;
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
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {/* 上一页按钮 */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        title="上一页"
      >
        <ChevronLeft size={16} />
      </button>

      {/* 页码按钮 */}
      {visiblePages.map((page, index) => {
        if (page === "...") {
          return (
            <div
              key={`dots-${index}`}
              className="flex items-center justify-center w-10 h-10 text-white/60"
            >
              <MoreHorizontal size={16} />
            </div>
          );
        }

        const pageNum = page as number;
        const isActive = pageNum === currentPage;

        return (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`flex items-center justify-center w-10 h-10 rounded-xl border transition-all duration-200 font-medium ${
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
        className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        title="下一页"
      >
        <ChevronRight size={16} />
      </button>

      {/* 页码信息 */}
      <div className="ml-4 text-sm text-white/80 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-2">
        第 {currentPage} 页，共 {totalPages} 页
      </div>
    </div>
  );
};

export default Pagination;