import { NextRequest, NextResponse } from "next/server";
import { verifyCSRFToken } from "@/lib/utils.server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  if (!(await verifyCSRFToken(request))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  try {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Supabase signOut error:", error);
      return NextResponse.json({ error: "Logout failed" }, { status: 500 });
    }

    // 更精确地清理 Supabase 相关的 cookies
    const cookieStore = await cookies();
    const supabaseCookies = cookieStore.getAll().filter(cookie => 
      cookie.name.startsWith('sb-') || 
      cookie.name === 'csrf-token'
    );
    
    supabaseCookies.forEach(({ name }) => {
      cookieStore.set(name, "", { 
        maxAge: -1,
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "strict"
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }
}
