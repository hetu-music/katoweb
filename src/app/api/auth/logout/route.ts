import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { verifyCSRFToken } from "@/app/lib/utils.server";

export async function POST(request: NextRequest) {
  if (!(await verifyCSRFToken(request))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  // 在函数内部读取环境变量
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.signOut();
  if (error) {
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
  // 清理 cookie
  cookieStore.getAll().forEach(({ name }) => {
    cookieStore.set(name, "", { maxAge: -1 });
  });
  return NextResponse.json({ success: true });
}
