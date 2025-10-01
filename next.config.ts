import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cover.hetu-music.com',
      },
    ],
    minimumCacheTTL: 3600,
    // 优化图片处理以减少内存占用
  },
  // 压缩配置
  compress: true,
};

export default nextConfig;
