import ImageryClient from "@/components/imagery/ImageryClient";
import Loading from "@/components/shared/Loading";
import {
  getImageryCategories,
  getImageryWithCounts,
} from "@/lib/service-imagery";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "意象词云 - 河图作品勘鉴",
  description:
    "河图作品中的意象 - 山川、日月、草木、时令……词语化星点，各自成诗。",
  openGraph: {
    title: "意象词云 - 河图作品勘鉴",
    description:
      "河图作品中的意象 - 山川、日月、草木、时令……词语化星点，各自成诗。",
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
