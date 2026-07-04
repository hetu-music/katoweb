"use client";

import Loading from "@/components/shared/Loading";

/**
 * 页面级通用加载屏，直接复用共享的 Loading 组件以保证视觉一致性
 */
export default function LibraryLoading() {
  return <Loading />;
}
