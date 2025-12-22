import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthenticatedUser } from "@/lib/server-auth";
import { createSupabaseServerClient } from "@/lib/auth-supabase";

export const POST = withAuth(
  async (request: NextRequest, user: AuthenticatedUser) => {
    const { oldPassword, newPassword } = await request.json();
    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
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
