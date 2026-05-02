import Loading from "@/components/shared/Loading";
import QjtxClient from "@/components/story/qjtx/QjtxClient";
import { getQjtxTimeline } from "@/lib/service-story";
import type { Metadata } from "next";
import { Suspense } from "react";

const STORY_TITLE = "倾尽天下 · 编年史";

export async function generateMetadata(): Promise<Metadata> {
  const events = await getQjtxTimeline();
  const firstEvent = events[0];
  const lastEvent = events[events.length - 1];
  const description = `以 ${events.length} 个历史节点重构《倾尽天下》的故事编年史，从${firstEvent?.year ?? "乱世初起"}到${lastEvent?.year ?? "余音未绝"}，沉浸式回望白炎、朱砂与故国山河。`;

  return {
    title: STORY_TITLE,
    description,
    alternates: {
      canonical: "/story/qjtx",
    },
    openGraph: {
      title: `${STORY_TITLE} - 河图作品勘鉴`,
      description,
      type: "article",
      images: [{ url: "/icons/source.png" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${STORY_TITLE} - 河图作品勘鉴`,
      description,
      images: ["/icons/source.png"],
    },
  };
}

export default async function QingJinTianXiaPage() {
  const events = await getQjtxTimeline();

  const firstEvent = events[0];
  const lastEvent = events[events.length - 1];
  const description = `以 ${events.length} 个历史节点重构《倾尽天下》的故事编年史，从${firstEvent?.year ?? "乱世初起"}到${lastEvent?.year ?? "余音未绝"}，沉浸式回望白炎、朱砂与故国山河。`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: STORY_TITLE,
    description,
    url: "https://hetu-music.com/story/qjtx",
    isPartOf: {
      "@type": "WebSite",
      name: "河图作品勘鉴",
      url: "https://hetu-music.com",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={<Loading />}>
        <QjtxClient events={events} />
      </Suspense>
    </>
  );
}

export const revalidate = 7200;
