"use client";

import { useQuery } from "@tanstack/react-query";

async function fetchCsrfToken(): Promise<string> {
  const res = await fetch("/api/public/csrf-token", { cache: "no-store" });
  if (!res.ok) throw new Error("获取 CSRF Token 失败");
  const data: { csrfToken?: string } = await res.json();
  return data.csrfToken ?? "";
}

/**
 * 全局共享的 CSRF token hook。
 * 使用 react-query 缓存，同一页面内多个组件调用只会发出一次请求。
 * staleTime: Infinity 表示 token 在页面生命周期内不会自动重新请求。
 */
export function useCsrfToken() {
  const { data: csrfToken = "" } = useQuery({
    queryKey: ["csrf-token"],
    queryFn: fetchCsrfToken,
    staleTime: Infinity,
    retry: 2,
  });

  return csrfToken;
}
