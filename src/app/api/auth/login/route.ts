import { NextRequest, NextResponse } from "next/server";
import { verifyCSRFToken } from "@/lib/server-utils";
import { createSupabaseServerClient } from "@/lib/supabase-auth";

export async function POST(request: NextRequest) {
  try {
    if (!(await verifyCSRFToken(request))) {
      return NextResponse.json(
        { error: "Invalid CSRF token" },
        { status: 403 },
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

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
