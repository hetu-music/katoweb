import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cover.hetu-music.com',
      },
    ],
  },
};

export default nextConfig;
