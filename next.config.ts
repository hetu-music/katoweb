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
  // ISR 优化配置
  experimental: {
    // 启用更快的构建
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  // 压缩配置
  compress: true,
  // 生产环境优化
  swcMinify: true,
};

export default nextConfig;
