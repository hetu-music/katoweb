import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthenticatedUser } from "@/lib/server-auth";
import { createSupabaseServerClient } from "@/lib/supabase-auth";

export const POST = withAuth(
  async (request: NextRequest, user: AuthenticatedUser) => {
    const body = await request.json();
    const oldPassword: string = body.oldPassword;
    const newPassword: string = body.newPassword;

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    }

    // 新密码格式校验
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "新密码不能少于8位" },
        { status: 400 },
      );
    }
    if (!/[a-zA-Z]/.test(newPassword)) {
      return NextResponse.json(
        { error: "新密码需包含至少一个字母" },
        { status: 400 },
      );
    }
    if (!/[0-9]/.test(newPassword)) {
      return NextResponse.json(
        { error: "新密码需包含至少一个数字" },
        { status: 400 },
      );
    }

    try {
      const supabase = await createSupabaseServerClient();

      if (!user.email) {
        return NextResponse.json(
          { error: "用户不存在，无法验证密码" },
          { status: 400 },
        );
      }

      // 验证旧密码
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: oldPassword,
      });
      if (verifyError) {
        return NextResponse.json({ error: "旧密码错误" }, { status: 400 });
      }

      // 修改密码
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) {
        return NextResponse.json(
          { error: updateError.message || "修改失败" },
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
  },
  { requireCSRF: true },
);
