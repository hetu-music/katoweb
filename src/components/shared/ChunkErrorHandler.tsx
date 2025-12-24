"use client";

import { useEffect } from "react";

/**
 * 全局 ChunkLoadError 处理器
 *
 * 当版本更新导致旧的代码块文件失效时（ChunkLoadError），
 * 此组件会自动检测并静默刷新页面，用户几乎感觉不到错误发生。
 *
 * 为防止无限刷新循环，使用 sessionStorage 记录刷新次数，
 * 同一会话中最多只刷新一次。
 */
export function ChunkErrorHandler() {
    useEffect(() => {
        const STORAGE_KEY = "chunk_error_refresh";
        const MAX_REFRESH_COUNT = 1;

        /**
         * 检查错误是否为 ChunkLoadError
         */
        const isChunkLoadError = (error: Error | string): boolean => {
            const errorString =
                error instanceof Error ? error.message : String(error);

            // 匹配常见的 ChunkLoadError 模式
            return (
                errorString.includes("ChunkLoadError") ||
                errorString.includes("Loading chunk") ||
                errorString.includes("Loading CSS chunk") ||
                errorString.includes("Failed to fetch dynamically imported module") ||
                // Next.js 特定的错误模式
                errorString.includes("Failed to load static props") ||
                // Webpack 相关错误
                /Loading.*chunk.*failed/i.test(errorString)
            );
        };

        /**
         * 检查是否应该刷新页面
         * 使用 sessionStorage 防止无限刷新循环
         */
        const shouldRefresh = (): boolean => {
            try {
                const stored = sessionStorage.getItem(STORAGE_KEY);
                const refreshData = stored ? JSON.parse(stored) : { count: 0, time: 0 };

                // 如果上次刷新是在 10 秒内，检查刷新次数
                const now = Date.now();
                if (now - refreshData.time < 10000) {
                    return refreshData.count < MAX_REFRESH_COUNT;
                }

                // 超过 10 秒，重置计数
                return true;
            } catch {
                return true;
            }
        };

        /**
         * 记录刷新尝试
         */
        const recordRefreshAttempt = (): void => {
            try {
                const stored = sessionStorage.getItem(STORAGE_KEY);
                const refreshData = stored ? JSON.parse(stored) : { count: 0, time: 0 };
                const now = Date.now();

                // 如果超过 10 秒，重置计数
                if (now - refreshData.time >= 10000) {
                    refreshData.count = 0;
                }

                refreshData.count += 1;
                refreshData.time = now;
                sessionStorage.setItem(STORAGE_KEY, JSON.stringify(refreshData));
            } catch {
                // 忽略 sessionStorage 错误
            }
        };

        /**
         * 静默刷新页面
         */
        const silentRefresh = (): void => {
            if (shouldRefresh()) {
                recordRefreshAttempt();
                // 使用 location.reload() 进行硬刷新
                window.location.reload();
            } else {
                // 如果已经刷新过但仍然出错，说明问题不是缓存导致的
                console.error(
                    "[ChunkErrorHandler] 已尝试刷新但问题仍然存在，可能不是版本更新导致的问题"
                );
            }
        };

        /**
         * 全局错误处理器
         */
        const handleError = (event: ErrorEvent): void => {
            if (isChunkLoadError(event.error || event.message)) {
                console.log("[ChunkErrorHandler] 检测到 ChunkLoadError，正在刷新页面...");
                event.preventDefault();
                silentRefresh();
            }
        };

        /**
         * 处理未捕获的 Promise rejection
         */
        const handleUnhandledRejection = (
            event: PromiseRejectionEvent
        ): void => {
            const reason = event.reason;
            if (
                reason instanceof Error &&
                isChunkLoadError(reason)
            ) {
                console.log(
                    "[ChunkErrorHandler] 检测到 ChunkLoadError (Promise rejection)，正在刷新页面..."
                );
                event.preventDefault();
                silentRefresh();
            } else if (typeof reason === "string" && isChunkLoadError(reason)) {
                console.log(
                    "[ChunkErrorHandler] 检测到 ChunkLoadError (String rejection)，正在刷新页面..."
                );
                event.preventDefault();
                silentRefresh();
            }
        };

        // 添加事件监听器
        window.addEventListener("error", handleError);
        window.addEventListener("unhandledrejection", handleUnhandledRejection);

        // 清理函数
        return () => {
            window.removeEventListener("error", handleError);
            window.removeEventListener("unhandledrejection", handleUnhandledRejection);
        };
    }, []);

    // 此组件不渲染任何内容
    return null;
}
