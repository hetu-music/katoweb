import type { MetadataRoute } from "next";
import { getSongs } from "@/lib/service-songs";

const SITE_URL = "https://hetu-music.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // 静态页面
    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: SITE_URL,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 1.0,
        },
    ];

    // 动态歌曲详情页面
    try {
        const songs = await getSongs(undefined, undefined, true);

        const songRoutes: MetadataRoute.Sitemap = songs.map((song) => ({
            url: `${SITE_URL}/song/${song.id}`,
            changeFrequency: "weekly" as const,
            priority: 0.8,
        }));

        return [...staticRoutes, ...songRoutes];
    } catch (error) {
        console.error("Error generating sitemap:", error);
        // 如果获取歌曲失败，至少返回静态路由
        return staticRoutes;
    }
}
