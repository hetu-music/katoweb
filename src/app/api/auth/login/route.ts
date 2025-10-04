import { NextRequest, NextResponse } from "next/server";
import { verifyCSRFToken } from "@/app/lib/utils.server";
import { createSupabaseServerClient } from "@/app/lib/supabase-server";

export async function POST(request: NextRequest) {
  if (!(await verifyCSRFToken(request))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }
  const { email, password } = await request.json();

  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }
    if (!data.session) {
      return NextResponse.json({ error: "Login failed" }, { status: 401 });
    }
    // 登录成功，返回 200
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }
}
