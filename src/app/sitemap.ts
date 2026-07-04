import { getSongs } from "@/lib/server/service-songs";
import type { MetadataRoute } from "next";

const SITE_URL = "https://hetu-music.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 静态页面 - zh-CN 和 zh-TW 都使用显式 locale 前缀
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/zh-CN`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/zh-TW`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/zh-CN/imagery`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/zh-TW/imagery`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/zh-CN/story/qjtx`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/zh-TW/story/qjtx`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  // 动态歌曲详情页面
  try {
    const songs = await getSongs(undefined, undefined, true);

    const songRoutes: MetadataRoute.Sitemap = songs.flatMap((song) => [
      {
        url: `${SITE_URL}/zh-CN/song/${song.id}`,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      },
      {
        url: `${SITE_URL}/zh-TW/song/${song.id}`,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      },
    ]);

    return [...staticRoutes, ...songRoutes];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return staticRoutes;
  }
}

// 使用 ISR，与主页同步更新
export const revalidate = 7200;
