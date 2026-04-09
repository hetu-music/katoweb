import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  // 查询 users 表
  const { data, error } = await supabase
    .from("users")
    .select("name, display, intro, sort_order")
    .eq("display", true)
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 直接返回完整信息
  return NextResponse.json({ contributors: data || [] });
}
