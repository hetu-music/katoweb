import Loading from "@/components/shared/Loading";
import QjtxClient from "@/components/story/qjtx/QjtxClient";
import { timelineData } from "@/components/story/qjtx/data";
import type { Metadata } from "next";
import { Suspense } from "react";

const STORY_TITLE = "倾尽天下 · 编年史";

function buildDescription() {
  const firstEvent = timelineData[0];
  const lastEvent = timelineData[timelineData.length - 1];

  return `以 ${timelineData.length} 个历史节点重构《倾尽天下》的故事编年史，从${firstEvent?.year ?? "乱世初起"}到${lastEvent?.year ?? "余音未绝"}，沉浸式回望白炎、朱砂与故国山河。`;
}

export async function generateMetadata(): Promise<Metadata> {
  const description = buildDescription();

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
  const description = buildDescription();
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
        <QjtxClient />
      </Suspense>
    </>
  );
}

export const revalidate = 7200;
