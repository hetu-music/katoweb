import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthenticatedUser } from "@/lib/server-auth";
import { createSupabaseServerClient } from "@/lib/supabase-auth";
import { TABLES } from "@/lib/supabase-server";

/**
 * 内联 MD5 实现（Node.js 环境使用 crypto 模块）
 */
function md5(input: string): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require("crypto") as typeof import("crypto");
  return crypto.createHash("md5").update(input, "utf8").digest("hex");
}

/**
 * GET /api/navidrome/search?title=<歌曲标题>
 *
 * 服务端代理：从当前登录用户的 Navidrome 凭据出发，
 * 调用 Subsonic search3 接口按标题搜索歌曲，返回第一条匹配结果的 ID。
 *
 * 凭据在服务端读取，不暴露给客户端。
 */
export const GET = withAuth(
  async (request: NextRequest, user: AuthenticatedUser) => {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get("title")?.trim();

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    // 从数据库读取用户的 Navidrome 凭据
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select("navid_id, navid_pw, endpoint")
      .eq("id", user.id)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json(
        { error: "Failed to fetch user credentials" },
        { status: 500 },
      );
    }

    const { navid_id, navid_pw, endpoint } = data;

    if (!navid_id || !navid_pw || !endpoint) {
      return NextResponse.json(
        { error: "Navidrome credentials not configured" },
        { status: 403 },
      );
    }

    // 构造 Subsonic 鉴权参数
    const salt = Math.random().toString(36).slice(2, 10);
    const token = md5(navid_pw + salt);
    const base = (endpoint as string).replace(/\/$/, "");

    const params = new URLSearchParams({
      u: navid_id as string,
      t: token,
      s: salt,
      v: "1.16.1",
      c: "katoweb",
      f: "json",
      query: title,
      songCount: "5",
      albumCount: "0",
      artistCount: "0",
    });

    try {
      const res = await fetch(`${base}/rest/search3?${params.toString()}`, {
        headers: { "User-Agent": "katoweb/1.0" },
        // 服务端请求，设置合理超时
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        return NextResponse.json(
          { error: `Navidrome search failed: ${res.status}` },
          { status: 502 },
        );
      }

      const json = (await res.json()) as {
        "subsonic-response": {
          status: string;
          searchResult3?: {
            song?: Array<{ id: string; title: string }>;
          };
        };
      };

      const subsonicRes = json["subsonic-response"];
      if (subsonicRes.status !== "ok") {
        return NextResponse.json({ id: null });
      }

      const songs = subsonicRes.searchResult3?.song ?? [];
      if (songs.length === 0) {
        return NextResponse.json({ id: null });
      }

      // 优先精确匹配标题（忽略大小写），否则取第一条
      const exact = songs.find(
        (s) => s.title.toLowerCase() === title.toLowerCase(),
      );
      const matched = exact ?? songs[0];

      return NextResponse.json({ id: matched.id, title: matched.title });
    } catch (err) {
      console.error("[navidrome/search] fetch error:", err);
      return NextResponse.json(
        { error: "Failed to reach Navidrome server" },
        { status: 502 },
      );
    }
  },
);
