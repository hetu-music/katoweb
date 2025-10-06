import { NextRequest, NextResponse } from "next/server";
import { verifyCSRFToken } from "@/app/lib/utils.server";
import { createSupabaseServerClient } from "@/app/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    // 验证 CSRF token
    if (!(await verifyCSRFToken(request))) {
      return NextResponse.json(
        { error: "Invalid CSRF token" },
        { status: 403 },
      );
    }

    // 验证用户身份
    const supabase = await createSupabaseServerClient();

    // 优先用 Authorization header
    const authHeader = request.headers.get("authorization");
    let token: string | undefined;
    if (authHeader) {
      // 严格校验 Bearer token 格式
      const match = authHeader.match(/^Bearer ([A-Za-z0-9\-._~+/]+=*)$/);
      if (match) {
        token = match[1];
      }
    } else {
      // 没有 header 时，取 session 里的 access_token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      token = session?.access_token;
    }

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const songId = searchParams.get("songId");
    const fileType = searchParams.get("type"); // 'cover' 或 'score'

    if (!songId || !fileType) {
      return NextResponse.json(
        { error: "Missing songId or type parameter" },
        { status: 400 },
      );
    }

    if (!["cover", "score"].includes(fileType)) {
      return NextResponse.json(
        { error: "Invalid file type. Must be 'cover' or 'score'" },
        { status: 400 },
      );
    }

    // 构建文件URL
    const baseUrl = "https://cover.hetu-music.com";
    const filePath =
      fileType === "cover" ? `cover/${songId}.jpg` : `nmn/${songId}.jpg`;
    const fileUrl = `${baseUrl}/${filePath}`;

    // 发送HEAD请求检查文件是否存在
    const response = await fetch(fileUrl, {
      method: "HEAD",
    });

    const exists = response.status === 200;

    return NextResponse.json({
      exists,
      songId: parseInt(songId),
      fileType,
      url: fileUrl,
    });
  } catch (error) {
    console.error("Check file error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
