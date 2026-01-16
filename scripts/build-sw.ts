/**
 * Workbox Service Worker 构建脚本
 * 使用 workbox-build 的 generateSW 模式生成 Service Worker
 * 兼容 Next.js 16 turbopack
 */

import { generateSW } from "workbox-build";
import * as fs from "fs";
import * as path from "path";

const rootDir = process.cwd();
const publicDir = path.join(rootDir, "public");
const nextDir = path.join(rootDir, ".next");
const staticDir = path.join(nextDir, "static");

async function buildServiceWorker(): Promise<void> {
    console.log("🔧 开始构建 Service Worker...");

    // 检查 .next 目录是否存在
    if (!fs.existsSync(nextDir)) {
        console.log("⚠️ .next 目录不存在，创建占位 Service Worker...");
        await createPlaceholderSW();
        return;
    }

    try {
        // 收集需要预缓存的文件
        const additionalManifestEntries: Array<{ url: string; revision: string }> =
            [];

        // 添加首页
        additionalManifestEntries.push({
            url: "/",
            revision: Date.now().toString(),
        });

        // 添加 manifest.json
        if (fs.existsSync(path.join(publicDir, "manifest.json"))) {
            additionalManifestEntries.push({
                url: "/manifest.json",
                revision: Date.now().toString(),
            });
        }

        console.log("📦 生成 Service Worker...");

        const swDest = path.join(publicDir, "sw.js");

        // 确定 glob 目录
        const globDirectory = fs.existsSync(staticDir) ? nextDir : publicDir;
        const globPatterns = fs.existsSync(staticDir)
            ? ["static/**/*.{js,css,woff,woff2}"]
            : ["**/*.{ico,png,svg,woff,woff2}"];

        const { count, size, warnings } = await generateSW({
            swDest,
            globDirectory,
            globPatterns,
            // 忽略某些文件
            globIgnores: [
                "**/node_modules/**/*",
                "**/*.map",
                "**/sw.js",
                "**/workbox-*.js",
            ],
            // 额外的预缓存条目
            additionalManifestEntries,
            // 运行时缓存配置
            runtimeCaching: [
                // Google Fonts 样式表
                {
                    urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                    handler: "StaleWhileRevalidate",
                    options: {
                        cacheName: "google-fonts-stylesheets",
                        expiration: {
                            maxEntries: 10,
                            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 年
                        },
                    },
                },
                // Google Fonts Web 字体
                {
                    urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                    handler: "CacheFirst",
                    options: {
                        cacheName: "google-fonts-webfonts",
                        expiration: {
                            maxEntries: 30,
                            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 年
                        },
                        cacheableResponse: {
                            statuses: [0, 200],
                        },
                    },
                },
                // Next.js 静态资源
                {
                    urlPattern: /\/_next\/static\/.*/i,
                    handler: "CacheFirst",
                    options: {
                        cacheName: "next-static",
                        expiration: {
                            maxEntries: 200,
                            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 年 (因为有 hash)
                        },
                    },
                },
                // Next.js 图片优化
                {
                    urlPattern: /\/_next\/image\?.*/i,
                    handler: "CacheFirst",
                    options: {
                        cacheName: "next-images",
                        expiration: {
                            maxEntries: 100,
                            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 天
                        },
                    },
                },
                // 封面图片 CDN
                {
                    urlPattern: /^https:\/\/cover\.hetu-music\.com\/.*/i,
                    handler: "CacheFirst",
                    options: {
                        cacheName: "cover-images",
                        expiration: {
                            maxEntries: 200,
                            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 天
                        },
                        cacheableResponse: {
                            statuses: [0, 200],
                        },
                    },
                },
                // API 请求
                {
                    urlPattern: /\/api\/.*/i,
                    handler: "NetworkFirst",
                    options: {
                        cacheName: "api-cache",
                        networkTimeoutSeconds: 10,
                        expiration: {
                            maxEntries: 50,
                            maxAgeSeconds: 60 * 5, // 5 分钟
                        },
                        cacheableResponse: {
                            statuses: [0, 200],
                        },
                    },
                },
                // 页面导航
                {
                    urlPattern: ({ request }) =>
                        request.mode === "navigate" ||
                        request.destination === "document",
                    handler: "NetworkFirst",
                    options: {
                        cacheName: "pages-cache",
                        networkTimeoutSeconds: 10,
                        expiration: {
                            maxEntries: 50,
                            maxAgeSeconds: 60 * 60 * 24, // 1 天
                        },
                    },
                },
                // 其他静态资源
                {
                    urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
                    handler: "CacheFirst",
                    options: {
                        cacheName: "images-cache",
                        expiration: {
                            maxEntries: 100,
                            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 天
                        },
                    },
                },
            ],
            // 跳过等待并立即激活
            skipWaiting: true,
            clientsClaim: true,
            // 不启用导航预加载（可能与 Next.js 冲突）
            navigationPreload: false,
            // 使用内联 Workbox 运行时（减少额外请求）
            inlineWorkboxRuntime: true,
            // 生产模式
            mode: "production",
            // 不生成 source map
            sourcemap: false,
        });

        if (warnings.length > 0) {
            console.warn("⚠️ 警告:");
            warnings.forEach((warning) => console.warn(`   ${warning}`));
        }

        console.log(`✅ Service Worker 构建完成!`);
        console.log(
            `   预缓存了 ${count} 个文件，共 ${(size / 1024).toFixed(2)} KB`
        );
        console.log(`   输出位置: ${swDest}`);
    } catch (error) {
        console.error("❌ 构建失败:", error);
        console.log("📋 创建占位 Service Worker...");
        await createPlaceholderSW();
    }
}

/**
 * 创建占位 Service Worker
 * 当 .next 目录不存在时使用
 */
async function createPlaceholderSW(): Promise<void> {
    const swContent = `// Placeholder Service Worker
// 这是一个占位 Service Worker，请在 next build 后运行 pnpm build:sw 生成完整版本

const CACHE_NAME = 'katoweb-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // 基础网络优先策略
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
`;

    const swPath = path.join(publicDir, "sw.js");
    fs.writeFileSync(swPath, swContent);
    console.log(`✅ 占位 Service Worker 已创建: ${swPath}`);
    console.log("   请在运行 next build 后执行 pnpm build:sw 生成完整版本");
}

buildServiceWorker();
