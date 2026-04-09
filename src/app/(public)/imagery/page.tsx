import type { Metadata } from "next";
import { Suspense } from "react";
import {
  getImageryCategories,
  getImageryWithCounts,
} from "@/lib/service-imagery";
import ImageryClient from "@/components/imagery/ImageryClient";
import Loading from "@/components/shared/Loading";

export const metadata: Metadata = {
  title: "意象",
  description:
    "河图作品中的意象索引——山川、日月、草木、时令……词语在这里化为星点，各自成诗。",
  openGraph: {
    title: "意象 - 河图作品勘鉴",
    description:
      "河图作品中的意象索引——山川、日月、草木、时令……词语在这里化为星点，各自成诗。",
    type: "website",
    images: [{ url: "/icons/source.png" }],
  },
};

export default async function ImageryPage() {
  const [items, categories] = await Promise.all([
    getImageryWithCounts().catch(() => []),
    getImageryCategories().catch(() => []),
  ]);

  return (
    <Suspense fallback={<Loading />}>
      <ImageryClient items={items} categories={categories} />
    </Suspense>
  );
}

export const revalidate = 7200;
