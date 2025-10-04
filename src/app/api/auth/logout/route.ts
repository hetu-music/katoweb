import { NextRequest, NextResponse } from "next/server";
import { verifyCSRFToken } from "@/app/lib/utils.server";
import { createSupabaseServerClient } from "@/app/lib/supabase-server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  if (!(await verifyCSRFToken(request))) {
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  try {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.auth.signOut();
    if (error) {
      return NextResponse.json({ error: "Logout failed" }, { status: 500 });
    }
    // 清理 cookie
    const cookieStore = await cookies();
    cookieStore.getAll().forEach(({ name }) => {
      cookieStore.set(name, "", { maxAge: -1 });
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }
}
