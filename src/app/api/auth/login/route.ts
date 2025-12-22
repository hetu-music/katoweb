import { NextRequest, NextResponse } from "next/server";
import {
  verifyCSRFToken,
  verifyTurnstileToken,
} from "@/lib/server-utils";
import { createSupabaseServerClient } from "@/lib/supabase-auth";

export async function POST(request: NextRequest) {
  try {
    // 1. 验证 CSRF token
    if (!(await verifyCSRFToken(request))) {
      return NextResponse.json(
        { error: "Invalid CSRF token" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { email, password, turnstileToken } = body;

    // 2. 验证 Turnstile token
    const turnstileResult = await verifyTurnstileToken(turnstileToken);
    if (!turnstileResult.success) {
      console.warn("Turnstile verification failed:", turnstileResult.error);
      return NextResponse.json(
        {
          error: turnstileResult.error || "人机验证失败",
          errorCodes: turnstileResult.errorCodes,
        },
        { status: 403 },
      );
    }

    // 3. 验证邮箱和密码
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    // 4. 执行登录
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Supabase auth error:", error.message);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    if (!data.session) {
      console.error("Login failed: No session created");
      return NextResponse.json({ error: "Login failed" }, { status: 401 });
    }

    // 登录成功，返回 200
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }
}
