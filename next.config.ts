import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.hetu-music.com',
      },
      {
        protocol: 'https',
        hostname: 'hetu-music.com',
      },
    ],
  },
  /* config options here */
};

export default nextConfig;
