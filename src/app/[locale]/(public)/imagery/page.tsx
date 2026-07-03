import ImageryClient from "@/components/imagery/ImageryClient";
import Loading from "@/components/shared/Loading";
import {
  getImageryCategories,
  getImageryWithCounts,
} from "@/lib/server/service-imagery";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Suspense } from "react";

type Props = {
  params: Promise<{ locale: string }>;
};

// 动态生成意象词云 SEO 元数据
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });

  const [items, categories] = await Promise.all([
    getImageryWithCounts().catch(() => []),
    getImageryCategories().catch(() => []),
  ]);

  const count = items.length;
  const categoryNames = categories
    .slice(0, 6)
    .map((c) => c.name)
    .join("、");

  const description = `在 ${count} 个精选意象中发现河图音乐的诗意世界。涵盖 ${categoryNames} 等分类，探索山川、日月、草木、时令在歌词中的流转。`;
  const siteName = t("site.name");

  return {
    title: "意象词云",
    description,
    keywords: [
      "河图",
      "音乐",
      "歌词",
      "意象",
      "词云",
      "诗意",
      "国风",
      "中国风",
      "古风",
      "歌曲鉴赏",
      "文学性",
    ],
    alternates: {
      canonical: "/imagery",
      languages: {
        "zh-CN": "https://hetu-music.com/imagery",
        "zh-TW": "https://hetu-music.com/zh-TW/imagery",
      },
    },
    openGraph: {
      title: `意象词云 - ${siteName}`,
      description,
      type: "website",
      images: [{ url: "/icons/source.png" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `意象词云 - ${siteName}`,
      description,
      images: ["/icons/source.png"],
    },
  };
}

export default async function ImageryPage() {
  const [items, categories] = await Promise.all([
    getImageryWithCounts().catch(() => []),
    getImageryCategories().catch(() => []),
  ]);

  const count = items.length;
  const categoryNames = categories
    .slice(0, 6)
    .map((c) => c.name)
    .join("、");
  const description = `在 ${count} 个精选意象中发现河图音乐的诗意世界。涵盖 ${categoryNames} 等分类，探索山川、日月、草木、时令在歌词中的流转。`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "意象词云 - 河图作品勘鉴",
    description: description,
    url: "https://hetu-music.com/imagery",
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
        <ImageryClient items={items} categories={categories} />
      </Suspense>
    </>
  );
}

export const revalidate = 7200;
