import { NextRequest, NextResponse } from "next/server";
import { verifyCSRFToken } from "@/app/lib/utils.server";
import { createSupabaseServerClient } from "@/app/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

  // 获取当前用户
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "未登录或会话失效" }, { status: 401 });
  }

  // 查询 public.users 表的 name、display 和 intro 字段
  const { data, error } = await supabase
    .from("users")
    .select("name, display, intro")
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

    return NextResponse.json({
      displayName: data?.name || "",
      display: data?.display ?? false,
      intro: data?.intro ?? null,
    });
  } catch {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  // CSRF 验证
  if (!(await verifyCSRFToken(request))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  // 解析请求体
  const { displayName, display, intro } = await request.json();
  if (
    !displayName ||
    typeof displayName !== "string" ||
    displayName.length < 2
  ) {
    return NextResponse.json(
      { error: "用户名不能为空且不少于2个字符" },
      { status: 400 },
    );
  }

  try {
    // 初始化 Supabase 客户端
    const supabase = await createSupabaseServerClient();

  // 获取当前用户
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "未登录或会话失效" }, { status: 401 });
  }
  if (!user.id) {
    return NextResponse.json(
      { error: "用户不存在，无法更新用户名" },
      { status: 400 },
    );
  }

  // 更新 public.users 表的 name、display 和 intro 字段
  const updateObj: { name: string; display?: boolean; intro?: string | null } =
    { name: displayName };
  if (typeof display === "boolean") updateObj.display = display;
  if (typeof intro === "string" || intro === null) updateObj.intro = intro;
  const { error: updateError } = await supabase
    .from("users")
    .update(updateObj)
    .eq("id", user.id);
  if (updateError) {
    return NextResponse.json(
      { error: updateError.message || "更新失败" },
      { status: 400 },
    );
  }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }
}
