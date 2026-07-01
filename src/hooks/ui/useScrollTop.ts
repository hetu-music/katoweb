"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * 监听页面滚动，当滚动距离超过 threshold 时返回 true。
 * 同时提供 scrollToTop 工具函数。
 */
export function useScrollTop(threshold = 400) {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > threshold);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return { showScrollTop, scrollToTop };
}
