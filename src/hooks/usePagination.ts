"use client";

import { useState, useMemo, useEffect, useRef } from "react";

interface UsePaginationProps<T> {
  data: T[];
  itemsPerPage?: number;
  initialPage?: number;
  resetOnDataChange?: boolean;
}

interface UsePaginationReturn<T> {
  currentPage: number;
  totalPages: number;
  currentData: T[];
  setCurrentPage: (page: number) => void;
  goToNextPage: () => void;
  goToPrevPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  startIndex: number;
  endIndex: number;
  totalItems: number;
}

export function usePagination<T>({
  data,
  itemsPerPage = 25,
  initialPage = 1,
  resetOnDataChange = false,
}: UsePaginationProps<T>): UsePaginationReturn<T> {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const prevInitialPageRef = useRef(initialPage);
  const prevDataLengthRef = useRef(data.length);

  // 当 initialPage 变化时，更新 currentPage（避免无限循环）
  useEffect(() => {
    if (initialPage !== prevInitialPageRef.current) {
      prevInitialPageRef.current = initialPage;
      const updatePage = () => {
        setCurrentPage(initialPage);
      };
      updatePage();
    }
  }, [initialPage]);

  // 计算总页数
  const totalPages = useMemo(() => {
    return Math.ceil(data.length / itemsPerPage);
  }, [data.length, itemsPerPage]);

  // 当数据变化时，处理页面重置或调整
  useEffect(() => {
    // 如果启用了数据变化时重置，且数据长度发生变化，重置到第一页
    if (resetOnDataChange && data.length !== prevDataLengthRef.current) {
      prevDataLengthRef.current = data.length;
      const resetToFirstPage = () => {
        setCurrentPage(1);
      };
      resetToFirstPage();
      return;
    }

    // 否则只确保当前页面有效
    const adjustCurrentPage = () => {
      if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages);
      } else if (currentPage < 1) {
        setCurrentPage(1);
      }
    };
    adjustCurrentPage();
  }, [currentPage, totalPages, data.length, resetOnDataChange]);

  // 计算当前页的数据
  const currentData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPage]);

  // 计算索引信息
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, data.length);

  // 分页操作函数
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToFirstPage = () => {
    setCurrentPage(1);
  };

  const goToLastPage = () => {
    setCurrentPage(totalPages);
  };

  const handleSetCurrentPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return {
    currentPage,
    totalPages,
    currentData,
    setCurrentPage: handleSetCurrentPage,
    goToNextPage,
    goToPrevPage,
    goToFirstPage,
    goToLastPage,
    startIndex,
    endIndex,
    totalItems: data.length,
  };
}
