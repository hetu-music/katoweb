import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: "缺少验证令牌" },
        { status: 400 },
      );
    }

    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) {
      console.error("TURNSTILE_SECRET_KEY 未配置");
      return NextResponse.json(
        { success: false, error: "服务器配置错误" },
        { status: 500 },
      );
    }

    // 验证 Turnstile token
    const verifyResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          secret: secretKey,
          response: token,
        }),
      },
    );

    const verifyData = await verifyResponse.json();

    if (verifyData.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "验证失败",
          errorCodes: verifyData["error-codes"],
        },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Turnstile 验证错误:", error);
    return NextResponse.json(
      { success: false, error: "验证服务异常" },
      { status: 500 },
    );
  }
}
