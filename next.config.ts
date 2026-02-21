import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cover.hetu-music.com",
      },
    ],
    minimumCacheTTL: 3600,
    // 优化图片处理以减少内存占用
  },
  // 压缩配置
  compress: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },
  // OG 图片代理：爬虫通过部署服务器中转访问封面图
  async rewrites() {
    return [
      {
        source: "/og-cover/:path*",
        destination: "https://cover.hetu-music.com/cover/:path*",
      },
    ];
  },
};

export default nextConfig;
