import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import MusicCupClient from "@/components/music-cup/MusicCupClient";
import { selectCupSongs } from "@/components/music-cup/music-cup-data";
import { getSongs } from "@/lib/server/service-songs";
import type { Song } from "@/lib/types";

interface MusicCupPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: MusicCupPageProps): Promise<Metadata> {
  const { locale } = await params;
  const canonical = `https://hetu-music.com/${locale}/music-cup`;

  return {
    title: "河图音乐杯 · 四十八曲问鼎山河",
    description:
      "四十八曲入局，十二支分席，八席遗珠归来，五重对决，问出你心中的河图魁首。",
    alternates: {
      canonical,
      languages: {
        "zh-CN": "https://hetu-music.com/zh-CN/music-cup",
        "zh-TW": "https://hetu-music.com/zh-TW/music-cup",
      },
    },
    openGraph: {
      title: "河图音乐杯 · 四十八曲问鼎山河",
      description: "十二支分席，八席遗珠归来，五重问鼎定一曲之魁。",
      type: "website",
      url: canonical,
      images: [{ url: "/icons/source.png" }],
    },
  };
}

export default async function MusicCupPage({ params }: MusicCupPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  let catalog: Song[] = [];

  try {
    catalog = await getSongs(undefined, undefined, true, locale);
  } catch (error) {
    console.error(
      "[music-cup] Failed to load live catalog; using fallback",
      error,
    );
  }

  return <MusicCupClient songs={selectCupSongs(catalog)} locale={locale} />;
}

export const revalidate = 7200;
