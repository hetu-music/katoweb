"use client";

import { useEffect, useState, useCallback } from "react";

interface ServiceWorkerRegistrationInfo {
    isSupported: boolean;
    isRegistered: boolean;
    isUpdateAvailable: boolean;
    registration: ServiceWorkerRegistration | null;
}

// 存储 beforeinstallprompt 事件
let deferredPrompt: BeforeInstallPromptEvent | null = null;

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
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

            // eslint-disable-next-line no-console
            console.log("✅ Service Worker 注册成功:", registration.scope);

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
            // eslint-disable-next-line no-console
            console.warn("❌ Service Worker 注册失败:", error);
        }
    }, []);

    useEffect(() => {
        // 注册 Service Worker（开发和生产环境都注册）
        registerServiceWorker();
    }, [registerServiceWorker]);

    // 监听 beforeinstallprompt 事件
    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        const handleBeforeInstallPrompt = (e: Event): void => {
            // 阻止默认的安装提示
            e.preventDefault();
            // 保存事件以便稍后使用
            deferredPrompt = e as BeforeInstallPromptEvent;
            // eslint-disable-next-line no-console
            console.log("📱 PWA 可安装，可调用 promptPWAInstall() 触发安装提示");
        };

        const handleAppInstalled = (): void => {
            // eslint-disable-next-line no-console
            console.log("✅ PWA 已安装");
            deferredPrompt = null;
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.addEventListener("appinstalled", handleAppInstalled);

        return () => {
            window.removeEventListener(
                "beforeinstallprompt",
                handleBeforeInstallPrompt
            );
            window.removeEventListener("appinstalled", handleAppInstalled);
        };
    }, []);

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
 * 触发 PWA 安装提示
 * @returns 是否成功触发安装提示
 */
export async function promptPWAInstall(): Promise<boolean> {
    if (!deferredPrompt) {
        // eslint-disable-next-line no-console
        console.log("⚠️ PWA 安装提示不可用");
        return false;
    }

    try {
        // 显示安装提示
        await deferredPrompt.prompt();
        // 等待用户响应
        const { outcome } = await deferredPrompt.userChoice;
        // eslint-disable-next-line no-console
        console.log(`用户选择: ${outcome}`);

        // 清除保存的事件
        deferredPrompt = null;

        return outcome === "accepted";
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error("PWA 安装失败:", error);
        return false;
    }
}

/**
 * 检查 PWA 是否可安装
 */
export function isPWAInstallable(): boolean {
    return deferredPrompt !== null;
}

/**
 * 检查是否以 PWA 模式运行
 */
export function isRunningAsPWA(): boolean {
    if (typeof window === "undefined") {
        return false;
    }

    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        // @ts-expect-error - Safari 特有属性
        window.navigator.standalone === true
    );
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
