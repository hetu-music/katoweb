import { NextRequest, NextResponse } from "next/server";
import { verifyCSRFToken, verifyTurnstileToken } from "@/lib/server-utils";
import { createSupabaseServerClient } from "@/lib/supabase-auth";

export async function POST(request: NextRequest) {
  try {
    if (!(await verifyCSRFToken(request))) {
      return NextResponse.json(
        { error: "Invalid CSRF token" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { email, password, turnstileToken } = body;

    const turnstileResult = await verifyTurnstileToken(turnstileToken);
    if (!turnstileResult.success) {
      return NextResponse.json(
        { error: turnstileResult.error || "人机验证失败" },
        { status: 403 },
      );
    }

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "邮箱不能为空" }, { status: 400 });
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "密码不能为空" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login error:", error.message);
      return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
