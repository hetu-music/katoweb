import { NextRequest, NextResponse } from "next/server";
import { verifyCSRFToken, verifyTurnstileToken } from "@/lib/server-utils";
import { createSupabaseServerClient } from "@/lib/supabase-auth";

export async function POST(request: NextRequest) {
  try {
    if (!(await verifyCSRFToken(request))) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, turnstileToken, next } = body;
    const nextPath = typeof next === "string" && next.startsWith("/") ? next : "/";

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

    if (!password || typeof password !== "string" || !/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password)) {
      return NextResponse.json({ error: "密码要求至少8位，并包含字母和数字" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    
    // Check if user already exists
    // The safest way is to just try to sign up, Supabase will return error if email exists, 
    // depending on settings. Wait, sometimes it returns a generic message.
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });

    if (error) {
      console.error("Register error:", error.message);
      return NextResponse.json({ error: error.message || "注册失败，请检查填写信息" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Register API error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
