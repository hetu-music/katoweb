import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import PreferenceLabClient from "@/components/music-preferences/PreferenceLabClient";
import { getSongs } from "@/lib/server/service-songs";
import type { Song } from "@/lib/types";

interface PreferencePageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PreferencePageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "河图全库偏好排序",
    description: "通过成对比较，建立只属于你的河图歌曲偏好谱系。",
    alternates: {
      canonical: `https://hetu-music.com/${locale}/music-cup/preferences`,
    },
  };
}

export default async function PreferencePage({ params }: PreferencePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  let songs: Song[] = [];
  try {
    songs = await getSongs(undefined, undefined, true, locale);
  } catch (error) {
    console.error("[music-preferences] Failed to load catalog", error);
  }
  return <PreferenceLabClient songs={songs} locale={locale} />;
}

export const revalidate = 7200;
