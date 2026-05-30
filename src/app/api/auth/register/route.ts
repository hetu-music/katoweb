import { NextRequest, NextResponse } from "next/server";
import {
  verifyCSRFToken,
  verifyTurnstileToken,
} from "@/lib/server/server-utils";
import { createSupabaseServerClient } from "@/lib/db/supabase-auth";

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

    if (
      !password ||
      typeof password !== "string" ||
      !/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password)
    ) {
      return NextResponse.json(
        { error: "密码要求至少8位，并包含字母和数字" },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();

    // 使用 OTP 验证码方式，不需要 emailRedirectTo，用户会在页面上输入邮件中的验证码
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error("Register error:", error.message);
      return NextResponse.json(
        { error: error.message || "注册失败，请检查填写信息" },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Register API error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
