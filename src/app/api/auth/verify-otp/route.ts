import { NextRequest, NextResponse } from "next/server";
import { verifyCSRFToken, verifyTurnstileToken } from "@/lib/server-utils";
import { createSupabaseServerClient } from "@/lib/supabase-auth";

/**
 * OTP 验证码验证端点
 *
 * 流程：
 *   1. 用户注册后收到邮件中的 6 位验证码
 *   2. 用户在页面上输入验证码
 *   3. 前端调用此接口验证
 *   4. 验证成功后建立会话，用户自动登录
 */
export async function POST(request: NextRequest) {
  try {
    if (!(await verifyCSRFToken(request))) {
      return NextResponse.json(
        { error: "Invalid CSRF token" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { email, otp, turnstileToken } = body;

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

    if (!otp || typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: "请输入6位数字验证码" },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "signup",
    });

    if (error) {
      console.error("OTP verify error:", error.message);

      // 对常见错误给出友好提示
      if (error.message.includes("expired")) {
        return NextResponse.json(
          { error: "验证码已过期，请重新注册获取新的验证码" },
          { status: 400 },
        );
      }
      if (
        error.message.includes("invalid") ||
        error.message.includes("Invalid")
      ) {
        return NextResponse.json(
          { error: "验证码错误，请检查后重新输入" },
          { status: 400 },
        );
      }

      return NextResponse.json(
        { error: error.message || "验证失败" },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Verify OTP API error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
