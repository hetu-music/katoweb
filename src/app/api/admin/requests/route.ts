import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, type AuthenticatedUser } from "@/lib/server-auth";
import { createSupabaseServerClient } from "@/lib/supabase-auth";
import { getServiceClient, TABLES } from "@/lib/supabase-server";

// ─── 回复 schema ──────────────────────────────────────────────────────────────

const replySchema = z.object({
  id: z.string().uuid("请求 ID 格式无效"),
  reply: z.string().min(1, "回复内容不能为空").max(2000),
  status: z.enum(["replied", "approved", "rejected"]),
});

// ─── GET: 管理员获取请求列表 ──────────────────────────────────────────────────
// 普通管理员只能看 song_feedback，超管可以看全部

export const GET = withAuth(
  async (request: NextRequest, user: AuthenticatedUser) => {
    const appMeta = user.app_metadata;
    const isSuper = appMeta?.is_super === true;

    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get("type"); // 可选过滤
    const statusFilter = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const pageSize = 20;
    const from = (page - 1) * pageSize;

    const supabase = getServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "服务暂不可用" }, { status: 503 });
    }

    // 构建查询：关联 users 表获取用户名，关联 music 表获取歌曲标题
    let query = supabase
      .from(TABLES.USER_REQUESTS)
      .select(
        `
        *,
        users:user_id ( name ),
        music:song_id ( title )
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);

    // 普通管理员只能看 song_feedback
    if (!isSuper) {
      query = query.eq("type", "song_feedback");
    } else if (typeFilter) {
      query = query.eq("type", typeFilter);
    }

    if (statusFilter) {
      query = query.eq("status", statusFilter);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 展平关联字段
    const requests = (data ?? []).map((row) => ({
      ...row,
      user_name: (row.users as { name?: string } | null)?.name ?? null,
      song_title: (row.music as { title?: string } | null)?.title ?? null,
      users: undefined,
      music: undefined,
    }));

    return NextResponse.json({
      requests,
      total: count ?? 0,
      page,
      pageSize,
    });
  },
  { requireAdmin: true },
);

// ─── PUT: 管理员回复/处理请求 ─────────────────────────────────────────────────

export const PUT = withAuth(
  async (request: NextRequest, user: AuthenticatedUser) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "请求体格式无效" }, { status: 400 });
    }

    const parsed = replySchema.safeParse(body);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstIssue?.message ?? "参数校验失败" },
        { status: 400 },
      );
    }

    const { id, reply, status } = parsed.data;
    const appMeta = user.app_metadata;
    const isSuper = appMeta?.is_super === true;

    // 先查出这条请求，校验权限
    const serviceClient = getServiceClient();
    if (!serviceClient) {
      return NextResponse.json({ error: "服务暂不可用" }, { status: 503 });
    }

    const { data: existing, error: fetchError } = await serviceClient
      .from(TABLES.USER_REQUESTS)
      .select("type")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "请求不存在" }, { status: 404 });
    }

    // 普通管理员只能处理 song_feedback
    if (!isSuper && existing.type !== "song_feedback") {
      return NextResponse.json({ error: "权限不足" }, { status: 403 });
    }

    // 使用用户权限客户端（受 RLS 约束，确保安全）
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
      .from(TABLES.USER_REQUESTS)
      .update({
        reply,
        status,
        replied_by: user.id,
        replied_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  },
  { requireAdmin: true, requireCSRF: true },
);
