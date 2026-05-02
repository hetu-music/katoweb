import Loading from "@/components/shared/Loading";
import QjtxClient from "@/components/story/qjtx/QjtxClient";
import { getQjtxTimeline } from "@/lib/service-story";
import type { Metadata } from "next";
import { Suspense } from "react";

const STORY_TITLE = "倾尽天下 · 编年史";

export async function generateMetadata(): Promise<Metadata> {
  const events = await getQjtxTimeline();
  const firstEvent = events[0];
  const secondLastEvent = events[events.length - 2] || events[events.length - 1];
  const description = `以 ${events.length} 个历史节点展现《倾尽天下》的故事，从${firstEvent?.year ?? "乱世初起"}到${secondLastEvent?.year ?? "故人长绝"}，沉浸式回望白炎、朱砂与故国山河。`;

  return {
    title: STORY_TITLE,
    description,
    keywords: [
      "倾尽天下",
      "河图",
      "编年史",
      "白炎",
      "朱砂",
      "古风音乐",
      "音乐故事",
      "Chronicle",
      "Hetu",
      "Qing Jin Tian Xia",
    ],
    authors: [{ url: "https://hetu-music.com" }],
    creator: "河图作品勘鉴",
    alternates: {
      canonical: "/story/qjtx",
    },
    openGraph: {
      title: `${STORY_TITLE} - 河图作品勘鉴`,
      description,
      type: "article",
      url: "https://hetu-music.com/story/qjtx",
      siteName: "河图作品勘鉴",
      locale: "zh_CN",
      images: [
        {
          url: "/story/qjtx/31.avif",
          width: 1200,
          height: 630,
          alt: "倾尽天下 · 编年史封面",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${STORY_TITLE} - 河图作品勘鉴`,
      description,
      images: ["/story/qjtx/31.avif"],
    },
  };
}

export default async function QingJinTianXiaPage() {
  const events = await getQjtxTimeline();

  const firstEvent = events[0];
  const secondLastEvent = events[events.length - 2] || events[events.length - 1];
  const description = `以 ${events.length} 个历史节点展现《倾尽天下》的故事，从${firstEvent?.year ?? "乱世初起"}到${secondLastEvent?.year ?? "故人长绝"}，沉浸式回望白炎、朱砂与故国山河。`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: STORY_TITLE,
    description,
    image: "https://hetu-music.com/story/qjtx/31.avif",
    publisher: {
      "@type": "Organization",
      name: "河图作品勘鉴",
      logo: {
        "@type": "ImageObject",
        url: "https://hetu-music.com/icons/icon-512x512.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": "https://hetu-music.com/story/qjtx",
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
