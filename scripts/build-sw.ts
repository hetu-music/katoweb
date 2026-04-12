/* eslint-disable no-console */
/**
 * Serwist Service Worker 构建脚本 (静默更新版)
 * * 特性:
 * 1. skipWaiting: true -> 下载即更新，无需用户点击
 * 2. 针对 Next.js 静态资源做 CacheFirst 优化
 * 3. 针对 API 和 HTML 做 NetworkFirst 策略
 */

import { injectManifest, type ManifestEntry } from "@serwist/build";
import * as fs from "fs";
import * as path from "path";

const rootDir = process.cwd();
const publicDir = path.join(rootDir, "public");
const nextDir = path.join(rootDir, ".next");

async function buildServiceWorker(): Promise<void> {
  console.log("🔧 开始构建 Serwist Service Worker (静默更新模式)...");

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
    // ⚠️ 注意：不要将 ISR/动态页面（如首页 "/"）放入预缓存！
    // 因为 Precache 路由的优先级高于 runtimeCaching 路由，
    // 预缓存的页面会绕过 NetworkOnly 策略，导致 PWA 始终返回旧 HTML。
    const additionalManifestEntries: ManifestEntry[] = [];

    // 可选: manifest.json（静态文件，适合预缓存）
    const manifestPath = path.join(publicDir, "manifest.json");
    if (fs.existsSync(manifestPath)) {
      additionalManifestEntries.push({
        url: "/manifest.json",
        revision: fs.statSync(manifestPath).mtimeMs.toString(),
      });
    }

    // 4. 开始生成配置
    const swDest = path.join(publicDir, "sw.js");

    const { count, size, warnings } = await injectManifest({
      swSrc: "src/sw.ts",
      swDest: "public/sw.js",
      globDirectory: "public",

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
        "**/mockServiceWorker.js", // 如果你用 MSW
        "**/.DS_Store",
      ],

      // 允许缓存较大的文件 (如字体文件)，设置为 10MB
      maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,

      additionalPrecacheEntries: additionalManifestEntries,
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
