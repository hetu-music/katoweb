import { NextRequest, NextResponse } from "next/server";
import { verifyCSRFToken, verifyTurnstileToken } from "@/lib/server-utils";
import { createSupabaseServerClient } from "@/lib/supabase-auth";

export async function POST(request: NextRequest) {
  try {
    // 1. 验证 CSRF token
    if (!(await verifyCSRFToken(request))) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }

    const body = await request.json();
    const { email, turnstileToken } = body;

    // 2. 验证 Turnstile
    const turnstileResult = await verifyTurnstileToken(turnstileToken);
    if (!turnstileResult.success) {
      return NextResponse.json(
        { error: turnstileResult.error || "人机验证失败" },
        { status: 403 },
      );
    }

    // 3. 验证邮箱
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "邮箱不能为空" }, { status: 400 });
    }

    // 4. 发送 Magic Link
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
        shouldCreateUser: true,
      },
    });

    if (error) {
      console.error("Magic link error:", error.message);
      return NextResponse.json({ error: "发送失败，请稍后重试" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Register API error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
