import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-auth";
import {
  getImageryWithCounts,
  getImageryCategories,
} from "@/lib/service-imagery";
import ImageryAdminClient from "@/components/admin/ImageryAdminClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "意象管理 - 河图作品勘鉴",
  description: "管理意象库与分类",
};

export default async function ImageryAdminPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    redirect("/login");
  }

  const [items, categories] = await Promise.all([
    getImageryWithCounts().catch(() => []),
    getImageryCategories().catch(() => []),
  ]);

  return (
    <ImageryAdminClient initialItems={items} initialCategories={categories} />
  );
}
