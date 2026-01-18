/* eslint-disable no-console */
/**
 * Workbox Service Worker 构建脚本 (静默更新版)
 * * 特性:
 * 1. skipWaiting: true -> 下载即更新，无需用户点击
 * 2. 针对 Next.js 静态资源做 CacheFirst 优化
 * 3. 针对 API 和 HTML 做 NetworkFirst 策略
 */

import { generateSW, ManifestEntry } from "workbox-build";
import * as fs from "fs";
import * as path from "path";

const rootDir = process.cwd();
const publicDir = path.join(rootDir, "public");
const nextDir = path.join(rootDir, ".next");

async function buildServiceWorker(): Promise<void> {
  console.log("🔧 开始构建 Service Worker (静默更新模式)...");

  // 1. 安全检查: 确保 public 目录存在
  if (!fs.existsSync(publicDir)) {
    console.error("❌ 错误: public 目录不存在");
    process.exit(1);
  }

  // 2. 检查 .next 是否存在 (如果是第一次运行，可能还没 build)
  if (!fs.existsSync(nextDir)) {
    console.warn("⚠️ .next 目录不存在，将生成简易占位符 SW 以防止报错...");
    await createPlaceholderSW();
    return;
  }

  try {
    // 3. 准备预缓存列表 (Precache)
    // 这些文件会在 SW 安装时立即下载
    const additionalManifestEntries: ManifestEntry[] = [];

    // 必选: 首页
    additionalManifestEntries.push({
      url: "/",
      revision: Date.now().toString(), // 强制每次构建都更新首页缓存
    });

    // 可选: manifest.json
    if (fs.existsSync(path.join(publicDir, "manifest.json"))) {
      additionalManifestEntries.push({
        url: "/manifest.json",
        revision: Date.now().toString(),
      });
    }

    // 4. 开始生成配置
    const swDest = path.join(publicDir, "sw.js");

    const { count, size, warnings } = await generateSW({
      swDest,
      globDirectory: publicDir,

      // 扫描 public 目录下的静态资源
      globPatterns: [
        "icons/**/*.{png,jpg,svg}", // 你的图标文件夹
        "fonts/**/*.{woff2,woff,ttf}", // 你的字体文件夹
      ],

      // 忽略列表
      globIgnores: [
        "**/node_modules/**/*",
        "**/*.map",
        "**/sw.js",
        "**/sw.js.map",
        "**/workbox-*.js",
        "**/mockServiceWorker.js", // 如果你用 MSW
        "**/.DS_Store",
      ],

      // 允许缓存较大的文件 (如字体文件)，设置为 10MB
      maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,

      additionalManifestEntries,

      // 🔥 核心配置: 静默更新 🔥
      skipWaiting: true, // 下载完立即接管，不等待
      clientsClaim: true, // 立即控制页面
      cleanupOutdatedCaches: true, // 自动清理旧版本缓存

      // 模式配置
      mode: "production",
      sourcemap: false,
      inlineWorkboxRuntime: true, // 把 runtime 代码内联进去，减少 HTTP 请求
      navigationPreload: false, // 简单起见关闭，避免与 Next.js 路由冲突

      // 🧠 运行时缓存策略 (Runtime Caching)
      runtimeCaching: [
        // 1. Google Fonts 样式 (StaleWhileRevalidate)
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: "StaleWhileRevalidate",
          options: {
            cacheName: "google-fonts-stylesheets",
          },
        },
        // 2. Google Fonts 字体文件 (CacheFirst - 它们几乎不更新)
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "google-fonts-webfonts",
            expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
          },
        },
        // 3. Next.js 静态资源 (JS/CSS chunks)
        // 这里的关键是：文件名带 Hash，所以一旦文件名变了就是新版本，
        // 旧文件名永远对应旧内容。所以用 CacheFirst 最快。
        {
          urlPattern: /\/_next\/static\/.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "next-static-assets",
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24 * 365, // 1年
            },
          },
        },
        // 4. Next.js 图片优化 API
        {
          urlPattern: /\/_next\/image\?.*/i,
          handler: "StaleWhileRevalidate", // 图片可能会变，用 SWR 比较稳妥
          options: {
            cacheName: "next-optimized-images",
            expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 7 }, // 7天
          },
        },
        // 5. 河图封面图 CDN (针对你的具体业务)
        {
          urlPattern: /^https:\/\/cover\.hetu-music\.com\/.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "cover-images",
            expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        // 6. API 接口数据
        {
          urlPattern: /\/api\/.*/i,
          handler: "NetworkFirst", // 优先取最新数据
          options: {
            cacheName: "api-data",
            networkTimeoutSeconds: 5, // 5秒连不上就读缓存
            expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 }, // 5分钟缓存
          },
        },
        // 7. 页面导航 (HTML)
        // 使用 NetworkOnly 确保页面总是从网络获取最新内容
        // 这样新添加的条目可以立即显示，不会被 Service Worker 缓存阻挡
        {
          urlPattern: ({ request }) => request.mode === "navigate",
          handler: "NetworkOnly",
        },
      ],
    });

    if (warnings.length > 0) {
      console.warn("⚠️ 生成过程有警告:");
      warnings.forEach((w) => console.warn(`  - ${w}`));
    }

    console.log(`✅ Service Worker 构建成功!`);
    console.log(`   位置: ${swDest}`);
    console.log(`   预缓存: ${count} 个文件, ${(size / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error("❌ 构建失败:", error);
    process.exit(1);
  }
}

/**
 * 创建简单的占位 SW
 * 用于防止开发环境下找不到 sw.js 报错
 */
async function createPlaceholderSW(): Promise<void> {
  const swContent = `
// 这是一个占位 Service Worker
// 请运行 build 脚本生成正式版本
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
`;
  fs.writeFileSync(path.join(publicDir, "sw.js"), swContent);
  console.log("✅ 占位 Service Worker 已生成");
}

buildServiceWorker();
