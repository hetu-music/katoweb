import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthenticatedUser } from "@/lib/server-auth";
import { getServiceClient, TABLES } from "@/lib/supabase-server";

const PAGE_SIZE = 50;

export const GET = withAuth(
  async (request: NextRequest, _user: AuthenticatedUser) => {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const supabase = getServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "服务暂不可用" }, { status: 503 });
    }

    const { data, error, count } = await supabase
      .from(TABLES.AUDIT_LOGS)
      .select("id, table_name, action_type, user_id, old_data, new_data, changed_at", {
        count: "exact",
      })
      .order("changed_at", { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      logs: data ?? [],
      total: count ?? 0,
      page,
      pageSize: PAGE_SIZE,
    });
  },
  { requireSuperAdmin: true },
);
