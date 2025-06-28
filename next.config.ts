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
  },
  // 压缩配置
  compress: true,
};

export default nextConfig;
