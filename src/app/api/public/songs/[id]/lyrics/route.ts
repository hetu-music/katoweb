import { NextResponse } from "next/server";
import { getServiceClient, TABLES } from "@/lib/supabase-server";

export const GET = async (
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params;
  const songId = parseInt(id, 10);

  if (isNaN(songId)) {
    return NextResponse.json({ error: "Invalid song id" }, { status: 400 });
  }

  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase not available" },
      { status: 500 },
    );
  }

  const { data, error } = await supabase
    .from(TABLES.MUSIC)
    .select("lyrics")
    .eq("id", songId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Song not found" }, { status: 404 });
  }

  return NextResponse.json(
    { lyrics: data.lyrics ?? null },
    {
      headers: {
        // CDN 缓存 6 小时，客户端缓存 30 分钟
        "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=1800",
      },
    },
  );
};
