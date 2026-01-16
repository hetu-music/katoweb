"use client";

import { useEffect, useState, useCallback } from "react";

interface ServiceWorkerRegistrationInfo {
    isSupported: boolean;
    isRegistered: boolean;
    isUpdateAvailable: boolean;
    registration: ServiceWorkerRegistration | null;
}

/**
 * PWA Service Worker 注册组件
 * 在客户端自动注册和更新 Service Worker
 */
export function PWARegistration(): null {
    const [, setSwInfo] = useState<ServiceWorkerRegistrationInfo>({
        isSupported: false,
        isRegistered: false,
        isUpdateAvailable: false,
        registration: null,
    });

    const registerServiceWorker = useCallback(async (): Promise<void> => {
        if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
            return;
        }

        try {
            const registration = await navigator.serviceWorker.register("/sw.js", {
                scope: "/",
                updateViaCache: "none",
            });

            setSwInfo((prev) => ({
                ...prev,
                isSupported: true,
                isRegistered: true,
                registration,
            }));

            // 检查更新
            registration.addEventListener("updatefound", () => {
                const newWorker = registration.installing;
                if (newWorker) {
                    newWorker.addEventListener("statechange", () => {
                        if (
                            newWorker.state === "installed" &&
                            navigator.serviceWorker.controller
                        ) {
                            setSwInfo((prev) => ({
                                ...prev,
                                isUpdateAvailable: true,
                            }));

                            // 自动更新：可以选择提示用户或自动刷新
                            // 这里选择自动刷新以获取最新版本
                            if (
                                window.confirm(
                                    "检测到新版本，是否刷新页面以更新？\nA new version is available. Refresh to update?"
                                )
                            ) {
                                newWorker.postMessage({ type: "SKIP_WAITING" });
                                window.location.reload();
                            }
                        }
                    });
                }
            });

            // 定期检查更新（每小时）
            setInterval(
                () => {
                    registration.update();
                },
                60 * 60 * 1000
            );
        } catch (error) {
            // Service Worker 注册失败时静默处理
            // 在开发环境下可以打印日志
            if (process.env.NODE_ENV === "development") {
                // eslint-disable-next-line no-console
                console.warn("Service Worker registration failed:", error);
            }
        }
    }, []);

    useEffect(() => {
        // 仅在生产环境或明确启用 PWA 时注册 Service Worker
        if (process.env.NODE_ENV === "production") {
            registerServiceWorker();
        }
    }, [registerServiceWorker]);

    // 监听 Service Worker 控制器变化
    useEffect(() => {
        if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
            return;
        }

        const handleControllerChange = (): void => {
            // 当新的 Service Worker 取得控制权时刷新页面
            window.location.reload();
        };

        navigator.serviceWorker.addEventListener(
            "controllerchange",
            handleControllerChange
        );

        return () => {
            navigator.serviceWorker.removeEventListener(
                "controllerchange",
                handleControllerChange
            );
        };
    }, []);

    // 此组件不渲染任何内容
    return null;
}

/**
 * 手动更新 Service Worker
 */
export async function updateServiceWorker(): Promise<boolean> {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
        return false;
    }

    try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
            await registration.update();
            return true;
        }
        return false;
    } catch {
        return false;
    }
}

/**
 * 注销 Service Worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
        return false;
    }

    try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
            return await registration.unregister();
        }
        return false;
    } catch {
        return false;
    }
}
